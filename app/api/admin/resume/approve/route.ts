import { NextRequest, NextResponse } from "next/server";
import { getFirestoreDb } from "@/lib/cache/firestore";
import { generateEmbedding } from "@/lib/ai/embeddings";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  console.log("[Resume Approval API] Merge and re-index request triggered.");

  try {
    const authHeader = req.headers.get("X-Firebase-Auth") || req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.warn("[Resume Approval API] Access attempt without valid credentials.");
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const db = getFirestoreDb();
    if (!db) {
      return NextResponse.json({ error: "Firestore connection unavailable." }, { status: 500 });
    }

    const stagedDoc = await db.collection("resume-staging").doc("latest").get();
    if (!stagedDoc.exists) {
      return NextResponse.json({ error: "No staged resume draft found to approve." }, { status: 404 });
    }

    const stagedData = stagedDoc.data()!;
    const parsedData = stagedData.parsedData;

    if (!parsedData) {
      return NextResponse.json({ error: "Staged document found, but payload data is empty." }, { status: 422 });
    }

    // Commit the validated payload to your active live profile
    await db.collection("portfolio-profile").doc("active").set(parsedData);

    // 👇 Safely flatten categorized skills into a single comma-separated list for RAG search
    const skillsList = parsedData.skills
      ? [
          ...(parsedData.skills.languages || []),
          ...(parsedData.skills.frameworks || []),
          ...(parsedData.skills.cloudAndDevOps || []),
          ...(parsedData.skills.databases || []),
        ].join(", ")
      : "N/A";

    const shortAbout = parsedData.header?.shortAbout || "";
    const summary = parsedData.summary || "";

    const experienceRows = Array.isArray(parsedData.workExperience)
      ? parsedData.workExperience
          .map(
            (exp: any) =>
              `• Role: ${exp.title} at ${exp.company} (${exp.start} - ${exp.end || "Present"})\n  Location: ${exp.location} (${exp.contract})\n  Impact: ${exp.description}`
          )
          .join("\n\n")
      : "No experience records.";

    const educationRows = Array.isArray(parsedData.education)
      ? parsedData.education
          .map((edu: any) => `• ${edu.degree} from ${edu.school} (${edu.start} - ${edu.end})`)
          .join("\n")
      : "No education history.";

    const experienceChunk = `
Salvador Gamez - Professional Engineering Profile

About: ${shortAbout}
Summary: ${summary}
Core Competencies & Technologies: ${skillsList}

Professional Work History:
${experienceRows}

Academic Foundations:
${educationRows}
`;

    console.log("[Resume Approval API] Re-indexing RAG database embedding vectors...");
    const vector = await generateEmbedding(experienceChunk);

    await db.collection("portfolio-knowledge").doc("resume-experience").set({
      title: "Salvador Gamez - Detailed Work Experience & Skills",
      category: "resume",
      content: experienceChunk,
      contentEmbedding: FieldValue.vector(vector),
      updatedAt: new Date().toISOString(),
    });

    await db.collection("resume-staging").doc("latest").update({
      status: "APPROVED",
      approvedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Resume approved! Live profile updated and RAG chatbot successfully re-indexed.",
    });

  } catch (error: any) {
    console.error("[Resume Approval Error]:", error);
    return NextResponse.json({ error: `Approval failed: ${error.message}` }, { status: 500 });
  }
}
