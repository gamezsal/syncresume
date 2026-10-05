import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { retrieveRelevantContext } from "@/lib/ai/rag";
import { isRateLimited } from "@/lib/cache/redis-rate-limiter";
import { sanitizeInputWithModelArmor } from "@/lib/security/model-armor";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export async function POST(req: NextRequest) {
  try {
    // 🛡️ 1. Rate Limit Check (Runs first to save quota & stop spam)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const rateCheck = await isRateLimited(ip, 10, 60);

    if (!rateCheck.success) {
      return NextResponse.json(
        {
          error: "Too Many Requests",
          message: `Rate limit exceeded. Please try again in ${rateCheck.reset} seconds.`,
        },
        { status: 429 }
      );
    }

  // 2. Validate Incoming Request Body
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Invalid payload: 'messages' array is required." },
        { status: 400 }
      );
    }

    const latestUserMessage = messages[messages.length - 1].content;

    // 🧹 Ensure conversation payload starts with a 'user' role (skips UI welcome message)
    const firstUserIdx = messages.findIndex((m: any) => m.role === "user");
    const activeMessages = firstUserIdx !== -1 ? messages.slice(firstUserIdx) : messages;

    // 🛡️ 3. Model Armor Active Security Check
    const armorCheck = await sanitizeInputWithModelArmor(latestUserMessage);
    if (!armorCheck.isSafe) {
      return NextResponse.json(
        {
          error: "Security Violation",
          message: "Prompt injection or jailbreak pattern detected.",
          violations: armorCheck.violations,
        },
        { status: 400 }
      );
    }

    // 4. Vector Search: Retrieve top 3 relevant context chunks from Firestore
    const relevantChunks = await retrieveRelevantContext(latestUserMessage, 3);

    // 5. Build Guardrailed System Prompt with layout specifications
    let contextText = "";
    if (relevantChunks.length > 0) {
      contextText = relevantChunks
        .map((chunk) => `--- CHUNK: ${chunk.title} (${chunk.category}) ---\n${chunk.content}`)
        .join("\n\n");
    } else {
      contextText = "No specific portfolio documents matched this query.";
    }

    const systemInstruction = `
You are the elite, executive-level AI Assistant representing Salvador Gamez's Interactive Engineering Portfolio.
Your primary role is to answer technical recruiter or hiring manager questions about Salvador's background, technical skills, architecture projects, and experience.

STRICT LAYOUT & FORMATTING RULES (CRITICAL):
Analyze the context retrieved. Determine if the query is asking about:
- CASE 1: Chronological Employment Experience (at a company like KPMG, EY, DLRdmv, HealthEquity).
- CASE 2: Technical Skills, Portfolio Blueprints, or Architecture Projects (like Next.js, Redis, Caching, Firestore Vector Search, SyncResume).

---
CASE 1: Employment Experience (KPMG, EY, DLRdmv, HealthEquity, etc.)
You MUST format your response using this structure:

"At **[Company Name]**, as a **[Professional Title]**, Salvador [core strategic responsibility or high-level project impact] utilizing **[Tech 1]**, **[Tech 2]**, and **[Tech 3]**. Key highlights of his work at [Company Name] include:"

[Insert double newline \n\n]

• **[Highlight Title]:** [Detail starting with a strong, active verb. Always write out metrics, percentages, dollar amounts, and team sizes in bold inside the text (e.g., **90%**, **$2M**, **12 team members**, **8 years**).]

---
CASE 2: Technical Skills, Blueprints, or Architecture Projects (Next.js, Redis, Caching, RAG, etc.)
You MUST format your response using this structure:

"In his work with **[Project Name / Technical Skill Area]**, Salvador engineered [core architecture, implementation detail, or system design impact] utilizing **[Tech 1]**, **[Tech 2]**, and **[Tech 3]**. Key technical achievements include:"

[Insert double newline \n\n]

• **[Technical Pillar]:** [Technical detail showing hands-on engineering capability, architectural optimization, or performance outcomes. Always write out metrics/numbers in bold (e.g., **30-minute TTL**, **768-dimensions**, **sub-millisecond**).]

---
GENERAL STYLING RULES:
- Never use the portfolio name ("Salvador Gamez Interactive Engineering Portfolio") as a company name.
- Skip conversational preambles like "Sure, here's what..." or "Based on Salvador's resume..." and concluding notes like "Let me know if you need anything else." Start directly with the Case 1 or Case 2 intro sentence structure.

STRICT GROUNDING RULES:
- Ground your answers strictly in the provided Context Chunks below. Do not invent any facts, numbers, dates, or titles.
- If the user asks something outside the scope of Salvador's experience, politely state that you can only answer questions related to Salvador's professional work.

--- RETRIEVED PORTFOLIO CONTEXT ---
${contextText}
-----------------------------------
`;

  // 6. Stream Response Chunks via Gemini API (gemini-2.5-flash)
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: activeMessages.map((msg: any) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      })),
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2, // Low temperature keeps answers fact-aligned and precise
      },
    });

    // 7. Convert to Web ReadableStream for Frontend Consumption
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of responseStream) {
          if (chunk.text) {
            controller.enqueue(encoder.encode(chunk.text));
          }
        }
        controller.close();
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error: any) {
    console.error("[Chat API Error]:", error);
    return NextResponse.json(
      { error: `Internal Server Error: ${error.message}` },
      { status: 500 }
    );
  }
}