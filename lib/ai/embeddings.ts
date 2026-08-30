import { GoogleGenAI } from "@google/genai";

/**
 * lib/ai/embeddings.ts
 *
 * Vector embedding generator using Google's Gemini API (gemini-embedding-001).
 * Safely extracts vector values across all @google/genai SDK payload shapes and
 * resizes/normalizes vectors to 768 dimensions for Firestore compatibility.
 */

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

function extractValues(res: any): number[] | null {
  if (!res) return null;
  if (Array.isArray(res.embedding?.values)) return res.embedding.values;
  if (Array.isArray(res.embeddings?.[0]?.values)) return res.embeddings[0].values;
  if (Array.isArray(res.embedding)) return res.embedding;
  if (Array.isArray(res.values)) return res.values;
  return null;
}

const CANDIDATE_MODELS = [
  "models/gemini-embedding-001",
  "models/gemini-embedding-2",
];

let workingModel: string | null = null;

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || typeof text !== "string") {
    throw new Error("[Embeddings Engine] Input text must be a non-empty string.");
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "[Embeddings Engine] GEMINI_API_KEY is missing from environment. Please check your .env.local file."
    );
  }

  const modelsToTry = workingModel
    ? [workingModel, ...CANDIDATE_MODELS.filter((m) => m !== workingModel)]
    : CANDIDATE_MODELS;

  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.embedContent({
        model,
        contents: text,
      });

      const rawValues = extractValues(response);

      if (rawValues && rawValues.length > 0) {
        if (!workingModel) {
          workingModel = model;
          console.log(`[Embeddings Engine] Connected successfully using model: '${model}'`);
        }
        // Slice to 768 dimensions for Firestore vector limits & L2 normalize
        const sliced = rawValues.slice(0, 768);
        const norm = Math.sqrt(sliced.reduce((sum: number, val: number) => sum + val * val, 0));
        return norm > 0 ? sliced.map((val: number) => val / norm) : sliced;
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  console.error("[Embeddings Engine] Critical embedding generation failure:", lastError?.message || lastError);
  throw new Error(
    `Failed to generate text embedding: ${lastError?.message || "No embedding values returned from Gemini API"}`
  );
}

export async function generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
  if (!texts || !Array.isArray(texts) || texts.length === 0) {
    return [];
  }
  const embeddingPromises = texts.map((text) => generateEmbedding(text));
  return await Promise.all(embeddingPromises);
}
