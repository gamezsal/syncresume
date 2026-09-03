import { NextRequest, NextResponse } from "next/server";
import { getFirestoreDb } from "@/lib/cache/firestore";

export async function GET(req: NextRequest) {
  try {
    const isDev = process.env.NODE_ENV === "development";
    const db = getFirestoreDb();
    if (!db) return NextResponse.json({ error: "Firestore unavailable" }, { status: 500 });

    const liveDoc = await db.collection("portfolio-profile").doc("active").get();
    const currentProfile = liveDoc.exists ? liveDoc.data() : null;

    const stagedDoc = await db.collection("resume_staging").doc("latest").get();
    let stagedDraft = null;

    if (stagedDoc.exists) {
      const stagedData = stagedDoc.data();
      stagedDraft = stagedData?.payload ?? null;
    }

    return NextResponse.json({ currentProfile, stagedDraft });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
