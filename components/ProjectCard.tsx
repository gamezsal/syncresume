"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Github, Code, GitCommit } from "lucide-react";

interface ProjectCardProps {
  slug: string;
  title: string;
  description: string;
  stars: number;
  techCount: number;
  commits?: number; // 👈 Made optional with '?' to guarantee zero build errors!
}

export default function ProjectCard({
  slug,
  title,
  description,
  stars,
  techCount,
  commits = 0, // 👈 Fallback default value if undefined
}: ProjectCardProps) {
  return (
    <Link href={`/projects/${slug}`} scroll={false} className="block h-full">
      <motion.div
        whileHover={{ y: -4, scale: 1.01 }}
        className="group relative flex h-full flex-col justify-between overflow-hidden rounded-xl border border-zinc-900 bg-zinc-900/20 p-6 transition-all hover:border-zinc-800 hover:bg-zinc-900/30 backdrop-blur-sm cursor-pointer"
      >
        {/* Animated ambient glow behind cards */}
        <div className="absolute right-0 top-0 h-[100px] w-[100px] bg-teal-500/5 blur-[50px] transition-all group-hover:bg-teal-500/10" />
        
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-teal-500" />
              <span className="font-mono text-xs text-zinc-500 uppercase tracking-widest">Active Sync</span>
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
            <div className="flex items-center gap-1">
              <Github className="h-3.5 w-3.5" />
              <span>{stars} Stars</span>
            </div>
            <div className="flex items-center gap-1">
              <GitCommit className="h-3.5 w-3.5 text-emerald-500" />
              <span>{commits} Commits</span>
            </div>
          </div>
          <span className="rounded bg-zinc-800/40 px-2.5 py-1 text-zinc-400">
            {techCount} Modules
          </span>
        </div>
      </motion.div>
    </Link>
  );
}