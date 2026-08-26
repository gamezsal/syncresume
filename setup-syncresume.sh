#!/bin/bash
# setup-syncresume.sh
# Automates the creation of the lowercase "syncresume" folder structure and code files in Cloud Shell.

set -e

echo "=== Starting syncresume Project Setup ==="

# 1. Create directory structure
echo "Creating folder structure..."
mkdir -p ~/syncresume/app/@modal/\(...\}projects/\[slug\]
mkdir -p ~/syncresume/app/@modal/\[...catchAll\]
mkdir -p ~/syncresume/app/projects/\[slug\]
mkdir -p ~/syncresume/app/store
mkdir -p ~/syncresume/components
mkdir -p ~/syncresume/public

# Fix naming for intercepted route (unescape parenthesies in path)
rm -rf ~/syncresume/app/@modal/\(...\}projects
mkdir -p ~/syncresume/app/@modal/\(.\)projects/\[slug\]

cd ~/syncresume

# 2. Write package.json
echo "Writing package.json..."
cat << 'EOF' > package.json
{
  "name": "syncresume",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "15.1.0",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "framer-motion": "11.15.0",
    "zustand": "5.0.2",
    "lucide-react": "0.468.0"
  },
  "devDependencies": {
    "typescript": "5.7.2",
    "@types/node": "22.10.2",
    "@types/react": "19.0.1",
    "@types/react-dom": "19.0.2",
    "postcss": "8.4.49",
    "tailwindcss": "3.4.16",
    "autoprefixer": "10.4.20"
  }
}
EOF

# 3. Write tsconfig.json
echo "Writing tsconfig.json..."
cat << 'EOF' > tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF

# 4. Write tailwind.config.js
echo "Writing tailwind.config.js..."
cat << 'EOF' > tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
EOF

# 5. Write postcss.config.js
echo "Writing postcss.config.js..."
cat << 'EOF' > postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# 6. Write next.config.js
echo "Writing next.config.js..."
cat << 'EOF' > next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = nextConfig;
EOF

# 7. Write apphosting.yaml
echo "Writing apphosting.yaml..."
cat << 'EOF' > apphosting.yaml
runConfig:
  minInstances: 1
  maxInstances: 10
  concurrency: 80
  cpu: 1
  memoryMiB: 512
EOF

# 8. Write app/globals.css
echo "Writing app/globals.css..."
cat << 'EOF' > app/globals.css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-zinc-950 text-slate-100 antialiased;
  }
}

/* Custom scrollbar styling for technical feel */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #09090b;
}

::-webkit-scrollbar-thumb {
  background: #27272a;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #3f3f46;
}
EOF

# 9. Write app/layout.tsx
echo "Writing app/layout.tsx..."
cat << 'EOF' > app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "syncresume | Multimodal Portfolio & Engineering Hub",
  description: "Real-time automated engineering portfolio synchronized with GitHub and verified by AI.",
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-slate-100 antialiased selection:bg-teal-500/20 selection:text-teal-300">
        <header className="sticky top-0 z-40 w-full border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 animate-pulse rounded-full bg-teal-500" />
              <span className="font-mono text-sm tracking-widest text-zinc-400">syncresume.io</span>
            </div>
            <nav className="flex gap-6 text-sm font-medium text-zinc-400">
              <a href="/" className="hover:text-teal-400 transition-colors">Showcase</a>
              <span className="text-zinc-800">|</span>
              <span className="text-zinc-600 cursor-not-allowed">Resume (Manually Staged)</span>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
        
        {modal}
      </body>
    </html>
  );
}
EOF

# 10. Write app/store/useLayoutStore.ts
echo "Writing Zustand layout store..."
cat << 'EOF' > app/store/useLayoutStore.ts
import { create } from 'zustand';

interface LayoutState {
  activeProjectSlug: string | null;
  isTransitioning: boolean;
  setActiveProjectSlug: (slug: string | null) => void;
  setTransitioning: (state: boolean) => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  activeProjectSlug: null,
  isTransitioning: false,
  setActiveProjectSlug: (slug) => set({ activeProjectSlug: slug }),
  setTransitioning: (state) => set({ isTransitioning: state }),
}));
EOF

# 11. Write app/@modal/default.tsx
echo "Writing app/@modal/default.tsx..."
cat << 'EOF' > app/@modal/default.tsx
export default function Default() {
  return null;
}
EOF

# 12. Write app/@modal/[...catchAll]/page.tsx
echo "Writing app/@modal/[...catchAll]/page.tsx..."
cat << 'EOF' > app/@modal/\[...catchAll\]/page.tsx
export default function CatchAll() {
  return null;
}
EOF

# 13. Write components/ModalWrapper.tsx
echo "Writing components/ModalWrapper.tsx..."
cat << 'EOF' > components/ModalWrapper.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ModalWrapperProps {
  children: React.ReactNode;
}

export default function ModalWrapper({ children }: ModalWrapperProps) {
  const router = useRouter();

  useEffect(() => {
    // Prevent background scrolling while modal is open
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleClose = () => {
    router.back();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-20">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-zinc-950/85 backdrop-blur-sm"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="relative z-10 flex h-full max-h-[85vh] w-full max-w-4xl flex-col rounded-xl border border-zinc-850 bg-zinc-900/90 text-slate-100 shadow-2xl backdrop-blur-md"
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Modal Content Scrollable Area */}
          <div className="overflow-y-auto p-6 sm:p-8">
            {children}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
EOF

# 14. Write components/ProjectDetails.tsx
echo "Writing components/ProjectDetails.tsx..."
cat << 'EOF' > components/ProjectDetails.tsx
import { Terminal, Star, GitCommit, GitBranch, Shield, Zap } from "lucide-react";

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
EOF

# 15. Write app/@modal/(.)projects/[slug]/page.tsx
echo "Writing intercepted route page.tsx..."
cat << 'EOF' > app/@modal/\(.\)projects/\[slug\]/page.tsx
import ModalWrapper from "@/components/ModalWrapper";
import ProjectDetails from "@/components/ProjectDetails";

export default async function ProjectModal({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <ModalWrapper>
      <ProjectDetails slug={slug} />
    </ModalWrapper>
  );
}
EOF

# 16. Write app/projects/[slug]/page.tsx
echo "Writing standalone route page.tsx..."
cat << 'EOF' > app/projects/\[slug\]/page.tsx
import Link from "next/link";
import ProjectDetails from "@/components/ProjectDetails";
import { ArrowLeft } from "lucide-react";

export default async function StandaloneProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div className="min-h-screen pt-4 pb-16 space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-10 backdrop-blur-sm">
        <ProjectDetails slug={slug} />
      </div>
    </div>
  );
}
EOF

# 17. Write components/ProjectCard.tsx
echo "Writing components/ProjectCard.tsx..."
cat << 'EOF' > components/ProjectCard.tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Github, Code } from "lucide-react";

interface ProjectCardProps {
  slug: string;
  title: string;
  description: string;
  stars: number;
  techCount: number;
}

export default function ProjectCard({
  slug,
  title,
  description,
  stars,
  techCount,
}: ProjectCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-zinc-900 bg-zinc-900/20 p-6 transition-all hover:border-zinc-800 hover:bg-zinc-900/30 backdrop-blur-sm"
    >
      <div className="absolute right-0 top-0 h-[100px] w-[100px] bg-teal-500/5 blur-[50px] transition-all group-hover:bg-teal-500/10" />
      
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5 text-teal-500" />
            <span className="font-mono text-xs text-zinc-500 uppercase tracking-widest">Active Sync</span>
          </div>
          <Link
            href={`/projects/${slug}`}
            scroll={false} // Prevent browser window snap scrolling
            className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-teal-400 transition-all"
          >
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <h3 className="mt-4 text-xl font-bold tracking-tight text-white group-hover:text-teal-400 transition-colors">
          {title}
        </h3>
        <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-zinc-900/50 pt-4 text-xs font-medium">
        <div className="flex items-center gap-1.5 text-zinc-500">
          <Github className="h-4 w-4" />
          <span>{stars} Stars</span>
        </div>
        <span className="rounded bg-zinc-800/40 px-2.5 py-1 text-zinc-400">
          {techCount} Modules
        </span>
      </div>
    </motion.div>
  );
}
EOF

# 18. Write app/page.tsx
echo "Writing app/page.tsx (Bento Grid Home)..."
cat << 'EOF' > app/page.tsx
import ProjectCard from "@/components/ProjectCard";
import { SAMPLE_PROJECTS } from "@/components/ProjectDetails";
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
EOF

echo "=== Setup Script Generated Successfully! ==="
echo "You can now run 'npm install' and 'npm run dev' to explore."
