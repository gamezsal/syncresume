/**
 * lib/github/parser.ts
 *
 * Handles parsing raw GitHub REST and GraphQL API payloads:
 * 1. Filtering out merge commits and automated bot commits.
 * 2. Compiling raw Markdown README.md content into clean HTML layout strings.
 */

interface CommitAuthor {
  name?: string;
  email?: string;
  login?: string;
  user?: {
    login?: string;
  };
}

interface RawCommit {
  oid?: string;
  sha?: string;
  message?: string;
  committedDate?: string;
  commit?: {
    message?: string;
    author?: {
      name?: string;
      date?: string;
    };
  };
  author?: CommitAuthor;
}

interface ParsedCommit {
  sha: string;
  message: string;
  date: string;
  author: {
    name: string;
    login: string;
    avatarUrl: string;
  };
}

/**
 * Checks if a commit was authored by an automated bot account or CI pipeline.
 */
export function isBotCommit(commit: RawCommit): boolean {
  const name = commit.author?.name || "";
  const email = commit.author?.email || "";
  const login = commit.author?.login || commit.author?.user?.login || "";

  const botIdentifiers = [
    "[bot]",
    "github-actions",
    "dependabot",
    "vercel",
    "action",
    "workflow",
  ];

  const target = `${name} ${email} ${login}`.toLowerCase();
  return botIdentifiers.some((id) => target.includes(id));
}

/**
 * Checks if a commit is a branch merger or pull-request merge record.
 */
export function isMergeCommit(message: string): boolean {
  if (!message) return false;
  const lowercaseMsg = message.toLowerCase();
  return (
    lowercaseMsg.startsWith("merge ") ||
    lowercaseMsg.startsWith("merged ") ||
    lowercaseMsg.includes("merge branch") ||
    lowercaseMsg.includes("merge pull request") ||
    lowercaseMsg.includes("merge conflict")
  );
}

/**
 * Filters raw commit arrays, excluding bot actions and merge commits.
 */
export function filterCommits(commits: RawCommit[]): ParsedCommit[] {
  if (!commits || !Array.isArray(commits)) return [];

  return commits
    .filter((commit) => {
      const msg = commit.commit?.message || commit.message || "";
      return !isBotCommit(commit) && !isMergeCommit(msg);
    })
    .map((c) => {
      const sha = (c.sha || c.oid || "unknown").substring(0, 7);
      const rawMsg = c.commit?.message || c.message || "";
      const message = rawMsg.split("\n")[0];
      const date = c.commit?.author?.date || c.committedDate || new Date().toISOString();
      const authorName = c.commit?.author?.name || c.author?.name || "Developer";
      const authorLogin = c.author?.login || c.author?.user?.login || "gamezsal";

      return {
        sha,
        message,
        date,
        author: {
          name: authorName,
          login: authorLogin,
          avatarUrl: `https://github.com/${authorLogin}.png`,
        },
      };
    });
}

/**
 * Compiles raw Markdown text (e.g., README.md) into clean HTML elements.
 */
export function compileMarkdown(markdown: string): string {
  if (!markdown) return "";

  let html = markdown
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks (```lang ... ```)
  html = html.replace(/```(\w*)\n([\s\S]*?)\n```/gm, (_, lang, code) => {
    return `<pre class="my-4 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs text-zinc-300"><code class="language-${lang}">${code}</code></pre>`;
  });

  // Inline code (`code`)
  html = html.replace(/`([^`]+)`/g, '<code class="rounded bg-zinc-800/40 px-1.5 py-0.5 font-mono text-xs text-teal-400">$1</code>');

  // Bold & Italics
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-white">$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong class="font-bold text-white">$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em class="italic text-zinc-300">$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em class="italic text-zinc-300">$1</em>');

  // Headings
  html = html.replace(/^###### (.*)$/gm, '<h6 class="mt-4 text-xs font-semibold tracking-wider text-zinc-500 uppercase">$1</h6>');
  html = html.replace(/^##### (.*)$/gm, '<h5 class="mt-4 text-sm font-semibold tracking-wider text-zinc-400 uppercase">$1</h5>');
  html = html.replace(/^#### (.*)$/gm, '<h4 class="mt-6 text-base font-bold text-zinc-200">$1</h4>');
  html = html.replace(/^### (.*)$/gm, '<h3 class="mt-6 text-lg font-bold text-teal-400">$1</h3>');
  html = html.replace(/^## (.*)$/gm, '<h2 class="mt-8 border-b border-zinc-900 pb-2 text-xl font-bold text-white">$1</h2>');
  html = html.replace(/^# (.*)$/gm, '<h1 class="mt-10 mb-4 text-2xl font-extrabold text-white">$1</h1>');

  // Links & Lists
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="font-medium text-teal-400 underline transition-colors hover:text-teal-300">$1</a>');
  html = html.replace(/^\s*[-*]\s+(.*)$/gm, '<li class="ml-4 list-disc pl-1 text-sm text-zinc-400">$1</li>');

  const lines = html.split("\n\n");
  const parsedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return "";
    if (
      trimmed.startsWith("<pre") ||
      trimmed.startsWith("<h") ||
      trimmed.startsWith("<li")
    ) {
      return trimmed;
    }
    return `<p class="my-4 text-sm leading-relaxed text-zinc-400">${trimmed}</p>`;
  });

  return parsedLines.filter(Boolean).join("\n");
}