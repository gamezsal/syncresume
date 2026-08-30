import { NextResponse } from "next/server";
import { getFirestoreDb } from "@/lib/cache/firestore";
import { generateEmbedding } from "@/lib/ai/embeddings";
import { FieldValue } from "firebase-admin/firestore";

export async function POST() {
  try {
    const db = getFirestoreDb();
    if (!db) {
      return NextResponse.json(
        { error: "Firestore connection unavailable." },
        { status: 500 }
      );
    }

    // 1. Fetch staged draft
    const stagedDoc = await db.collection("resume-staging").doc("latest").get();
    if (!stagedDoc.exists) {
      return NextResponse.json(
        { error: "No staged resume draft found to approve." },
        { status: 404 }
      );
    }

    const { parsedData } = stagedDoc.data()!;

    // 2. Commit to live profile collection
    await db.collection("portfolio-profile").doc("active").set(parsedData);

    // 3. Dynamic Vector Re-indexing for RAG Chatbot
    const experienceChunk = `
Salvador Gamez - Work History & Experience:
${parsedData.experience
  .map(
    (exp: any) =>
      `Role: ${exp.role} at ${exp.company} (${exp.startDate} - ${exp.endDate || "Present"})\nTech: ${exp.technologies.join(", ")}\nHighlights:\n- ${exp.bulletPoints.join("\n- ")}`
  )
  .join("\n\n")}
`;

    const vector = await generateEmbedding(experienceChunk);

    await db.collection("portfolio-knowledge").doc("resume-experience").set({
      title: "Salvador Gamez - Detailed Work Experience & Skills",
      category: "resume",
      content: experienceChunk,
      contentEmbedding: FieldValue.vector(vector),
      updatedAt: new Date().toISOString(),
    });

    // 4. Mark staging as approved
    await db.collection("resume-staging").doc("latest").update({
      status: "APPROVED",
      approvedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Resume approved! Live profile updated and RAG chatbot re-indexed.",
    });
  } catch (error: any) {
    console.error("[Resume Approval Error]:", error);
    return NextResponse.json(
      { error: `Approval failed: ${error.message}` },
      { status: 500 }
    );
  }
}
