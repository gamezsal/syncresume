import { getFirestoreDb } from "../cache/firestore";
import { generateEmbedding } from "./embeddings";
import { FieldValue } from "firebase-admin/firestore";

export interface RelevantChunk {
  id: string;
  category: string;
  projectSlug?: string;
  title: string;
  content: string;
}

export async function retrieveRelevantContext(
  query: string,
  limit: number = 3
): Promise<RelevantChunk[]> {
  const db = getFirestoreDb();
  if (!db) {
    console.warn("[RAG Engine] Firestore DB unavailable for vector retrieval.");
    return [];
  }

  try {
    const queryEmbedding = await generateEmbedding(query);
    const collectionRef = db.collection("portfolio-knowledge");

    const vectorQuery = collectionRef.findNearest({
      vectorField: "contentEmbedding",
      queryVector: FieldValue.vector(queryEmbedding),
      limit,
      distanceMeasure: "COSINE",
    });

    const snapshot = await vectorQuery.get();
    const results: RelevantChunk[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      results.push({
        id: doc.id,
        category: data.category,
        projectSlug: data.projectSlug,
        title: data.title,
        content: data.content,
      });
    });

    return results;
  } catch (error: any) {
    console.error("[RAG Engine] Vector retrieval failure:", error);
    return [];
  }
}
