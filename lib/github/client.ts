import { GET_REPO_METADATA, GET_REPO_FILE_TREE, GET_FILE_CONTENT } from "./queries";
import { filterCommits } from "./parser";

/**
 * lib/github/client.ts
 *
 * This module acts as the hybrid GitHub API Client Orchestrator, implementing
 * Phase 2's specific rate-limiting optimizations.
 * 
 * Under the hood, this client splits operations across GitHub's distinct rate-limiting systems:
 * 1. GraphQL v4: Used to traverse deep nested folder structures and download file tree metadata
 *    in a single cost-effective network call.
 * 2. REST v3: Used to fetch commit logs and parse Markdown files like READMEs.
 */

const GITHUB_API_URL = "https://api.github.com";

/**
 * Retrieves the configured authentication token.
 * Defaults to GITHUB_TOKEN or GITHUB_PAT. If neither is available, it gracefully
 * falls back to unauthenticated calls while issuing a console warning.
 */
function getGitHubToken(): string {
  const token = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT;
  if (!token) {
    console.warn(
      "[GitHub Client] WARNING: GITHUB_TOKEN or GITHUB_PAT env variable is missing. " +
      "API requests will run unauthenticated with a strict rate limit of 60 requests/hr."
    );
  }
  return token || "";
}

/**
 * Helper to compile standard headers for GitHub API authentication and versioning.
 */
function getHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const token = getGitHubToken();
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "syncresume-portfolio-engine",
    ...extraHeaders,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

export interface FileNode {
  name: string;
  path: string;
  type: "blob" | "tree";
  size?: number;
  isBinary?: boolean;
  children?: FileNode[];
}

/**
 * Recursively parses the nested 3-level GraphQL Tree entries into a standard, clean folder node array.
 */
export function parseGraphQLTree(entries: any[], parentPath = ""): FileNode[] {
  if (!entries || !Array.isArray(entries)) return [];

  return entries.map((entry: any) => {
    const currentPath = parentPath ? `${parentPath}/${entry.name}` : entry.name;
    const node: FileNode = {
      name: entry.name, 
      path: currentPath,
      type: entry.type === "tree" ? "tree" : "blob",
    };

    if (entry.type === "blob" && entry.object) {
      node.size = entry.object.byteSize;
      node.isBinary = entry.object.isBinary;
    } else if (entry.type === "tree" && entry.object?.entries) {
      node.children = parseGraphQLTree(entry.object.entries, currentPath);
    }

    return node;
  });
}

/**
 * 1. High-Level GraphQL v4 Fetch Helper
 */
export async function fetchGitHubGraphQL<T>(
  query: string,
  variables: Record<string, any> = {}
): Promise<T> {
  const response = await fetch(`${GITHUB_API_URL}/graphql`, {
    method: "POST",
    headers: getHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 0 }, // Disable NextJS native fetch caching to let our Redis/Firestore pipeline coordinate it
  });

  const payload = await response.json();

  if (!response.ok || payload.errors) {
    const errorMsg = payload.errors ? JSON.stringify(payload.errors) : response.statusText;
    throw new Error(`[GitHub GraphQL Error] ${response.status}: ${errorMsg}`);
  }

  return payload.data as T;
}

/**
 * 2. High-Level REST v3 Fetch Helper with ETag/Conditional Cache Headers Support
 */
export async function fetchGitHubREST(
  endpoint: string,
  options: RequestInit = {},
  conditionalHeaders: { etag?: string; lastModified?: string } = {}
): Promise<{ data: any; status: number; headers: Headers }> {
  const requestHeaders: Record<string, string> = {};

  if (conditionalHeaders.etag) {
    requestHeaders["If-None-Match"] = conditionalHeaders.etag;
  }
  if (conditionalHeaders.lastModified) {
    requestHeaders["If-Modified-Since"] = conditionalHeaders.lastModified;
  }

  const response = await fetch(`${GITHUB_API_URL}${endpoint}`, {
    ...options,
    headers: getHeaders({ ...options.headers, ...requestHeaders }),
    next: { revalidate: 0 }, // Handled explicitly by our caching tier
  });

  // A 304 means the database copy is up to date and does not deplete rate-limit credits
  if (response.status === 304) {
    return { data: null, status: 304, headers: response.headers };
  }

  if (!response.ok) {
    throw new Error(`[GitHub REST Error] ${response.status}: ${response.statusText} at ${endpoint}`);
  }

  const data = await response.json();
  return { data, status: response.status, headers: response.headers };
}

/**
 * 3. Fetch Repository Meta (GraphQL)
 * Pulls primary languages, stargazers, forks, and branch configurations.
 */
export async function getRepoMetadata(owner: string, name: string) {
  const data = await fetchGitHubGraphQL<{ repository: any }>(GET_REPO_METADATA, {
    owner,
    name,
  });
  return data.repository;
}

/**
 * 4. Fetch Codebase File Listing Directory Tree (GraphQL)
 * Queries file lists recursively up to 3 levels deep in a single round-trip.
 */
export async function getRepoFileTree(owner: string, name: string, branch = "main"): Promise<FileNode[]> {
  const expression = `${branch}:`;
  const data = await fetchGitHubGraphQL<{ repository: any }>(GET_REPO_FILE_TREE, {
    owner,
    name,
    expression,
  });

  if (!data?.repository?.object?.entries) {
    return [];
  }

  return parseGraphQLTree(data.repository.object.entries);
}

/**
 * 5. Fetch Specific File Text Content (GraphQL)
 * Retrieves file contents (e.g. "main:package.json" or "main:README.md") without fully downloading cloning folders.
 */
export async function getFileContent(owner: string, name: string, path: string, branch = "main"): Promise<string> {
  const expression = `${branch}:${path}`;
  const data = await fetchGitHubGraphQL<{ repository: any }>(GET_FILE_CONTENT, {
    owner,
    name,
    expression,
  });

  return data?.repository?.object?.text || "";
}

/**
 * 6. Fetch Clean, Filtered Commit Logs (REST)
 * Queries recent commits from REST, automatically parsing and removing bot and merge commits
 * while supporting HTTP conditional status triggers.
 */
export async function getRepoCommits(
  owner: string,
  name: string,
  branch = "main",
  perPage = 30,
  conditionalHeaders: { etag?: string; lastModified?: string } = {}
): Promise<{
  commits: any[];
  status: number;
  etag: string | null;
  lastModified: string | null;
}> {
  try {
    const endpoint = `/repos/${owner}/${name}/commits?sha=${branch}&per_page=${perPage}`;
    const { data, status, headers } = await fetchGitHubREST(endpoint, {}, conditionalHeaders);

    if (status === 304) {
      return {
        commits: [],
        status: 304,
        etag: conditionalHeaders.etag || null,
        lastModified: conditionalHeaders.lastModified || null,
      };
    }

    const etag = headers.get("ETag");
    const lastModified = headers.get("Last-Modified");

    // Filter commits using our smart bot & merge filters
    const commits = filterCommits(data);

    return {
      commits,
      status: 200,
      etag,
      lastModified,
    };
  } catch (error) {
    console.error(`[GitHub Client] Failed fetching commits for ${owner}/${name}:`, error);
    throw error;
  }
}
