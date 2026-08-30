import { getFirestoreDb } from "../lib/cache/firestore";
import { generateEmbedding } from "../lib/ai/embeddings";
import { FieldValue } from "firebase-admin/firestore";

interface KnowledgeChunk {
  id: string;
  category: "architecture" | "experience" | "skills" | "project";
  projectSlug?: string;
  title: string;
  content: string;
}

const KNOWLEDGE_BASE: KnowledgeChunk[] = [
  {
    id: "arch-syncresume-caching",
    category: "architecture",
    projectSlug: "syncresume-core",
    title: "SyncResume Multi-Tier Caching Architecture",
    content: "SyncResume implements a 3-tier caching system to prevent hitting GitHub REST and GraphQL rate limits. Tier 1 is Next.js server-side rendering, Tier 2 is Cloud Memorystore Redis with a 30-minute TTL, and Tier 3 is Google Cloud Firestore persistent fallback storage. HTTP ETag and Last-Modified conditional headers are preserved across requests."
  },
  {
    id: "arch-syncresume-github-split",
    category: "architecture",
    projectSlug: "syncresume-core",
    title: "GitHub API Budget Splitting (REST v3 vs GraphQL v4)",
    content: "To maximize rate limits, SyncResume splits operations across GitHub's distinct quotas: GraphQL v4 fetches 3-level deep directory trees in a single network round-trip to conserve query points, while REST v3 parses README markdown files and fetches recent commit logs, filtering out merge commits and bot actions."
  },
  {
    id: "arch-rag-vector-search",
    category: "architecture",
    projectSlug: "portfolio-rag",
    title: "Firestore Vector Search & RAG Integration",
    content: "The portfolio chatbot uses Gemini gemini-embedding-001 to generate 768-dimensional float embeddings for user queries. It queries Firestore's native vector index using K-Nearest Neighbor (KNN) search with COSINE distance measurement via the findNearest() operator."
  },
  {
    id: "exp-salvador-fullstack",
    category: "experience",
    title: "Full-Stack & Cloud Engineering Expertise",
    content: "Salvador specializes in Next.js App Router (TypeScript, Parallel & Intercepted Routes, Tailwind CSS, Framer Motion), Google Cloud Platform (Cloud Run, Cloud Functions, Firestore, Firebase App Hosting, Vertex AI), and high-performance API design with Redis caching."
  }
];

async function seedKnowledge() {
  console.log("🌱 Starting Firestore Knowledge Base Seeding...");
  const db = getFirestoreDb();

  if (!db) {
    console.error("❌ Firestore DB connection unavailable. Ensure credentials or emulator are set.");
    process.exit(1);
  }

  const collectionRef = db.collection("portfolio-knowledge");

  for (const chunk of KNOWLEDGE_BASE) {
    try {
      console.log(`📡 Generating embedding for chunk: "${chunk.title}"...`);
      const embedding = await generateEmbedding(chunk.content);

      const docData = {
        category: chunk.category,
        projectSlug: chunk.projectSlug || null,
        title: chunk.title,
        content: chunk.content,
        contentEmbedding: FieldValue.vector(embedding),
        updatedAt: new Date().toISOString(),
      };

      await collectionRef.doc(chunk.id).set(docData, { merge: true });
      console.log(`✅ Indexed chunk [${chunk.id}] into Firestore (dimensions: ${embedding.length}).`);
    } catch (err: any) {
      console.error(`⚠️ Failed to index chunk [${chunk.id}]:`, err.message);
    }
  }

  console.log("🎉 Seeding complete! Knowledge base is ready for RAG queries.");
  process.exit(0);
}

seedKnowledge();
