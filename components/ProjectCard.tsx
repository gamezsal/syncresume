"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Github, Code, GitCommit } from "lucide-react";

interface ProjectCardProps {
  slug: string;
  repoOwner?: string;
  repoName?: string;
  title: string;
  description: string;
  stars: number;
  commits?: number;
  techCount: number;
}

export default function ProjectCard({
  slug,
  repoOwner = "gamezsal",
  repoName = "syncresume",
  title,
  description,
  stars: initialStars,
  commits: initialCommits = 4,
  techCount,
}: ProjectCardProps) {
  const [liveStars, setLiveStars] = useState<number>(initialStars);
  const [liveCommits, setLiveCommits] = useState<number>(initialCommits);
  const [isSyncing, setIsSyncing] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    
    // Fetch live repository telemetry from our rate-limit cached sync API
    fetch(`/api/github/sync?owner=${repoOwner}&repo=${repoName}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data?.data) {
          if (data.data.metadata?.stars !== undefined) {
            setLiveStars(data.data.metadata.stars);
          }
          if (Array.isArray(data.data.commits)) {
            setLiveCommits(data.data.commits.length);
          }
          setIsSyncing(false);
        }
      })
      .catch((err) => {
        console.warn(`[ProjectCard] Dynamic telemetry sync failed for ${repoName}:`, err);
        if (isMounted) setIsSyncing(false);
      });

    return () => {
      isMounted = false;
    };
  }, [repoOwner, repoName]);

  return (
    <Link href={`/projects/${slug}`} scroll={false} className="block h-full">
      <motion.div
        whileHover={{ y: -4, scale: 1.01 }}
        className="group relative flex h-full flex-col justify-between overflow-hidden rounded-xl border border-zinc-900 bg-zinc-900/20 p-6 transition-all hover:border-zinc-800 hover:bg-zinc-900/30 backdrop-blur-sm cursor-pointer"
      >
        {/* Animated ambient background glow */}
        <div className="absolute right-0 top-0 h-[100px] w-[100px] bg-teal-500/5 blur-[50px] transition-all group-hover:bg-teal-500/10" />
        
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-teal-500" />
              <span className="font-mono text-xs text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${isSyncing ? "bg-amber-400 animate-pulse" : "bg-teal-400"}`} />
                {isSyncing ? "Syncing..." : "Live Sync"}
              </span>
            </div>
            <div className="rounded-full p-1.5 text-zinc-500 group-hover:text-teal-400 group-hover:bg-zinc-800 transition-all">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>

          <h3 className="mt-4 text-xl font-bold tracking-tight text-white group-hover:text-teal-400 transition-colors">
            {title}
          </h3>
          <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-zinc-900/50 pt-4 text-xs font-medium">
          <div className="flex items-center gap-4 text-zinc-500">
            <div className="flex items-center gap-1.5">
              <Github className="h-4 w-4" />
              <span className="font-mono text-zinc-300">{liveStars} Stars</span>
            </div>
            <div className="flex items-center gap-1.5">
              <GitCommit className="h-4 w-4 text-emerald-500" />
              <span className="font-mono text-emerald-400">{liveCommits} Commits</span>
            </div>
          </div>
          <span className="rounded bg-zinc-800/40 px-2.5 py-1 text-zinc-400 font-mono">
            {techCount} Modules
          </span>
        </div>
      </motion.div>
    </Link>
  );
}