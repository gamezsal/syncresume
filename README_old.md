# syncresume 🚀

An interactive, high-performance, bento-grid engineering portfolio and multi-layered resume synchronization platform. Fully automated, protected by enterprise-grade AI security shields, and optimized for sub-millisecond loads through multi-tier caching.

---

## 🏗️ System Architecture & Phased Roadmap

### Phase 1: Core Shell, Bento Grid UX, and Firebase App Hosting (MVP)
The frontend core utilizes **Next.js 15 (App Router)** and **React 19** to deliver dynamic nested layouts and hardware-accelerated interface states [cite: 1, 9].
* **Parallel & Intercepted Routing:** The project-modal showcases leverage Next.js parallel slots (`@modal`) combined with level-one route interceptors (`(.)projects/[slug]`) to support an Instagram-style overlay feed [cite: 3, 4]. When clicking a project card, Next.js masks the client browser URL to `/projects/[slug]` but loads the modal component in place [cite: 3, 5].
* **Deep-Linking & Hard Navigation:** If a user directly accesses or refreshes a project URL, Next.js bypasses path interception and natively renders the standalone page [cite: 3, 5]. To prevent rendering mismatches during soft/hard transitions, a `default.tsx` and a `[...catchAll]` route return `null` inside the `@modal` slot, cleanly closing active modal components when navigating away [cite: 5, 6].
* **Serverless Compute Limits:** Handled by a declarative `apphosting.yaml` config, enforcing a cost-saving scaling limit of `minInstances: 1` and `maxInstances: 10` on Cloud Run [cite: 38]. 
  > *Note on Deployments:* To bypass a known buildpack integration issue where compiler-generated configurations can silently override the user's `minInstances` and default to `0` instances, the system scales at the service level to ensure cold-starts are neutralized while maintaining runtime budget limits [cite: 42].

### Phase 2: Real-Time GitHub Ingestion & Multi-Tier Rate-Limit Caching
Solves the architectural bottleneck of external rate limits (which limit unauthenticated users to 60 requests/hour/IP) [cite: 16, 18].
* **Hybrid API Ingestion Strategy:**
  * **GraphQL v4 (Enterprise Context):** Querying nested directory files and repository sizes in a single, complex request [cite: 15, 19]. Rather than making recursive REST calls, GraphQL retrieves files using query aliasing and head references, costing only 1-2 complexity points out of your 5,000-point hourly budget [cite: 17, 21, 22].
  * **REST v3 (Activity Logs):** Running pagination queries to pull commit histories and parse markdown README documents natively [cite: 15]. REST automatically excludes merge/bot commits, saving computational resources on the client [cite: 25].
* **Multi-Tier Caching Pipeline:**
  $$\text{Next.js SSR} \longrightarrow \text{Cloud Memorystore (Redis)} \longrightarrow \text{Cloud Firestore NoSQL} \longrightarrow \text{GitHub API}$$
  Every showcase page load first checks **Cloud Memorystore for Redis** (returning single-digit ms hits) [cite: 12, 26]. On a miss, it falls back to **Cloud Firestore** [cite: 11]. If both miss, a secure GitHub App Token triggers a fresh API retrieval, populating both cache layers [cite: 11, 23].
* **Conditional HTTP Headers:** To prevent rate consumption, the database stores ETags and Last-Modified timestamps [cite: 18, 23]. If data hasn't changed, GitHub returns a `304 Not Modified` response (costing zero quota points) [cite: 18, 23]. Since ETags are tied to 1-hour transient App Installation Tokens, `Last-Modified` timestamps serve as a fallback to preserve cache state across token lifecycles [cite: 23].

### Phase 3: Conversational RAG Chatbot Drawer
An embedded drawer component that acts as a real-time conversational agent answering technical recruiters' questions.
* **Vector Embeddings:** Translates resume text and repository structures into multi-dimensional vector coordinates using **Vertex AI text-embedding-005**.
* **Vector Database:** Stores vectors in Firestore using the native `FieldValue.vector()` type. Direct nearest-neighbor similarity searches are executed with **Cosine Distance** queries.
* **Contextual Grounding:** Extracted documents are injected directly into the LLM system prompt, blocking recruiters from overriding instructions or executing prompt jailbreaks.

### Phase 4: Automated Resume Ingestion Pipeline
An end-to-end serverless ingestion parser that converts static resumes into interactive bento features.
* **Storage Triggers:** Dropping a new resume PDF into **Cloud Storage** triggers an event-driven **Eventarc** payload, launching an automated parser on Cloud Run [cite: 29].
* **Gemini Structured Output:** Directs the model to parse the PDF using a strict JSON format (`response_mime_type: "application/json"`) validated against a Zod-generated OpenAPI schema.
* **Merge Conflict Dashboard:** Renders an Admin Diff interface comparing newly parsed sections with live data, allowing the engineer to safely approve merging new credentials, re-indexing vector coordinates, and relinking repositories.

### Phase 5: Google Cloud Model Armor Shields
The final layer of security, establishing a firewall across your conversational interfaces.
* **Input Shielding:** Filters incoming recruiter questions in real-time, blocking prompt injections, adversarial overrides, and malicious jailbreaks before they reach Vertex AI.
* **Output Shielding:** Automatically redacts sensitive Personally Identifiable Information (PII) such as phone numbers, physical addresses, and security credentials before rendering text to visitors.

---

## 📂 Project Directory Structure

```text
~/syncresume/
├── app/
│   ├── @modal/                         # Parallel route slot for modal overlays
│   │   ├── (.)projects/[slug]/         # Intercepted route catching client-side card clicks
│   │   │   └── page.tsx                # Binds Intercepted Route to the Modal Wrapper
│   │   ├── [...catchAll]/              # Prevents page-crash on unhandled modal routes
│   │   │   └── page.tsx
│   │   └── default.tsx                 # Null render for when modal is closed
│   ├── projects/[slug]/                # Standalone deep-link route (used on page refresh)
│   │   └── page.tsx                    # Renders standalone view matching main layout
│   ├── store/
│   │   └── useLayoutStore.ts           # Zustand global state coordinator for transitions
│   ├── globals.css                     # Tailwind bases + tech-themed scrollbars
│   ├── layout.tsx                      # Root frame, syncresume.io nav header, and modal outlet
│   └── page.tsx                        # Home Bento-grid showcase with live telemetry index
├── components/
│   ├── ModalWrapper.tsx                # Framer Motion animated overlay container (60fps fade/spring)
│   ├── ProjectCard.tsx                 # Bento Grid item running hardware-accelerated scaling
│   └── ProjectDetails.tsx              # Telemetry & technical spec sheet dictionary
├── public/                             # Asset storage for custom icons/PDF files
├── apphosting.yaml                     # Serverless compute specs (1-10 instances, 512MB RAM)
├── next.config.js                      # React strict-mode compile parameters
├── package.json                        # Lowercase syncresume identities & core dependencies
├── postcss.config.js                   # Styles processing pipeline
├── tailwind.config.js                  # Interface styling layout rules
└── tsconfig.json                       # Developer type safety constraints
```

---

## 🚀 Local Development Quickstart

Cloud Shell comes equipped with Node.js and npm pre-installed. Start the local server by executing:

```bash
# 1. Install dependencies
npm install

# 2. Run the hot-reloading development server
npm run dev
```

The app will compile and host on `http://localhost:3000`. To view your site:
1. Click the **Web Preview** button in the top-right toolbar of Google Cloud Shell.
2. Select **Preview on port 3000**.
3. Explore the seamless bento-grid overlay transitions!

---

## ⚙️ Environmental Variable Reference (`apphosting.yaml`)

Your runtime is configured for zero-overhead, highly available operations:
```yaml
runConfig:
  minInstances: 1      # Guarantees always warm containers (prevents cold-starts)
  maxInstances: 10     # Safeguards against runaway billing spikes
  concurrency: 80      # Max concurrent requests processed per server container
  cpu: 1               # Dedicated compute allocation
  memoryMiB: 512       # Allocated RAM bounds
```
