export interface ProjectData {
  slug: string;
  title: string;
  description: string;
  detailedDescription: string;
  stars: number;
  commits: number;
  technologies: string[];
  metrics: { label: string; value: string }[];
  githubRepo?: string;   // Dynamic GitHub sync repo identifier
  githubOwner?: string;  // Optional: defaults to "gamezsal" if omitted
}

export const SAMPLE_PROJECTS: Record<string, ProjectData> = {
  "syncresume-core": {
    slug: "syncresume-core",
    title: "syncresume-core",
    description: "Multimodal engine running hybrid GitHub v4 GraphQL and REST sync layers under strict rate-limit caching.",
    detailedDescription: "The absolute backbone of this portfolio. syncresume-core implements an advanced API pipeline that fetches codebase files and file structures via GraphQL, parses README files and commits via REST, and stores the results securely in Redis and Firestore NoSQL. This architecture guarantees the site has zero-latency loads and never breaches external rate limits.",
    stars: 0,
    commits: 12,
    technologies: ["Next.js App Router", "GraphQL v4", "REST v3 API", "Cloud Memorystore (Redis)", "Cloud Firestore"],
    metrics: [
      { label: "Rate Limit Efficiency", value: "98.7%" },
      { label: "Sub-Millisecond Hit Rate", value: "94.2%" },
      { label: "Active Connections", value: "12,000/hr" }
    ],
    githubRepo: "syncresume",
    githubOwner: "gamezsal"
  },
  "portfolio-rag": {
    slug: "portfolio-rag",
    title: "portfolio-rag-agent",
    description: "Conversational slide-out portfolio drawer powered by Vertex AI text-embeddings and Firestore vector indexing.",
    detailedDescription: "An interactive, semantic RAG (Retrieval-Augmented Generation) portfolio chatbot. It translates recruiter queries into multi-dimensional vectors using Vertex AI text-embedding-005 and triggers nearest-neighbor COSINE similarity matches directly inside Firestore, keeping chatbot responses strictly grounded to your portfolio details.",
    stars: 0,
    commits: 12,
    technologies: ["Vertex AI text-embedding-005", "Firestore Vector Search", "Google Model Armor", "Cloud Functions"],
    metrics: [
      { label: "Similarity Accuracy", value: "0.91 Cosine" },
      { label: "Avg Agent Latency", value: "1.2s" },
      { label: "Input Firewalls", value: "Model Armor" }
    ]
  },
  "dealership-adk-pipelines": {
    slug: "dealership-adk-pipelines",
    title: "dealership-adk-pipelines",
    description: "Multi-agent AI compliance engine designed to ingest dealership files, validate purchase details, and map provenance graphs using Google ADK and Neo4j.",
    detailedDescription: "An enterprise-grade compliance auditing and lineage pipeline built on a 3-tier multi-agent architecture. It ingests complex automotive dealer contract spreadsheets and purchase files, extracts key coordinates and properties via multimodal Gemini parsing, validates deals through an interactive human-in-the-loop checkpoint, and indexes audit-ready PROV-O compliance records in a high-speed Neo4j AuraDB graph database utilizing custom Model Context Protocol (MCP) toolsets.",
    stars: 0,
    commits: 16,
    technologies: ["Google ADK (Agent Development Kit)", "Neo4j AuraDB", "CopilotKit (v2)", "Model Context Protocol (MCP)", "FastAPI", "React (Vite)"],
    metrics: [
      { label: "Agent Orchestration", value: "4 Sub-Agents (ADK)" },
      { label: "Provenance Standard", value: "W3C PROV-O Model" },
      { label: "Compliance Gateway", value: "Interactive HITL Checkpoint" }
    ],
    githubRepo: "dealership_adk_pipelines",
    githubOwner: "gamezsal"
  },
   "course-creation-agent": {
    slug: "course-creation-agent",
    title: "course-creation-agent",
    description: "Distributed multi-agent course creation engine built with Google's Agent Development Kit (ADK) and A2A protocol.",
    detailedDescription: "A cutting-edge distributed microservices system designed to automatically research, evaluate, and generate structured educational courses. Built on Google's Agent Development Kit (ADK) and the Agent-to-Agent (A2A) communication protocol, it orchestrates four separate standalone Cloud Run microservices: an Orchestrator Service managing workflows with Sequential and Loop agents, a Google Search-powered Researcher Service, an LLM-based Quality Judge, and a modular Content Builder Service.",
    stars: 0,
    commits: 18,
    technologies: ["Google ADK", "Agent-to-Agent (A2A)", "Python (uv)", "Docker & Cloud Run", "Google Search Tool", "FastAPI"],
    metrics: [
      { label: "Agent Microservices", value: "4 Autonomous Services" },
      { label: "Communication Protocol", value: "A2A via AgentCard" },
      { label: "Deployment Framework", value: "GCP Cloud Run" }
    ],
    githubRepo: "course-creation-agent",
    githubOwner: "gamezsal"
  },
   "adk-sf-workspace": {
    slug: "adk-sf-workspace",
    title: "adk-sf-workspace",
    description: "Conversational Salesforce CRM assistant leveraging Gemini 2.5 Flash, Google ADK, and Composio Tool-Router SDK.",
    detailedDescription: "An enterprise-ready AI assistant that securely interacts with Salesforce CRM to manage accounts, contacts, and opportunities. Built using Google's Agent Development Kit (ADK) and Composio's Tool-Router SDK, it leverages Gemini 2.5 Flash for complex planning and reasoning, while strictly restricting tool access to a secure, filtered subset (such as SOQL query execution and record management). Features built-in exponential backoff, Salesforce OAuth flow orchestration, and strict least-privilege security policies.",
    stars: 0,
    commits: 1,
    technologies: ["Google ADK", "Composio Tool-Router", "Gemini 2.5 Flash", "Salesforce REST & SOQL", "OAuth 2.0", "Python"],
    metrics: [
      { label: "CRM Integration", value: "Salesforce REST API" },
      { label: "Security Enforcement", value: "Least-Privilege Tool Filtering" },
      { label: "Planning LLM Engine", value: "Gemini 2.5 Flash" }
    ],
    githubRepo: "adk-sf-workspace",
    githubOwner: "gamezsal"
  }
};
