import { Terminal, Star, GitCommit, Shield, Zap } from "lucide-react";

export interface ProjectData {
  slug: string;
  title: string;
  description: string;
  detailedDescription: string;
  stars: number;
  commits: number;
  technologies: string[];
  metrics: { label: string; value: string }[];
}

export const SAMPLE_PROJECTS: Record<string, ProjectData> = {
  "syncresume-core": {
    slug: "syncresume-core",
    title: "syncresume-core",
    description: "Multimodal engine running hybrid GitHub v4 GraphQL and REST sync layers under strict rate-limit caching.",
    detailedDescription: "The absolute backbone of this portfolio.syncresume-core implements an advanced API pipeline that fetches codebase files and file structures via GraphQL, parses README files and commits via REST, and stores the results securely in Redis and Firestore NoSQL. This architecture guarantees the site has zero-latency loads and never breaches external rate limits.",
    stars: 124,
    commits: 348,
    technologies: ["Next.js App Router", "GraphQL v4", "REST v3 API", "Cloud Memorystore (Redis)", "Cloud Firestore"],
    metrics: [
      { label: "Rate Limit Efficiency", value: "98.7%" },
      { label: "Sub-Millisecond Hit Rate", value: "94.2%" },
      { label: "Active Connections", value: "12,000/hr" }
    ]
  },
  "portfolio-rag": {
    slug: "portfolio-rag",
    title: "portfolio-rag-agent",
    description: "Conversational slide-out portfolio drawer powered by Vertex AI text-embeddings and Firestore vector indexing.",
    detailedDescription: "An interactive, semantic RAG (Retrieval-Augmented Generation) portfolio chatbot. It translates recruiter queries into multi-dimensional vectors using Vertex AI text-embedding-005 and triggers nearest-neighbor COSINE similarity matches directly inside Firestore, keeping chatbot responses strictly grounded to your portfolio details.",
    stars: 89,
    commits: 112,
    technologies: ["Vertex AI text-embedding-005", "Firestore Vector Search", "Google Model Armor", "Cloud Functions"],
    metrics: [
      { label: "Similarity Accuracy", value: "0.91 Cosine" },
      { label: "Avg Agent Latency", value: "1.2s" },
      { label: "Input Firewalls", value: "Model Armor" }
    ]
  }
};

export default function ProjectDetails({ slug }: { slug: string }) {
  const project = SAMPLE_PROJECTS[slug];

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Terminal className="h-12 w-12 text-red-500 animate-pulse" />
        <h3 className="mt-4 text-xl font-bold">System Error</h3>
        <p className="mt-2 text-zinc-400">Project specifications for identifier '{slug}' could not be compiled.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-zinc-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="font-mono text-xs tracking-wider text-teal-400 uppercase">System Module</span>
          <h2 className="text-2xl font-bold sm:text-3xl text-white">{project.title}</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 rounded-md bg-zinc-800 px-3 py-1 text-sm font-medium">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span>{project.stars}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-md bg-zinc-800 px-3 py-1 text-sm font-medium">
            <GitCommit className="h-4 w-4 text-emerald-500" />
            <span>{project.commits} Commits</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <div>
            <h4 className="font-mono text-sm tracking-wider text-zinc-400 uppercase mb-2">Detailed Specifications</h4>
            <p className="text-zinc-300 leading-relaxed text-sm sm:text-base">{project.detailedDescription}</p>
          </div>

          <div>
            <h4 className="font-mono text-sm tracking-wider text-zinc-400 uppercase mb-3">Technologies Leveraged</h4>
            <div className="flex flex-wrap gap-2">
              {project.technologies.map((tech) => (
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
            {project.metrics.map((metric) => (
              <div key={metric.label} className="py-2.5 flex justify-between text-xs">
                <span className="text-zinc-500">{metric.label}</span>
                <span className="font-mono font-semibold text-teal-300">{metric.value}</span>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-zinc-800 flex items-center gap-2 text-xs text-zinc-500">
            <Shield className="h-3.5 w-3.5 text-emerald-500" />
            <span>Telemetry data secured</span>
          </div>
        </div>
      </div>
    </div>
  );
}
