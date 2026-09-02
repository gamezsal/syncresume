import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { getFirestoreDb } from "@/lib/cache/firestore";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

/**
 * Zod Schema representing the exact layout matching ResumeDiffView.tsx
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
  }),
  skills: z.object({
    languages: z.array(z.string()).describe("Programming languages (e.g. TypeScript, JavaScript, Python, Go)"),
    frameworks: z.array(z.string()).describe("Libraries & frameworks (e.g. React, Next.js, Node.js, Tailwind)"),
    cloudAndDevOps: z.array(z.string()).describe("Cloud and DevOps tooling (e.g. Docker, Kubernetes, AWS, GCP, Firebase, Git)"),
    databases: z.array(z.string()).describe("Databases and caching tiers (e.g. Redis, Firestore, PostgreSQL, MongoDB)"),
  }).describe("Categorized technical skills and tools"),
  summary: z.string().describe("A comprehensive professional summary or bio"),
  workExperience: z.array(
    z.object({
      company: z.string().describe("Name of the company or organization"),
      link: z.string().optional().describe("URL linking to the company website or project"),
      location: z.string().describe("Work location (e.g. city, state or 'Remote')"),
      contract: z.string().describe("Type of employment (e.g. 'Full-time', 'Contract', 'Co-founder')"),
      title: z.string().describe("Job title or role name"),
      start: z.string().describe("Start date (e.g., 'Jan 2023' or '2023-01')"),
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

/**
 * OpenAPI JSON Schema configured for Gemini Structured Outputs
 */
const ResumeDataJsonSchema = {
  type: "object",
  properties: {
    header: {
      type: "object",
      properties: {
        name: { type: "string", description: "The candidate's full name" },
        shortAbout: { type: "string", description: "A brief, one-sentence elevator pitch" },
        location: { type: "string", description: "Current geographical location (city, state/country)" },
        contacts: {
          type: "object",
          properties: {
            website: { type: "string", description: "Portfolio or personal website URL" },
            email: { type: "string", description: "Professional email address" },
            phone: { type: "string", description: "Contact phone number" },
            twitter: { type: "string", description: "Twitter/X profile URL" },
            linkedin: { type: "string", description: "LinkedIn profile URL" },
            github: { type: "string", description: "GitHub profile URL" },
          },
          required: ["email"],
        },
      },
      required: ["name", "shortAbout", "contacts"],
    },
    skills: {
      type: "object",
      properties: {
        languages: { type: "array", items: { type: "string" }, description: "Programming languages (e.g. TypeScript, Python, Go)" },
        frameworks: { type: "array", items: { type: "string" }, description: "Libraries & frameworks (e.g. React, Next.js, Node.js)" },
        cloudAndDevOps: { type: "array", items: { type: "string" }, description: "Cloud & DevOps (e.g. Docker, Firebase, GCP, AWS, Git)" },
        databases: { type: "array", items: { type: "string" }, description: "Databases & caching tiers (e.g. Redis, Firestore, PostgreSQL, MongoDB)" },
      },
      required: ["languages", "frameworks", "cloudAndDevOps", "databases"],
    },
    summary: { type: "string", description: "A comprehensive professional summary or bio" },
    workExperience: {
      type: "array",
      items: {
        type: "object",
        properties: {
          company: { type: "string", description: "Name of the company or organization" },
          link: { type: "string", description: "URL linking to the company website or project" },
          location: { type: "string", description: "Work location (e.g. city, state or 'Remote')" },
          contract: { type: "string", description: "Type of employment (e.g. 'Full-time', 'Contract', 'Co-founder')" },
          title: { type: "string", description: "Job title or role name" },
          start: { type: "string", description: "Start date (e.g., 'Jan 2023')" },
          end: { type: "string", description: "End date or 'Present' if current" },
          description: { type: "string", description: "Key responsibilities, achievements, and technologies" },
        },
        required: ["company", "location", "contract", "title", "start", "description"],
      },
      description: "Chronological list of professional work history",
    },
    education: {
      type: "array",
      items: {
        type: "object",
        properties: {
          school: { type: "string", description: "Name of the educational institution" },
          degree: { type: "string", description: "Degree, major, or certification earned" },
          start: { type: "string", description: "Start date or year" },
          end: { type: "string", description: "End date, year of graduation, or 'Expected 2026'" },
        },
        required: ["school", "degree", "start", "end"],
      },
      description: "Educational background and degrees",
    },
  },
  required: ["header", "skills", "summary", "workExperience", "education"],
};

const ResumeDataPropertyOrdering = ["header", "skills", "summary", "workExperience", "education"];

export async function GET() {
  return NextResponse.json({
    status: "ACTIVE",
    message: "Resume parsing gateway is online. Ready to receive POST uploads!",
  });
}

export async function POST(req: NextRequest) {
  console.log("[Resume Parse API] Processing incoming document stream...");

  try {
    const authHeader = req.headers.get("X-Firebase-Auth") || req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.warn("[Resume Parse API] Access attempt without valid credentials.");
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("[Resume Parser API] Failure: GEMINI_API_KEY is missing from environment.");
      return NextResponse.json(
        { error: "API Key Failure", message: "The GEMINI_API_KEY is missing. Ingestion bypassed." },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No PDF file provided." }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Unsupported Media Type", message: "Only PDF documents are allowed." },
        { status: 415 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const pdfBase64 = buffer.toString("base64");

    const ai = new GoogleGenAI({ apiKey });

    console.log(`[Resume Parse API] Sending base64 stream of '${file.name}' to Gemini 3.6...`);
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        {
          inlineData: { data: pdfBase64, mimeType: "application/pdf" },
        },
        {
          text: "You are an expert resume writer and data parser. " +
                "Extract the candidate's structured resume information from the uploaded PDF document. " +
                "Parse all headers, technical skills grouped by type, chronological work history details, and education entries. " +
                "Strictly adhere to the provided JSON Schema structure and property ordering. " +
                "If some optional fields are not present in the document, cleanly omit them or return null.",
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          ...ResumeDataJsonSchema,
          propertyOrdering: ResumeDataPropertyOrdering,
        } as any,
      },
    });

    const outputText = response.text;
    if (!outputText) {
      throw new Error("Gemini returned an empty text response. Failed to extract data.");
    }

    console.log("[Resume Parser API] Parsing response into structured JSON object...");
    let parsedJson: any;
    try {
      parsedJson = JSON.parse(outputText);
    } catch (jsonErr: any) {
      console.error("[Resume Parser API] Malformed JSON generated by Gemini:", outputText);
      throw new Error(`The AI model failed to produce syntactically valid JSON. Error: ${jsonErr.message}`);
    }

    const validationResult = ResumeDataSchema.safeParse(parsedJson);
    if (!validationResult.success) {
      console.error("[Resume Parser API] Schema Validation failed:", validationResult.error.format());
      return NextResponse.json(
        {
          error: "Schema Validation Failure",
          message: "The model output succeeded JSON parsing but drifted from the expected Zod Schema contract.",
          details: validationResult.error.format(),
        },
        { status: 422 }
      );
    }

    const validatedData = validationResult.data;

    const db = getFirestoreDb();
    if (!db) {
      return NextResponse.json({ error: "Firestore connection unavailable." }, { status: 500 });
    }

    console.log("[Resume Parse API] Parsing complete! Staging draft in Firestore...");
    await db.collection("resume-staging").doc("latest").set({
      parsedData: validatedData,
      status: "STAGED",
      fileName: file.name,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Resume successfully parsed, validated, and staged for review.",
      data: validatedData,
    });

  } catch (error: any) {
    console.error("[Resume Parse Route Error]:", error);
    return NextResponse.json({ error: `Parsing failed: ${error.message}` }, { status: 500 });
  }
}
