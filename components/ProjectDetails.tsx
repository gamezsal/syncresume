"use client";

import { useState, useEffect } from "react";
import { Terminal, Star, GitCommit, Shield, Zap, Folder, File, ChevronRight, ChevronDown, BookOpen, Layers, Clock, ExternalLink } from "lucide-react";
import { SAMPLE_PROJECTS, ProjectData } from "./projectData";

interface FileNode {
  name: string;
  path: string;
  type: "blob" | "tree";
  size?: number;
  isBinary?: boolean;
  children?: FileNode[];
}

interface LiveSyncPayload {
  metadata: {
    name: string;
    description: string;
    stars: number;
    forks: number;
    primaryLanguage?: { name: string; color: string };
    pushedAt: string;
    url: string;
    defaultBranch: string;
  };
  fileTree: FileNode[];
  commits: {
    sha: string;
    message: string;
    date: string;
    author: { name: string; login: string; avatarUrl?: string };
  }[];
  readmeHtml: string;
  synchronizedAt: string;
}

// Nested Interactive File Tree Node Component
function FileTreeNodeComponent({ node, depth = 0 }: { node: FileNode; depth: number }) {
  const [isOpen, setIsOpen] = useState(depth === 0); // Open root level by default
  const isDirectory = node.type === "tree";

  const toggleOpen = () => {
    if (isDirectory) setIsOpen(!isOpen);
  };

  const formatSize = (bytes?: number) => {
    if (bytes === undefined) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="select-none font-mono text-xs">
      <div
        onClick={toggleOpen}
        style={{ paddingLeft: `${depth * 16}px` }}
        className={`flex items-center justify-between py-1.5 rounded-md hover:bg-zinc-800/30 transition-colors cursor-pointer ${
          isDirectory ? "text-zinc-300 font-semibold" : "text-zinc-400"
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {isDirectory ? (
            <>
              {isOpen ? (
                <ChevronDown className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
              )}
              <Folder className="h-4 w-4 text-teal-400 shrink-0 fill-teal-400/10" />
            </>
          ) : (
            <>
              <span className="w-3.5 shrink-0" /> {/* indent match for chevrons */}
              <File className="h-4 w-4 text-zinc-500 shrink-0" />
            </>
          )}
          <span className="truncate">{node.name}</span>
        </div>
        {!isDirectory && node.size !== undefined && (
          <span className="text-[10px] text-zinc-600 font-normal pr-2">{formatSize(node.size)}</span>
        )}
      </div>
      {isDirectory && isOpen && node.children && (
        <div className="mt-0.5 border-l border-zinc-800 ml-3.5 pl-1">
          {node.children.map((child, index) => (
            <FileTreeNodeComponent key={`${child.path}-${index}`} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProjectDetails({ slug }: { slug: string }) {
  const staticProject = SAMPLE_PROJECTS[slug];
  const [activeTab, setActiveTab] = useState<"specs" | "readme" | "files" | "commits">("specs");
  const [liveData, setLiveData] = useState<LiveSyncPayload | null>(null);
  const [isLoading, setIsLoading] = useState(slug === "syncresume-core");
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (slug !== "syncresume-core") {
      setLiveData(null);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setHasError(false);

    fetch("/api/github/sync?owner=gamezsal&repo=syncresume")
      .then((res) => {
        if (!res.ok) throw new Error("API Route responded with failure");
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setLiveData(data.data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("[ProjectDetails] Failed fetching live sync data:", err);
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (!staticProject) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Terminal className="h-12 w-12 text-red-500 animate-pulse" />
        <h3 className="mt-4 text-xl font-bold">System Error</h3>
        <p className="mt-2 text-zinc-400">Project specifications for identifier '{slug}' could not be compiled.</p>
      </div>
    );
  }

  // Combine live telemetry with static info if active and available
  const displayStars = liveData?.metadata?.stars ?? staticProject.stars;
  const displayCommits = liveData?.commits ? liveData.commits.length : staticProject.commits;

  return (
    <div className="space-y-6">
      {/* Dynamic Header */}
      <div className="flex flex-col gap-4 border-b border-zinc-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="font-mono text-xs tracking-wider text-teal-400 uppercase">System Module</span>
          <h2 className="text-2xl font-bold sm:text-3xl text-white">{staticProject.title}</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 rounded-md bg-zinc-850 border border-zinc-800 px-3 py-1.5 text-sm font-medium">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 shrink-0" />
            <span className="font-mono">{displayStars}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-md bg-zinc-850 border border-zinc-800 px-3 py-1.5 text-sm font-medium">
            <GitCommit className="h-4 w-4 text-emerald-500 shrink-0" />
            <span className="font-mono">{displayCommits} Commits</span>
          </div>
        </div>
      </div>

      {/* Tabs Menu (Only active for projects that support synchronization) */}
      {slug === "syncresume-core" && (
        <div className="flex border-b border-zinc-800 overflow-x-auto gap-2 p-1 bg-zinc-950/40 rounded-lg max-w-max">
          <button
            onClick={() => setActiveTab("specs")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md font-mono transition-all ${
              activeTab === "specs"
                ? "bg-zinc-850 text-white border border-zinc-750 font-bold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Zap className="h-3.5 w-3.5 shrink-0" />
            Telemetry
          </button>
          <button
            onClick={() => setActiveTab("readme")}
            disabled={isLoading || hasError}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md font-mono transition-all ${
              activeTab === "readme"
                ? "bg-zinc-850 text-white border border-zinc-750 font-bold"
                : "text-zinc-400 hover:text-white disabled:opacity-50"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 shrink-0" />
            README.md
          </button>
          <button
            onClick={() => setActiveTab("files")}
            disabled={isLoading || hasError}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md font-mono transition-all ${
              activeTab === "files"
                ? "bg-zinc-850 text-white border border-zinc-750 font-bold"
                : "text-zinc-400 hover:text-white disabled:opacity-50"
            }`}
          >
            <Layers className="h-3.5 w-3.5 shrink-0" />
            Folder Tree
          </button>
          <button
            onClick={() => setActiveTab("commits")}
            disabled={isLoading || hasError}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md font-mono transition-all ${
              activeTab === "commits"
                ? "bg-zinc-850 text-white border border-zinc-750 font-bold"
                : "text-zinc-400 hover:text-white disabled:opacity-50"
            }`}
          >
            <Clock className="h-3.5 w-3.5 shrink-0" />
            Commit Logs
          </button>
        </div>
      )}

      {/* Main Panel Content Area */}
      {isLoading ? (
        /* Loading Skeleton Panel */
        <div className="space-y-4 py-8 animate-pulse">
          <div className="h-4 bg-zinc-800 rounded-md w-1/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-zinc-800 rounded-md w-full"></div>
            <div className="h-4 bg-zinc-800 rounded-md w-5/6"></div>
            <div className="h-4 bg-zinc-800 rounded-md w-4/5"></div>
          </div>
          <div className="pt-6 grid grid-cols-3 gap-4">
            <div className="h-10 bg-zinc-800 rounded-lg"></div>
            <div className="h-10 bg-zinc-800 rounded-lg"></div>
            <div className="h-10 bg-zinc-800 rounded-lg"></div>
          </div>
        </div>
      ) : hasError ? (
        /* Fallback Error Panel with Retry Option */
        <div className="rounded-xl border border-red-900/30 bg-red-950/10 p-6 flex flex-col items-center text-center space-y-3">
          <Terminal className="h-10 w-10 text-red-400" />
          <h4 className="font-semibold text-white">Live Connection Terminated</h4>
          <p className="text-zinc-400 text-xs max-w-md">
            The API client was unable to sync telemetry data. Please verify your local GITHUB_TOKEN environment variable is active inside .env.local.
          </p>
          <button
            onClick={() => {
              setHasError(false);
              setIsLoading(true);
              fetch("/api/github/sync?owner=gamezsal&repo=syncresume")
                .then((res) => res.json())
                .then((data) => {
                  setLiveData(data.data);
                  setIsLoading(false);
                })
                .catch(() => {
                  setHasError(true);
                  setIsLoading(false);
                });
            }}
            className="rounded bg-zinc-800 px-3.5 py-1.5 text-xs text-white hover:bg-zinc-700 font-mono transition-colors"
          >
            Reconnect Daemon
          </button>
        </div>
      ) : (
        /* Active Display Tabs */
        <div>
          {/* Tab 1: Specs & Static Telemetry */}
          {activeTab === "specs" && (
            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-2 space-y-6">
                <div>
                  <h4 className="font-mono text-sm tracking-wider text-zinc-400 uppercase mb-2">Detailed Specifications</h4>
                  <p className="text-zinc-300 leading-relaxed text-sm sm:text-base">
                    {staticProject.detailedDescription}
                  </p>
                </div>

                <div>
                  <h4 className="font-mono text-sm tracking-wider text-zinc-400 uppercase mb-3">Technologies Leveraged</h4>
                  <div className="flex flex-wrap gap-2">
                    {staticProject.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="rounded bg-teal-950/30 border border-teal-900/50 px-2.5 py-1 text-xs font-medium text-teal-400"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar Metrics Widget */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 space-y-4">
                <h4 className="font-mono text-sm tracking-wider text-zinc-400 uppercase flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-teal-400" /> System Telemetry
                </h4>
                <div className="divide-y divide-zinc-800">
                  {staticProject.metrics.map((metric) => (
                    <div key={metric.label} className="py-2.5 flex justify-between text-xs">
                      <span className="text-zinc-500">{metric.label}</span>
                      <span className="font-mono font-semibold text-teal-300"> {metric.value}</span>
                    </div>
                  ))}
                  {liveData && (
                    <div className="py-2.5 flex justify-between text-xs">
                      <span className="text-zinc-500">Last Synchronized</span>
                      <span className="font-mono text-[10px] text-zinc-400 truncate max-w-[120px]">
                        {new Date(liveData.synchronizedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>
                {liveData?.metadata?.url && (
                  <a
                    href={liveData.metadata.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 w-full text-center py-2 rounded bg-zinc-850 hover:bg-zinc-800 text-xs font-semibold text-white transition-all border border-zinc-800 hover:border-zinc-700"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-zinc-400" /> Open on GitHub
                  </a>
                )}
                <div className="pt-2 border-t border-zinc-850 flex items-center gap-2 text-xs text-zinc-500">
                  <Shield className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Telemetry data secured</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Compiled README Markdown */}
          {activeTab === "readme" && liveData && (
            <div className="rounded-xl border border-zinc-850 bg-zinc-950/40 p-5 sm:p-6 overflow-y-auto max-h-[50vh]">
              <div 
                className="markdown-body text-zinc-300 leading-relaxed text-sm"
                dangerouslySetInnerHTML={{ __html: liveData.readmeHtml }}
              />
            </div>
          )}

          {/* Tab 3: Interactive File Directory Tree */}
          {activeTab === "files" && liveData && (
            <div className="rounded-xl border border-zinc-850 bg-zinc-950/40 p-4 overflow-y-auto max-h-[50vh] space-y-1">
              <div className="flex items-center gap-2 border-b border-zinc-900 pb-2 mb-3 text-zinc-500">
                <Folder className="h-4 w-4" />
                <span className="font-mono text-xs uppercase tracking-wider">
                  Repository Files (GraphQL Crawled Root)
                </span>
              </div>
              {liveData.fileTree && liveData.fileTree.length > 0 ? (
                liveData.fileTree.map((node, index) => (
                  <FileTreeNodeComponent key={`${node.path}-${index}`} node={node} depth={0} />
                ))
              ) : (
                <p className="text-zinc-500 text-xs font-mono py-4 text-center">Repository directory is empty.</p>
              )}
            </div>
          )}

          {/* Tab 4: Dynamic Commits Feed */}
          {activeTab === "commits" && liveData && (
            <div className="rounded-xl border border-zinc-850 bg-zinc-950/40 p-4 overflow-y-auto max-h-[50vh]">
              <div className="flex items-center gap-2 border-b border-zinc-900 pb-2 mb-4 text-zinc-500">
                <GitCommit className="h-4 w-4" />
                <span className="font-mono text-xs uppercase tracking-wider">
                  Active Developer Contribution Logs
                </span>
              </div>
              
              <div className="space-y-4 pl-2 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-[1px] before:bg-zinc-850">
                {liveData.commits && liveData.commits.length > 0 ? (
                  liveData.commits.map((commit, index) => (
                    <div key={commit.sha} className="flex gap-4 items-start relative">
                      {/* Avatar or Circle */}
                      <img 
                        src={commit.author.avatarUrl || `https://github.com/${commit.author.login}.png`}
                        alt={commit.author.login}
                        onError={(e) => {
                          // Fallback to stylized circle if avatar load fails
                          (e.target as HTMLElement).style.display = "none";
                        }}
                        className="w-8 h-8 rounded-full border border-zinc-800 relative z-10 shrink-0 bg-zinc-900"
                      />
                      
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="font-mono text-xs font-bold text-zinc-300">{commit.author.name}</span>
                          <span className="text-[10px] text-zinc-500">
                            {new Date(commit.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-400 break-words">{commit.message}</p>
                        <div className="pt-1">
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-teal-400 rounded bg-teal-950/20 border border-teal-900/50 px-1.5 py-0.5">
                            SHA: {commit.sha}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-zinc-500 text-xs font-mono py-4 text-center">No commits indexed.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
