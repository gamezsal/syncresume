# syncresume 🚀

**An interactive, high-performance, bento-grid engineering portfolio and multi-layered resume synchronization platform.**  
*Fully automated, protected by enterprise-grade AI security shields, optimized for sub-millisecond loads through multi-tier caching, and backed by a 7-step automated resume parsing & vector re-indexing pipeline.*

---

## 📸 Executive Summary & System Vision

`syncresume` bridges static engineering resumes and dynamic web portfolios. Instead of manually updating project cards, technical skills, or experience blocks whenever a resume or GitHub repository changes, `syncresume` automates the entire ingestion, verification, security screening, vector embedding, and live deployment pipeline across Google Cloud Platform (GCP) and Firebase App Hosting.

Key architectural guarantees:
* **Sub-millisecond latency**: Multi-tier caching via Cloud Memorystore (Redis) and Cloud Firestore NoSQL.
* **Zero rate-limit exhaustion**: Hybrid REST v3 / GraphQL v4 API consumption with conditional ETag & `Last-Modified` validation.
* **Enterprise AI Guardrails**: Real-time prompt injection prevention, jailbreak blocking, and PII redaction using Google Cloud Model Armor.
* **Instant Conversational RAG**: Embedded chatbot (`ChatDrawer`) powered by Vertex AI `text-embedding-005` vector search over native Firestore vector indexes.
* **Human-in-the-Loop 7-Step Ingestion Pipeline**: Serverless PDF parsing via Gemini 2.5 structured JSON outputs with an Admin Diff UI and single-click approval pipeline.

---

## 🏗️ Architecture & 5-Phase System Roadmap

```
[ Visitor Browser ] <---> [ Firebase App Hosting Edge CDN ] <---> [ Next.js 15 Cloud Run Serverless ]
                                                                             │
    ┌────────────────────────────────────────────────────────────────────────┼──────────────────────────────────┐
    │                                                                        │                                  │
[ Cloud Memorystore (Redis) ] <---> [ Cloud Firestore Vector DB ] <---> [ Model Armor Shield ] <---> [ Vertex AI / Gemini ]
```

### Phase 1: Core Shell, Bento Grid UX, & Firebase App Hosting (MVP)
* **Framework**: Next.js 15 (App Router) with React 19, Tailwind CSS, Framer Motion (60fps hardware-accelerated transitions), and Zustand global layout state.
* **Parallel & Intercepted Routing**:
  * Project cards open in an overlay modal using Next.js parallel slots (`@modal`) and level-one route interceptors (`(.)projects/[slug]`).
  * Direct URL access or page refreshes bypass route interception and render standard deep-linked views (`projects/[slug]/page.tsx`).
  * `default.tsx` and `[...catchAll]` catch-all routes ensure unhandled modal slots render `null` cleanly without crashing the layout during state transitions.
* **Serverless Hosting & Runtime Constraints**:
  * Managed via declarative `apphosting.yaml` deployed to Cloud Run in `us-central1`.
  * Configured with `minInstances: 1` (always-warm container to eliminate cold-starts) and `maxInstances: 10` (safeguards against runaway billing spikes).
  * 512MB RAM memory limit, single-CPU allocation, and container concurrency cap of 80 requests per instance.

### Phase 2: Real-Time GitHub Ingestion & Multi-Tier Caching Pipeline
Solves external rate-limiting bottlenecks (unauthenticated GitHub API limit of 60 requests/hr/IP vs authenticated budget of 5,000 requests/hr).
* **Hybrid API Ingestion Strategy**:
  * **GraphQL v4 (Enterprise Context)**: Fetches nested file trees, repository sizes, and file structures using query aliasing and head references in single, low-cost calls (1-2 complexity points out of 5,000 points/hr).
  * **REST v3 (Activity Logs)**: Pulls commit histories, README markdown, and repository metadata while filtering out bot and merge commits to conserve processing overhead.
* **Multi-Tier Caching Pipeline**:
  ```
  Next.js SSR  --->  Cloud Memorystore (Redis)  --->  Cloud Firestore NoSQL  --->  GitHub API
                       (30-min TTL / ~1ms)             (Fallback Persistence)       (Authenticated)
  ```
* **Conditional HTTP Headers**:
  * Stores ETags (`If-None-Match`) and `Last-Modified` (`If-Modified-Since`) timestamps in Firestore.
  * If repository content is unchanged, GitHub returns `304 Not Modified` (costing 0 rate-limit points).
  * `Last-Modified` timestamps act as a persistent fallback across 1-hour transient GitHub App token expiration cycles.

### Phase 3: Conversational RAG Chatbot Drawer
* **Vector Embeddings**: Translates resume sections, work experience, and technical projects into 768-dimensional vector representations using **Vertex AI `text-embedding-005`**.
* **Native Firestore Vector Search**: Vectors are stored using Firestore native `FieldValue.vector()` types. Similarity retrieval is executed using `findNearest` Cosine Distance queries.
* **Contextual Grounding & System Prompt Isolation**: Injects retrieved vector passages inside structured `<context_grounding_data>` XML wrappers, preventing prompt overrides or indirect prompt injection attacks.

### Phase 4: Automated Resume Ingestion & 7-Step Admin Approval Pipeline
* **Event-Driven Storage Triggers**: Dropping a PDF resume (`Salvador Gamez_Resume_Final.pdf`) into Cloud Storage triggers an Eventarc notification launching a Cloud Run serverless parser.
* **Gemini Structured JSON Extraction**: Uses Gemini 2.5 with `response_mime_type: "application/json"` enforced against a Zod-generated OpenAPI schema (`ResumeDataSchema`).
* **Admin Diff UI & Merge Engine**: Renders a side-by-side diff interface (`ResumeDiffView.tsx`) allowing the admin to inspect staging changes.
* **The 7-Step Approval Pipeline (`/api/admin/resume/approve`)**:
  1. **Edge Auth Verification**: Next.js Edge Middleware validates the `__session` Firebase ID Token cookie passed via `credentials: "include"`.
  2. **Draft JSON Extraction**: Reads staged draft payload from Firestore.
  3. **Live Profile Merge**: Surgically merges updated skills, experience, and projects into the production profile document.
  4. **Staging Reset**: Clears draft state to restore clean admin UI indicators.
  5. **Storage Reference Sync**: Updates raw resume file links and storage metadata.
  6. **Background Vector Re-Indexing**: Triggers Vertex AI `text-embedding-005` embedding generation and updates Firestore vector collections in background execution.
  7. **Cloud Logging Telemetry**: Emits structured JSON logs to Cloud Logging (`projects/syncresume-e2d3d/logs/run.googleapis.com%2Fstdout`) and returns HTTP `200` OK in under 500ms.

### Phase 5: Google Cloud Model Armor Security Firewall
* **Input Shielding**: Filters incoming recruiter questions in real-time, blocking prompt injection, jailbreaks, and adversarial overrides before reaching Vertex AI.
* **Output Shielding**: Automatically redacts Personally Identifiable Information (PII) including physical addresses, personal phone numbers, and security credentials before rendering text to visitors.
* **SSR Window Guards & Cookie Sync**: All browser storage and DOM references enforce `typeof window !== "undefined"` guards to prevent Next.js static pre-rendering failures (`ReferenceError: document is not defined`) during Cloud Build deployments.

---

## 📂 Project Directory Structure

```text
syncresume/
├── app/
│   ├── @modal/                         # Parallel route slot for modal overlays
│   │   ├── (.)projects/[slug]/         # Intercepted route catching client-side card clicks
│   │   │   └── page.tsx                # Binds Intercepted Route to ModalWrapper
│   │   ├── [...catchAll]/              # Prevents page crashes on unhandled modal routes
│   │   │   └── page.tsx
│   │   └── default.tsx                 # Null render when modal is closed
│   ├── admin/                          # Secure Administrative Dashboard
│   │   └── page.tsx                    # Live staging diff & 7-step approval handler
│   ├── api/                            # Next.js Serverless API Routes
│   │   ├── admin/resume/approve/       # 7-Step Resume Merge & Re-index API
│   │   ├── admin/resume/status/        # Staging status & current profile endpoint
│   │   ├── chat/                       # RAG vector retrieval & Model Armor LLM route
│   │   └── telemetry/                  # Live pipeline ingestion telemetry feed
│   ├── projects/[slug]/                # Standalone deep-link route (used on page refresh)
│   │   └── page.tsx                    # Renders standalone view matching main layout
│   ├── globals.css                     # Tailwind CSS base styles & custom scrollbars
│   ├── layout.tsx                      # Root frame, header navigation, and modal outlet
│   └── page.tsx                        # Home Bento-grid showcase & telemetry panel
├── components/
│   ├── admin/
│   │   └── ResumeDiffView.tsx          # Side-by-side JSON/Markdown resume diff editor
│   ├── ChatDrawer.tsx                  # Conversational RAG assistant drawer
│   ├── ModalWrapper.tsx                # Framer Motion animated overlay container
│   ├── PipelineTelemetryCard.tsx       # Live Cloud Run & ingestion telemetry monitor
│   ├── ProjectCard.tsx                 # Bento Grid showcase item
│   └── ProjectDetails.tsx              # Telemetry & technical spec sheet dictionary
├── lib/
│   ├── embeddings.ts                   # Vertex AI text-embedding-005 vector generator
│   ├── firestore.ts                    # Firestore NoSQL & vector search client
│   ├── model-armor.ts                  # GCP Model Armor Input/Output shield wrappers
│   ├── redis.ts                        # Cloud Memorystore Redis client & rate limiter
│   └── github.ts                       # Hybrid REST v3 / GraphQL v4 API parser
├── middleware.ts                       # Next.js Edge Middleware Firebase ID Token validator
├── apphosting.yaml                     # Firebase App Hosting backend configuration
├── next.config.js                      # Next.js 15 App Router compilation rules
├── package.json                        # Core dependencies (React 19, Next 15, Firebase Admin, GCP SDKs)
├── tailwind.config.js                  # Bento grid design system & custom color scales
└── tsconfig.json                       # Strict TypeScript configuration ("noImplicitAny": true)
```

---

## ⚙️ Environment Variables & Configuration (`apphosting.yaml`)

```yaml
runConfig:
  minInstances: 1      # Always-warm instances (prevents cold-start latency)
  maxInstances: 10     # Safeguard upper limit on Cloud Run instances
  concurrency: 80      # Max concurrent requests per instance
  cpu: 1               # 1 vCPU allocation per container
  memoryMiB: 512       # 512MB RAM memory limit

env:
  - variable: NEXT_PUBLIC_FIREBASE_PROJECT_ID
    value: "syncresume-e2d3d"
  - variable: MODEL_ARMOR_TEMPLATE_ID
    value: "projects/syncresume-e2d3d/locations/us-central1/templates/syncresume-shield"
  - variable: GITHUB_APP_PRIVATE_KEY
    secret: "GITHUB_APP_PRIVATE_KEY"
  - variable: GEMINI_API_KEY
    secret: "GEMINI_API_KEY"
```

---

## 🚀 Local Development & Deployment

### Local Development Quickstart
```bash
# 1. Install dependencies
npm install

# 2. Start hot-reloading development server
npm run dev

# 3. Perform local TypeScript build check
npx tsc --noEmit
```

### Production Deployment (Firebase App Hosting)
```bash
# Commit changes to main branch to trigger deployment
git add .
git commit -m "feat: complete build 008 pipeline rollout"
git push origin main
```
