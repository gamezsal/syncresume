import { NextResponse } from "next/server";
import { getFirestoreDb } from "@/lib/cache/firestore";

/**
 * Calculates the exact word count from a structured parsed resume payload.
 */
function calculateWordCount(data: any): number {
  if (!data) return 0;
  let text = "";
  if (data.header) {
    text += " " + (data.header.name || "");
    text += " " + (data.header.shortAbout || "");
    if (data.header.skills) {
      text += " " + data.header.skills.join(" ");
    }
  }
  if (data.summary) {
    text += " " + data.summary;
  }
  if (data.workExperience) {
    data.workExperience.forEach((job: any) => {
      text += " " + (job.company || "");
      text += " " + (job.title || "");
      text += " " + (job.description || "");
    });
  }
  if (data.education) {
    data.education.forEach((edu: any) => {
      text += " " + (edu.school || "");
      text += " " + (edu.degree || "");
    });
  }
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export async function GET() {
  try {
    const db = getFirestoreDb();
    if (!db) {
      throw new Error("Firestore DB connection is offline.");
    }

    // Fetch the latest approved or staged resume from 'resume_staging'
    const stagingQuery = await db
      .collection("resume_staging")
      .orderBy("parsedAt", "desc")
      .limit(1)
      .get();

    let fileName = "Salvador_Gamez_Resume_Final_04132026.pdf";
    let wordCount = 1424; // Baseline fallback
    let updatedAt = new Date().toISOString();

    if (!stagingQuery.empty) {
      const doc = stagingQuery.docs[0];
      const data = doc.data();
      fileName = data.fileName || fileName;
      updatedAt = data.parsedAt || updatedAt;
      
      if (data.payload) {
        wordCount = calculateWordCount(data.payload);
      }
    }

    // Fetch the actual count of indexed RAG chunks in 'portfolio-knowledge'
    const knowledgeSnapshot = await db.collection("portfolio-knowledge").get();
    const chunksCount = knowledgeSnapshot.size || 14; // Fallback to index baseline

    return NextResponse.json({
      success: true,
      telemetry: {
        fileName,
        wordCount,
        chunksCount,
        updatedAt,
        status: "SEEDED",
        dimension: 768
      }
    }, {
      headers: { "Cache-Control": "no-store, max-age=0" }
    });

  } catch (error: any) {
    console.error("[Telemetry API Error]:", error);
    // Return graceful fallback values so your UI remains robust if Firestore is initializing
    return NextResponse.json({
      success: false,
      error: error.message,
      telemetry: {
        fileName: "Salvador_Gamez_Resume_Final_04132026.pdf",
        wordCount: 1424,
        chunksCount: 14,
        updatedAt: new Date().toISOString(),
        status: "EMULATED_SEEDED",
        dimension: 768
      }
    });
  }
}