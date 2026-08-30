import { SAMPLE_PROJECTS } from "@/lib/data/projectData";
import ProjectCard from "@/components/ProjectCard";

export default function HomePage() {
  const projects = Object.values(SAMPLE_PROJECTS);

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-100 tracking-tight">
          Engineering Portfolio & System Architecture
        </h1>
        <p className="text-sm text-zinc-400 max-w-2xl">
          Production-grade AI agents, cloud pipelines, and system architectures. Click any card to inspect live GitHub file trees, commit histories, and benchmarks.
        </p>
      </div>

      {/* Asymmetric Bento Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project, index) => {
          // Give flagship projects 2-column span for hero hierarchy
          const isHero = project.slug === "syncresume-core" || project.slug === "dealership-adk-pipelines";
          
          return (
            <div
              key={project.slug}
              className={isHero ? "md:col-span-2 lg:col-span-2" : "md:col-span-1 lg:col-span-1"}
            >
              <ProjectCard
                slug={project.slug}
                title={project.title}
                description={project.description}
                stars={project.stars}
                techCount={project.technologies.length}
              />
            </div>
          );
        })}
      </div>
    </main>
  );
}