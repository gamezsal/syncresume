const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

export async function getRepoMetadata(owner: string, repo: string) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}
  });
  if (!res.ok) throw new Error(`GitHub metadata fetch failed: ${res.statusText}`);
  return res.json();
}

export async function getRepoFileTree(owner: string, repo: string, branch = "main") {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, {
    headers: GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.tree || [];
}

export async function getFileContent(owner: string, repo: string, path: string, branch = "main") {
  const res = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`, {
    headers: GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}
  });
  if (!res.ok) throw new Error(`File fetch failed: ${res.statusText}`);
  return res.text();
}

export async function getRepoCommits(owner: string, repo: string, branch = "main", limit = 10, conditionalHeaders?: { etag?: string; lastModified?: string }) {
  const headers: Record<string, string> = GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {};
  if (conditionalHeaders?.etag) headers["If-None-Match"] = conditionalHeaders.etag;
  if (conditionalHeaders?.lastModified) headers["If-Modified-Since"] = conditionalHeaders.lastModified;

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch}&per_page=${limit}`, { headers });
  
  if (res.status === 304) {
    return { status: 304, commits: [] };
  }
  
  if (!res.ok) throw new Error(`Commits fetch failed: ${res.statusText}`);
  const data = await res.json();
  const etag = res.headers.get("etag") || undefined;
  const lastModified = res.headers.get("last-modified") || undefined;

  const commits = (data || []).map((c: any) => ({
    sha: c.sha,
    message: c.commit.message,
    date: c.commit.author.date,
    author: {
      name: c.commit.author.name,
      login: c.author?.login || c.commit.author.name,
      avatarUrl: c.author?.avatar_url
    }
  }));

  return { status: 200, commits, etag, lastModified };
}
