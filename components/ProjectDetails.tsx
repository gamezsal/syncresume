"use client";

import { useState, useEffect } from "react";
import { 
  Terminal, 
  Star, 
  GitCommit, 
  Shield, 
  Zap, 
  Folder, 
  File, 
  ChevronRight, 
  ChevronDown, 
  BookOpen, 
  Layers, 
  Clock, 
  ExternalLink 
} from "lucide-react";
import { SAMPLE_PROJECTS } from "@/lib/projectData";

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

function FileTreeNodeComponent({ node, depth = 0 }: { node: FileNode; depth: number }) {
  const [isOpen, setIsOpen] = useState(depth === 0);
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
              <span className="w-3.5 shrink-0" />
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
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!staticProject) {
      setIsLoading(false);
      return;
    }

    const repoOwner = "gamezsal";
    const repoName = staticProject.repoName || "syncresume";

    let isMounted = true;
    setIsLoading(true);
    setHasError(false);

    // Fetch live telemetry on modal open
    fetch(`/api/github/sync?owner=${repoOwner}&repo=${repoName}`)
      .then((res) => {
        if (!res.ok) throw new Error("API Route responded with failure");
        return res.json();
      })
      .then((data) => {
        if (isMounted && data?.data) {
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
  }, [slug, staticProject]);

  if (!staticProject) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Terminal className="h-12 w-12 text-red-500 animate-pulse" />
        <h3 className="mt-4 text-xl font-bold">System Error</h3>
        <p className="mt-2 text-zinc-400">Project specifications for identifier '{slug}' could not be compiled.</p>
      </div>
    );
  }

  // Calculate live commit and star counts dynamically
  const displayStars = liveData?.metadata?.stars ?? staticProject.stars;
  const displayCommits = liveData?.commits ? liveData.commits.length : staticProject.commits;

  return (
    <div className="space-y-6">
      {/* Dynamic Header displaying live commits */}
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
            <span className="font-mono text-emerald-400">{displayCommits} Commits</span>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
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
          Commit Logs ({displayCommits})
        </button>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="space-y-4 py-8 animate-pulse">
          <div className="h-4 bg-zinc-800 rounded-md w-1/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-zinc-800 rounded-md w-full"></div>
            <div className="h-4 bg-zinc-800 rounded-md w-5/6"></div>
          </div>
        </div>
      ) : (
        <div>
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

              <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 space-y-4">
                <h4 className="font-mono text-sm tracking-wider text-zinc-400 uppercase flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-teal-400" /> System Telemetry
                </h4>
                <div className="divide-y divide-zinc-800">
                  {staticProject.metrics.map((metric) => (
                    <div key={metric.label} className="py-2.5 flex justify-between text-xs">
                      <span className="text-zinc-500">{metric.label}</span>
                      <span className="font-mono font-semibold text-teal-300">{metric.value}</span>
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

          {activeTab === "readme" && liveData && (
            <div className="rounded-xl border border-zinc-850 bg-zinc-950/40 p-5 sm:p-6 overflow-y-auto max-h-[50vh]">
              <div 
                className="markdown-body text-zinc-300 leading-relaxed text-sm"
                dangerouslySetInnerHTML={{ __html: liveData.readmeHtml }}
              />
            </div>
          )}

          {activeTab === "files" && liveData && (
            <div className="rounded-xl border border-zinc-850 bg-zinc-950/40 p-4 overflow-y-auto max-h-[50vh] space-y-1">
              {liveData.fileTree.map((node, index) => (
                <FileTreeNodeComponent key={`${node.path}-${index}`} node={node} depth={0} />
              ))}
            </div>
          )}

          {activeTab === "commits" && liveData && (
            <div className="rounded-xl border border-zinc-850 bg-zinc-950/40 p-4 overflow-y-auto max-h-[50vh] space-y-3">
              {liveData.commits && liveData.commits.length > 0 ? (
                liveData.commits.map((commit) => (
                  <div key={commit.sha} className="flex items-start justify-between p-3 rounded bg-zinc-900/40 border border-zinc-850 text-xs">
                    <div className="space-y-1">
                      <p className="text-zinc-200 font-medium">{commit.message}</p>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                        <span>{commit.author.name}</span>
                        <span>•</span>
                        <span>{new Date(commit.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span className="font-mono text-[11px] text-teal-400 bg-teal-950/30 px-2 py-0.5 rounded border border-teal-900/50">
                      {commit.sha}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-zinc-500 text-xs font-mono py-4 text-center">No commits indexed.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}