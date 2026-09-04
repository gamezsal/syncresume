import ProjectCard from "@/components/ProjectCard";
import PipelineTelemetryCard from "@/components/PipelineTelemetryCard";
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

      {/* Bento Grid layout - Systems Modules Showcase */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
          <Layout className="h-5 w-5 text-teal-500" />
          <h2 className="text-lg font-mono font-semibold tracking-wider text-zinc-400 uppercase">System Modules Showcase</h2>
        </div>

        {/* Clean, balanced 3-column repository grid */}
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-stretch">
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
        </div>
      </div>

      {/* Ingestion Engine Telemetry Console - Wide Horizontal Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
          <Server className="h-5 w-5 text-teal-500" />
          <h2 className="text-lg font-mono font-semibold tracking-wider text-zinc-400 uppercase">Ingestion Engine Telemetry Console</h2>
        </div>
        <div className="w-full">
          <PipelineTelemetryCard />
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
