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
