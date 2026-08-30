import { NextRequest, NextResponse } from "next/server";
import { parseResumePdfBuffer } from "@/lib/ai/parser";
import { getFirestoreDb } from "@/lib/cache/firestore";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No PDF file provided." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. Pass PDF buffer directly to Gemini Native Multimodal PDF Parser
    const parsedData = await parseResumePdfBuffer(buffer);

    // 2. Stage draft in Firestore
    const db = getFirestoreDb();
    if (!db) {
      return NextResponse.json(
        { error: "Firestore connection unavailable." },
        { status: 500 }
      );
    }

    await db.collection("resume-staging").doc("latest").set({
      parsedData,
      status: "STAGED",
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Resume successfully parsed and staged for review.",
      data: parsedData,
    });
  } catch (error: any) {
    console.error("[Resume Parse Route Error]:", error);
    return NextResponse.json(
      { error: `Parsing failed: ${error.message}` },
      { status: 500 }
    );
  }
}
