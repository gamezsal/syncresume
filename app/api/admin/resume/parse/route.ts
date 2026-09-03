import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { getFirestoreDb } from "@/lib/cache/firestore";

/**
 * Zod Schema for strict Resume Ingestion and JSON validation.
 */
export const ResumeDataSchema = z.object({
  header: z.object({
    name: z.string().describe("The candidate's full name"),
    shortAbout: z.string().describe("A brief, one-sentence elevator pitch"),
    location: z.string().optional().describe("Current geographical location (city, state/country)"),
    contacts: z.object({
      website: z.string().optional().describe("Portfolio or personal website URL"),
      email: z.string().optional().describe("Professional email address"),
      phone: z.string().optional().describe("Contact phone number"),
      twitter: z.string().optional().describe("Twitter/X profile URL"),
      linkedin: z.string().optional().describe("LinkedIn profile URL"),
      github: z.string().optional().describe("GitHub profile URL"),
    }),
    skills: z.array(z.string()).describe("A compiled list of primary technical skills and tools"),
  }),
  summary: z.string().describe("A comprehensive professional summary or bio"),
  workExperience: z.array(
    z.object({
      company: z.string().describe("Name of the company or organization"),
      link: z.string().optional().describe("URL linking to the company website or project"),
      location: z.string().describe("Work location (e.g. city, state or 'Remote')"),
      contract: z.string().describe("Type of employment (e.g. 'Full-time', 'Contract', 'Co-founder')"),
      title: z.string().describe("Job title or role name"),
      start: z.string().describe("Start date (e.g., 'Jan 2023')"),
      end: z.string().optional().nullable().describe("End date or 'Present' if current"),
      description: z.string().describe("Key responsibilities, quantified achievements, and technologies used"),
    })
  ).describe("Chronological list of professional work history"),
  education: z.array(
    z.object({
      school: z.string().describe("Name of the educational institution"),
      degree: z.string().describe("Degree, major, or certification earned"),
      start: z.string().describe("Start date or year"),
      end: z.string().describe("End date, year of graduation, or 'Expected 2026'"),
    })
  ).describe("Educational background and degrees"),
});

const ResumeDataJsonSchema = {
  type: "object",
  properties: {
    header: {
      type: "object",
      properties: {
        name: { type: "string" },
        shortAbout: { type: "string" },
        location: { type: "string" },
        contacts: {
          type: "object",
          properties: {
            website: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            twitter: { type: "string" },
            linkedin: { type: "string" },
            github: { type: "string" },
          },
          required: ["email"],
        },
        skills: {
          type: "array",
          items: { type: "string" }
        },
      },
      required: ["name", "shortAbout", "contacts", "skills"],
    },
    summary: { type: "string" },
    workExperience: {
      type: "array",
      items: {
        type: "object",
        properties: {
          company: { type: "string" },
          link: { type: "string" },
          location: { type: "string" },
          contract: { type: "string" },
          title: { type: "string" },
          start: { type: "string" },
          end: { type: "string" },
          description: { type: "string" },
        },
        required: ["company", "location", "contract", "title", "start", "description"],
      }
    },
    education: {
      type: "array",
      items: {
        type: "object",
        properties: {
          school: { type: "string" },
          degree: { type: "string" },
          start: { type: "string" },
          end: { type: "string" },
        },
        required: ["school", "degree", "start", "end"],
      }
    },
  },
  required: ["header", "summary", "workExperience", "education"],
};

export async function POST(request: NextRequest) {
  console.log("[Resume Parser API] Ingestion request triggered.");

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "The GEMINI_API_KEY is missing from environment variables." }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get("resume") as File | null;
    if (!file || file.type !== "application/pdf") {
      return NextResponse.json({ error: "Please upload a valid PDF file under the 'resume' key." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);
    const pdfBase64 = pdfBuffer.toString("base64");

    const ai = new GoogleGenAI({ apiKey });
    console.log("[Resume Parser API] Dispatching PDF payload to Gemini...");

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        { inlineData: { data: pdfBase64, mimeType: "application/pdf" } },
        { text: "Extract the candidate's structured resume information from the uploaded PDF document." }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: ResumeDataJsonSchema as any,
      },
    });

    const outputText = response.text;
    if (!outputText) throw new Error("Gemini returned an empty text response.");

    const parsedJson = JSON.parse(outputText);
    const validationResult = ResumeDataSchema.safeParse(parsedJson);
    if (!validationResult.success) {
      return NextResponse.json({ error: "Model output diverged from Zod schema.", details: validationResult.error.format() }, { status: 422 });
    }

    const validatedData = validationResult.data;
    const db = getFirestoreDb();
    const docId = `staging_user_${Date.now()}`;
    
    const stagingPayload = {
      id: docId,
      status: "pending_review",
      parsedAt: new Date().toISOString(),
      fileName: file.name,
      payload: validatedData, // Saves payload cleanly
    };

    if (db) {
      // 1. Write dynamic ID for historical logs
      await db.collection("resume_staging").doc(docId).set(stagingPayload);
      
      // 2. 👇 CRITICAL ALIGNMENT: Save with static ID 'latest' so approve/status routes can find it
      await db.collection("resume_staging").doc("latest").set(stagingPayload);
      console.log(`[Resume Parser API] Saved staging resume record under Firestore ID: 'latest'`);
    }

    return NextResponse.json({ success: true, stagingId: docId, data: validatedData }, { status: 200 });

  } catch (error: any) {
    console.error("[Resume Parser API Critical Failure]:", error);
    return NextResponse.json({ error: error.message || "An unexpected parser error occurred." }, { status: 500 });
  }
}
