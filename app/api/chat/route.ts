import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { retrieveRelevantContext } from "@/lib/ai/rag";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Invalid payload: 'messages' array is required." },
        { status: 400 }
      );
    }

    const latestUserMessage = messages[messages.length - 1].content;

    // 1. Vector Search: Retrieve top 3 relevant context chunks from Firestore (with fail-safe fallback)
    let relevantChunks: any[] = [];
    try {
      relevantChunks = await retrieveRelevantContext(latestUserMessage, 3);
    } catch (ragErr: any) {
      console.warn("[Chat API] RAG context retrieval warning (continuing direct stream):", ragErr.message);
    }

    // 2. Build Guardrailed System Prompt with layout specifications
    let contextText = "";
    if (relevantChunks && relevantChunks.length > 0) {
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
If the user's query asks about a specific job, experience, or technical project (e.g., "What did Salvador do at KPMG?", "Tell me about his work at DLRdmv"), you MUST format your response using this EXACT structure with clean spacing:

1. INTRO SENTENCE: Start with this exact structure (do not add any double carriage returns inside this intro sentence):
"At **[Company Name]**, as a **[Professional Title]**, Salvador [core strategic responsibility or high-level project impact] utilizing **[Tech 1]**, **[Tech 2]**, and **[Tech 3]**. Key highlights of his [Focus of Query, e.g. Graph RAG / AI development] work at [Company Name] include:"

2. BULLET POINTS SPACING: Immediately after the intro sentence, you MUST insert two newlines (\\n\\n) to start a completely new paragraph block.
Then, detail 2 to 3 action-oriented accomplishments. Each bullet point MUST start on a brand new line with a bullet symbol (•) and be separated from the other bullets by a double newline (\\n\\n) to ensure clean rendering. Format each bullet exactly like this:

• **[Highlight Title]:** [Detail starting with a strong, active verb. Always write out metrics, percentages, dollar amounts, and team sizes in bold inside the text (e.g., **90%**, **$2M**, **12 team members**, **8 years**).]

3. NO INTRO OR OUTRO FILLER: Skip conversational preambles like "Sure, here's what..." or "Based on Salvador's resume..." and concluding notes like "Let me know if you need anything else." Start directly with the intro sentence structure.

STRICT GROUNDING RULES:
- Ground your answers strictly in the provided Context Chunks below. Do not invent any facts, numbers, dates, or titles.
- Keep answers professional, persuasive, and directly optimized for executive recruiters or engineering hiring managers.
- If the user asks something outside the scope of Salvador's experience, politely state that you can only answer questions related to Salvador's professional work.

--- RETRIEVED PORTFOLIO CONTEXT ---
${contextText}
-----------------------------------
`;

    // 3. Stream Response Chunks via Gemini API (gemini-3.6-flash)
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3.6-flash",
      contents: messages.map((msg: any) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      })),
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2, // Low temperature keeps answers fact-aligned and precise
      },
    });

    // 4. Convert to Web ReadableStream for Frontend Consumption
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            if (chunk.text) {
              controller.enqueue(encoder.encode(chunk.text));
            }
          }
        } catch (streamErr) {
          console.error("[Chat API Stream Error]:", streamErr);
        } finally {
          controller.close();
        }
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
