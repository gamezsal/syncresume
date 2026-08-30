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

    // 1. Vector Search: Retrieve top 3 relevant context chunks from Firestore
    const relevantChunks = await retrieveRelevantContext(latestUserMessage, 3);

    // 2. Build Guardrailed System Prompt
    let contextText = "";
    if (relevantChunks.length > 0) {
      contextText = relevantChunks
        .map((chunk) => `--- CHUNK: ${chunk.title} (${chunk.category}) ---\n${chunk.content}`)
        .join("\n\n");
    } else {
      contextText = "No specific portfolio documents matched this query.";
    }

    const systemInstruction = `
You are the AI Assistant for Salvador Gamez's Interactive Engineering Portfolio.
Your primary role is to answer questions about Salvador's background, technical skills, architecture projects, and experience.

STRICT GROUNDING RULES:
1. Ground your answers strictly in the provided Context Chunks below.
2. If the user asks something outside the scope of Salvador's experience or portfolio, politely reply that you can only answer questions related to Salvador's work and projects.
3. Keep answers concise, professional, engaging, and directly relevant to tech recruiters or engineering managers.

--- RETRIEVED PORTFOLIO CONTEXT ---
${contextText}
-----------------------------------
`;

    // 3. Stream Response Chunks via Gemini API (gemini-3.6-flash)
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3.6-flash",
      contents: [
        { role: "user", parts: [{ text: systemInstruction }] },
        ...messages.map((msg: any) => ({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        })),
      ],
    });

    // 4. Convert to Web ReadableStream for Frontend Consumption
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