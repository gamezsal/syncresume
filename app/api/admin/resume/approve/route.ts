import { NextRequest, NextResponse } from "next/server";
import { getFirestoreDb } from "@/lib/cache/firestore";
import { generateEmbedding } from "@/lib/ai/embeddings";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  console.log("[Resume Approval API] Merge and re-index request initiated.");

  try {
    const isDev = process.env.NODE_ENV === "development";
    const authHeader = req.headers.get("X-Firebase-Auth") || req.headers.get("Authorization");
    const hasBearer = authHeader && authHeader.startsWith("Bearer ");
    
    if (!isDev && !hasBearer) {
      console.warn("[Resume Approval API] Access attempt without valid credentials in production.");
      return NextResponse.json({ error: "Unauthorized access. Missing authorization token." }, { status: 401 });
    }

    const db = getFirestoreDb();
    if (!db) {
      return NextResponse.json({ error: "Firestore connection is offline." }, { status: 500 });
    }

    // 1. Fetch staged draft from 'resume_staging' (underscore) and document ID 'latest'
    console.log("[Resume Approval API] Step 1: Retrieving staged draft from resume_staging/latest...");
    const stagedDoc = await db.collection("resume_staging").doc("latest").get();

    if (!stagedDoc.exists) {
      return NextResponse.json({ error: "No staged resume draft was found. Please upload your PDF again." }, { status: 404 });
    }

    const stagedData = stagedDoc.data()!;
    // 👇 Extract the parsed data using the correct 'payload' key
    const parsedData = stagedData.payload;

    if (!parsedData) {
      return NextResponse.json({ error: "Staged document found, but the data payload is empty." }, { status: 422 });
    }

    // 2. Commit payload to portfolio-profile/active
    console.log("[Resume Approval API] Step 2: Committing payload to portfolio-profile/active...");
    try {
      await db.collection("portfolio-profile").doc("active").set(parsedData);
    } catch (writeErr: any) {
      return NextResponse.json({ error: `Failed to update active production profile: ${writeErr.message}` }, { status: 500 });
    }

    // 3. Compile Skills List
    console.log("[Resume Approval API] Step 3: Compiling tech skills list...");
    let skillsList = "N/A";
    try {
      const skillsField = parsedData.header?.skills ?? parsedData.skills;
      if (Array.isArray(skillsField)) {
        skillsList = skillsField.join(", ");
      } else if (skillsField && typeof skillsField === "object") {
        const { languages = [], frameworks = [], cloudAndDevOps = [], databases = [] } = skillsField as any;
        skillsList = [...languages, ...frameworks, ...cloudAndDevOps, ...databases].join(", ");
      }
    } catch (skillsErr: any) {
      console.warn("[Resume Approval API] Warning parsing skills field format. Defaulting.");
    }

    // 4. Build text chunks for RAG indexing
    console.log("[Resume Approval API] Step 4: Formatting text chunks for RAG indexing...");
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

    // 5. Generate Vertex AI Vector Embedding
    console.log("[Resume Approval API] Step 5: Generating L2 vector embedding coordinates...");
    let vector: number[];
    try {
      vector = await generateEmbedding(experienceChunk);
    } catch (embedErr: any) {
      console.error("[Resume Approval API] Embedding generation failed:", embedErr);
      return NextResponse.json({ error: `RAG Embedding Generation failed: ${embedErr.message}.` }, { status: 502 });
    }

    // 6. Save Vector embedding back to Firestore
    console.log("[Resume Approval API] Step 6: Seeding vector coordinates to Firestore portfolio-knowledge...");
    try {
      await db.collection("portfolio-knowledge").doc("resume-experience").set({
        title: "Salvador Gamez - Detailed Work Experience & Skills",
        category: "resume",
        content: experienceChunk,
        contentEmbedding: FieldValue.vector(vector),
        updatedAt: new Date().toISOString(),
      });
    } catch (vectorErr: any) {
      return NextResponse.json({ error: `Failed to save vector search index: ${vectorErr.message}` }, { status: 500 });
    }

    // 7. Update Staged Status
    console.log("[Resume Approval API] Step 7: Finalizing staging status to APPROVED...");
    try {
      await db.collection("resume_staging").doc("latest").update({
        status: "APPROVED",
        approvedAt: new Date().toISOString(),
      });
    } catch (statusErr) {
      console.warn("[Resume Approval API] Warning: Failed to update status to APPROVED.");
    }

    console.log("[Resume Approval API] Pipeline fully executed. Staging Approved successfully!");
    return NextResponse.json({
      success: true,
      message: "Resume approved! Live profile updated and RAG chatbot successfully re-indexed.",
    });

  } catch (error: any) {
    console.error("[Resume Approval Critical Crash Error]:", error);
    return NextResponse.json({ error: `Critical server crash: ${error.message}` }, { status: 500 });
  }
}
