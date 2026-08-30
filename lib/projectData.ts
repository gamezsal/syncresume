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
    detailedDescription: "The absolute backbone of this portfolio. syncresume-core implements an advanced API pipeline that fetches codebase files and file structures via GraphQL, parses README files and commits via REST, and stores the results securely in Redis and Firestore NoSQL. This architecture guarantees the site has zero-latency loads and never breaches external rate limits.",
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
