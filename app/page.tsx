import ProjectCard from "@/components/ProjectCard";
import { SAMPLE_PROJECTS } from "@/components/projectData";
import { Terminal, Database, Server, Compass, Layout } from "lucide-react";

export default function Home() {
  const projects = Object.values(SAMPLE_PROJECTS);

  return (
    <div className="space-y-12">
      {/* Hero Header Area */}
      <div className="flex flex-col gap-4">
        <span className="inline-flex max-w-max items-center gap-2 rounded-full border border-teal-500/30 bg-teal-950/20 px-3 py-1 text-xs font-mono font-medium text-teal-400">
          <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
          SYSTEM LIVE: syncresume deployment
        </span>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          syncresume
        </h1>
        <p className="max-w-2xl text-base sm:text-lg text-zinc-400 leading-relaxed">
          An interactive multimodal engineering portfolio. Fully automated, rate-limit cached, and secured by Google Cloud Model Armor.
        </p>
      </div>

      {/* Bento Grid layout */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
          <Layout className="h-5 w-5 text-teal-500" />
          <h2 className="text-lg font-mono font-semibold tracking-wider text-zinc-400 uppercase">System Modules Showcase</h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Main Showcase Projects */}
          {projects.map((proj) => (
            <ProjectCard
              key={proj.slug}
              slug={proj.slug}
              title={proj.title}
              description={proj.description}
              stars={proj.stars}
              techCount={proj.technologies.length}
            />
          ))}

          {/* Interactive Staged Metrics Bento Grid Block */}
          <div className="flex flex-col justify-between rounded-xl border border-zinc-900/40 bg-zinc-900/10 p-6 md:col-span-1 lg:col-span-1 border-dashed">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-zinc-500">
                <Database className="h-4 w-4" />
                <span className="font-mono text-xs uppercase tracking-wider">Storage Layer</span>
              </div>
              <h3 className="text-lg font-bold text-zinc-400">Manual Resume Staging</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Resume parsing features are manually configured in Phase 1. Google Cloud Run triggers are pre-wired to extract PDF profiles using Gemini structured output arrays on upload.
              </p>
            </div>
            <div className="mt-6 flex gap-2">
              <span className="rounded bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-xs text-zinc-500">
                Staged
              </span>
              <span className="rounded bg-teal-950/20 border border-teal-900/50 px-2.5 py-1 text-xs text-teal-400 animate-pulse">
                Ready to link
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* System Technical Telemetry Dashboard Grid */}
      <div className="rounded-xl border border-zinc-900 bg-zinc-950/50 p-6 space-y-4">
        <h3 className="font-mono text-sm tracking-wider text-zinc-400 uppercase flex items-center gap-2">
          <Terminal className="h-4 w-4 text-teal-400" /> Environment Health Index
        </h3>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          <div className="rounded-lg bg-zinc-900/30 border border-zinc-900 p-4">
            <span className="text-xs text-zinc-500 block">Host Region</span>
            <span className="font-mono font-bold text-sm text-teal-400 mt-1 block">us-central1</span>
          </div>
          <div className="rounded-lg bg-zinc-900/30 border border-zinc-900 p-4">
            <span className="text-xs text-zinc-500 block">NextJS Target</span>
            <span className="font-mono font-bold text-sm text-teal-400 mt-1 block">App Router (v15)</span>
          </div>
          <div className="rounded-lg bg-zinc-900/30 border border-zinc-900 p-4">
            <span className="text-xs text-zinc-500 block">Compute Instances</span>
            <span className="font-mono font-bold text-sm text-teal-400 mt-1 block">1 Min - 10 Max</span>
          </div>
          <div className="rounded-lg bg-zinc-900/30 border border-zinc-900 p-4">
            <span className="text-xs text-zinc-500 block">Active Safety Shield</span>
            <span className="font-mono font-bold text-sm text-teal-400 mt-1 block">Model Armor</span>
          </div>
        </div>
      </div>
    </div>
  );
}
