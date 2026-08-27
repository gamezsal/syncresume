/**
 * lib/github/parser.ts
 *
 * This module is responsible for parsing raw data payloads from GitHub's REST and GraphQL APIs.
 * It strictly handles:
 * 1. Filtering out merge commits and automated bot commits to maintain a clean engineering showcase.
 * 2. Compiling raw Markdown README.md case studies into clean, semantic HTML layout strings.
 */

interface CommitAuthor {
  name: string;
  email?: string;
  login?: string;
}

interface RawCommit {
  oid?: string;
  sha?: string;
  message?: string;
  committedDate?: string;
  author?: {
    name?: string;
    email?: string;
    user?: {
      login?: string;
    };
  } | CommitAuthor;
  commit?: {
    message?: string;
    author?: {
      name?: string;
      email?: string;
      date?: string;
    };
  };
}

interface ParsedCommit {
  sha: string;
  message: string;
  date: string;
  author: {
    name: string;
    login: string;
    avatarUrl?: string;
  };
}

/**
 * Checks if a commit was authored by an automated bot account or action pipeline.
 */
export function isBotCommit(commit: RawCommit): boolean {
  const commitObj = commit?.commit || commit;
  const name = commitObj?.author?.name || commit?.author?.name || "";
  const email = commitObj?.author?.email || commit?.author?.email || "";
  
  let login = "";
  if (commit?.author && "login" in commit.author) {
    login = (commit.author as any).login || "";
  } else if (commit?.author && "user" in commit.author && commit.author.user) {
    login = commit.author.user.login || "";
  } else if (commitObj?.author && "user" in commitObj.author && (commitObj.author as any).user) {
    login = (commitObj.author as any).user.login || "";
  }

  const botIdentifiers = [
    "[bot]",
    "github-actions",
    "dependabot",
    "vercel",
    "headless",
    "action",
    "workflow",
  ];

  const targetString = `${name} ${email} ${login}`.toLowerCase();
  return botIdentifiers.some((botId) => targetString.includes(botId));
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
 * Filter an array of raw commits, removing bot contributions and merge records.
 */
export function filterCommits(commits: RawCommit[]): ParsedCommit[] {
  if (!commits || !Array.isArray(commits)) return [];

  return commits
    .filter((commit) => {
      const message = commit?.commit?.message || commit?.message || "";
      return !isBotCommit(commit) && !isMergeCommit(message);
    })
    .map((commit) => {
      const sha = commit?.sha || commit?.oid || "unknown";
      const message = commit?.commit?.message || commit?.message || "";
      
      let authorName = "Developer";
      let authorLogin = "gamezsal";
      
      const commitObj = commit?.commit || commit;
      if (commitObj?.author) {
        authorName = commitObj.author.name || "Developer";
      } else if (commit?.author?.name) {
        authorName = commit.author.name;
      }
      
      if (commit?.author && "login" in commit.author && (commit.author as any).login) {
        authorLogin = (commit.author as any).login;
      } else if (commit?.author && "user" in commit.author && commit.author.user?.login) {
        authorLogin = commit.author.user.login;
      } else if (commitObj?.author && "user" in commitObj.author && (commitObj.author as any).user?.login) {
        authorLogin = (commitObj.author as any).user.login;
      }

      const commitDate = commitObj?.author?.date || commitObj?.committedDate || new Date().toISOString();

      return {
        sha: sha.substring(0, 7), // Truncate SHA for standard frontend view
        message: message.split("\n")[0], // Only grab first line of commit message
        date: commitDate,
        author: {
          name: authorName,
          login: authorLogin,
          avatarUrl: (commit as any)?.author?.avatar_url || `https://github.com/${authorLogin}.png`,
        },
      };
    });
}

/**
 * A lightweight, safe Markdown-to-HTML parser designed to process README.md 
 * contents natively on the server without incurring large NPM library payloads.
 */
export function compileMarkdown(markdown: string): string {
  if (!markdown) return "";

  let html = markdown;

  // Escape HTML tags to prevent XSS vulnerability injections
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks parsing (```lang ... ```)
  html = html.replace(/```(\w*)\n([\s\S]*?)\n```/gm, (_, lang, code) => {
    return `<pre class="my-4 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs text-zinc-300"><code class="language-${lang}">${code}</code></pre>`;
  });

  // Inline code ticks (`code`)
  html = html.replace(/`([^`]+)`/g, '<code class="rounded bg-zinc-800/40 px-1.5 py-0.5 font-mono text-xs text-teal-400">$1</code>');

  // Bold (**text** or __text__)
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-white">$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong class="font-bold text-white">$1</strong>');

  // Italics (*text* or _text_)
  html = html.replace(/\*([^*]+)\*/g, '<em class="italic text-zinc-300">$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em class="italic text-zinc-300">$1</em>');

  // Headings (# Heading, ## Heading, etc.)
  html = html.replace(/^###### (.*)$/gm, '<h6 class="mt-4 text-xs font-semibold tracking-wider text-zinc-500 uppercase">$1</h6>');
  html = html.replace(/^##### (.*)$/gm, '<h5 class="mt-4 text-sm font-semibold tracking-wider text-zinc-400 uppercase">$1</h5>');
  html = html.replace(/^#### (.*)$/gm, '<h4 class="mt-6 text-base font-bold text-zinc-200">$1</h4>');
  html = html.replace(/^### (.*)$/gm, '<h3 class="mt-6 text-lg font-bold text-teal-400">$1</h3>');
  html = html.replace(/^## (.*)$/gm, '<h2 class="mt-8 border-b border-zinc-900 pb-2 text-xl font-bold text-white">$1</h2>');
  html = html.replace(/^# (.*)$/gm, '<h1 class="mt-10 mb-4 text-2xl font-extrabold text-white">$1</h1>');

  // Links ([text](url))
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="font-medium text-teal-400 underline transition-colors hover:text-teal-300">$1</a>');

  // Bullet Lists (- Item or * Item)
  html = html.replace(/^\s*[-*]\s+(.*)$/gm, '<li class="ml-4 list-disc pl-1 text-sm text-zinc-400">$1</li>');

  // Paragraph blocks (split double returns and wrap them as <p> tags, skipping formatting inside blocks)
  const lines = html.split("\n\n");
  const parsedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return "";
    
    // Skip if it's already an HTML block element (like pre, h1-h6, li)
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
