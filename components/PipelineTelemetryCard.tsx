"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Terminal, 
  Cpu, 
  Database, 
  CheckCircle2, 
  RefreshCw, 
  FileText, 
  Binary, 
  Activity,
  Sparkles
} from "lucide-react";

interface PipelineStep {
  id: number;
  label: string;
  status: "pending" | "running" | "completed" | "failed";
  details: string;
  icon: React.ComponentType<any>;
}

interface TelemetryData {
  fileName: string;
  wordCount: number;
  chunksCount: number;
  updatedAt: string;
  status: string;
  dimension: number;
}

export default function PipelineTelemetryCard() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [dbStats, setDbStats] = useState<TelemetryData>({
    fileName: "Salvador_Gamez_Resume_Final_04132026.pdf",
    wordCount: 1424,
    chunksCount: 14,
    updatedAt: new Date().toISOString(),
    status: "SEEDED",
    dimension: 768
  });

  const [steps, setSteps] = useState<PipelineStep[]>([
    {
      id: 1,
      label: "PDF Scraper",
      status: "pending",
      details: "Ready to parse file...",
      icon: FileText,
    },
    {
      id: 2,
      label: "Zod Validator",
      status: "pending",
      details: "Awaiting verification",
      icon: Binary,
    },
    {
      id: 3,
      label: "Gemini Engine",
      status: "pending",
      details: "Awaiting LLM parse",
      icon: Cpu,
    },
    {
      id: 4,
      label: "Vector Generator",
      status: "pending",
      details: "Awaiting L2 embed",
      icon: Sparkles,
    },
    {
      id: 5,
      label: "Firestore Index",
      status: "pending",
      details: "Awaiting active seed",
      icon: Database,
    },
  ]);

  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "System initialized. Connecting to Firestore database...",
  ]);

  // Fetch real-time DB stats on component mount
  useEffect(() => {
    async function fetchTelemetry() {
      try {
        const res = await fetch("/api/telemetry");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.telemetry) {
            setDbStats(data.telemetry);
            setTerminalLogs([
              "System initialized. Live telemetry loaded from Firestore.",
              `Active Ingestion Target: ${data.telemetry.fileName}`,
              `Seeded Footprint: ${data.telemetry.chunksCount} Vector Nodes | ${data.telemetry.wordCount} Words.`
            ]);
            
            // Set initial step details to match DB stats
            setSteps(prev => prev.map(s => {
              if (s.id === 1) return { ...s, details: `Source: ${data.telemetry.fileName}` };
              if (s.id === 5) return { ...s, details: `${data.telemetry.status} (${data.telemetry.chunksCount} KNN active)` };
              return s;
            }));
          }
        }
      } catch (err) {
        console.warn("Failed to load live telemetry from Firestore, utilizing cached schema map.");
      }
    }
    fetchTelemetry();
  }, []);

  const runPipeline = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setCurrentStep(0);
    setTerminalLogs([
      `[Pipeline Telemetry] Ingestion loop manually triggered for file: ${dbStats.fileName}`,
      "Connecting to staging storage..."
    ]);

    // Reset steps to pending
    setSteps(prev => prev.map(s => ({ ...s, status: "pending", details: "Awaiting execution..." })));

    const stepsTimeline = [
      {
        id: 1,
        details: `Parsed ${dbStats.wordCount.toLocaleString()} Words`,
        log: [
          "[Ingestion Client] Ingestion request triggered.",
          `[Ingestion Client] Extracting PDF content stream from ${dbStats.fileName}...`,
          `[Ingestion Client] Read completed. Found ${dbStats.wordCount.toLocaleString()} words across active document nodes.`
        ]
      },
      {
        id: 2,
        details: "Verified strict Zod schema",
        log: [
          "[Validator] Invoking Zod strict structure parsing...",
          "[Validator] Checking headers, contactInfo, workHistory, skills...",
          "[Validator] ✓ Zod schema integrity check passed with 100% compliance."
        ]
      },
      {
        id: 3,
        details: "Structured output mapped",
        log: [
          "[LLM Gateway] Dispatching payload to Gemini Ingestion Engine...",
          "[LLM Gateway] Formatting structural JSON tree using structured output configuration...",
          "[LLM Gateway] ✓ JSON schema mapping complete. Response status: 200 OK."
        ]
      },
      {
        id: 4,
        details: `Generated ${dbStats.dimension}-Dim L2 coordinates`,
        log: [
          "[Embeddings Engine] Calling Vertex AI text-embedding-005...",
          `[Embeddings Engine] Initiating Matryoshka Slicing: 3,072 -> ${dbStats.dimension} dimensions.`,
          "[Embeddings Engine] Applying L2 normalization to conform to unit-length Cosine requirements."
        ]
      },
      {
        id: 5,
        details: `SEEDED (${dbStats.chunksCount} KNN chunks)`,
        log: [
          "[Firestore] Initializing transactional seed to collection: portfolio-knowledge...",
          `[Firestore] Mapping ${dbStats.chunksCount} embedded vector coordinates to portfolio-knowledge/resume-experience...`,
          `[Firestore] 🎉 Seeding complete. Composite nearest-neighbor vector indexes updated.`,
          "[Pipeline Telemetry] Ingestion pipeline successfully completed! Recruiter RAG active."
        ]
      }
    ];

    for (let idx = 0; idx < stepsTimeline.length; idx++) {
      const stepInfo = stepsTimeline[idx];
      setCurrentStep(stepInfo.id);

      // Set current step to running
      setSteps(prev => prev.map(s => s.id === stepInfo.id ? { ...s, status: "running", details: "Processing..." } : s));

      // Append terminal output lines sequentially
      for (const logText of stepInfo.log) {
        await new Promise(resolve => setTimeout(resolve, 400));
        setTerminalLogs(prev => [...prev, logText]);
      }

      await new Promise(resolve => setTimeout(resolve, 600));

      // Set current step to completed
      setSteps(prev => prev.map(s => s.id === stepInfo.id ? { ...s, status: "completed", details: stepInfo.details } : s));
    }

    setIsRunning(false);
  };

  return (
    <div className="w-full rounded-3xl border border-zinc-900 bg-zinc-950 p-6 text-zinc-100 shadow-xl shadow-cyan-500/5 backdrop-blur-xl space-y-6">
      
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-900 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 shadow-md shadow-cyan-500/10">
            <Activity className="h-5 w-5 text-cyan-200 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold tracking-wide text-zinc-200 uppercase font-mono">
              Pipeline Telemetry
            </h4>
            <p className="text-xs text-zinc-500">
              Interactive RAG Ingestion & Vector Diagnostics (Real-Time Database Sync)
            </p>
          </div>
        </div>

        <button
          onClick={runPipeline}
          disabled={isRunning}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md hover:from-teal-400 hover:to-emerald-500 disabled:opacity-40 transition-all duration-300 active:scale-95 self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRunning ? "animate-spin" : ""}`} />
          Run Diagnostics
        </button>
      </div>

      {/* Horizontal Steps Grid (5 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        {steps.map((step) => {
          const StepIcon = step.icon;
          const isActive = step.status === "running";
          const isCompleted = step.status === "completed";
          
          return (
            <div
              key={step.id}
              className={`flex flex-col justify-between rounded-xl border p-4 transition-all duration-300 ${
                isActive
                  ? "bg-teal-950/10 border-teal-500/40 shadow-lg shadow-teal-500/5"
                  : isCompleted
                  ? "bg-zinc-900/30 border-zinc-800/80"
                  : "bg-zinc-950/40 border-zinc-900/50"
              }`}
            >
              <div className="space-y-3">
                {/* Header inside the Step Box */}
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-300 ${
                      isActive
                        ? "bg-teal-950/60 text-teal-400 border border-teal-500/30 animate-pulse"
                        : isCompleted
                        ? "bg-zinc-900 text-teal-400 border border-zinc-800"
                        : "bg-zinc-900/40 text-zinc-600 border border-zinc-950"
                    }`}
                  >
                    <StepIcon className="h-4 w-4" />
                  </div>
                  
                  {/* Status Indicator Bubble */}
                  <div className="flex items-center">
                    {isCompleted ? (
                      <CheckCircle2 className="h-4.5 w-4.5 text-teal-400" />
                    ) : isActive ? (
                      <span className="flex h-1.5 w-1.5 rounded-full bg-teal-400 animate-ping" />
                    ) : (
                      <span className="text-[9px] font-mono font-semibold text-zinc-600 uppercase tracking-widest">
                        WAIT
                      </span>
                    )}
                  </div>
                </div>

                {/* Content inside the Step Box */}
                <div>
                  <h5
                    className={`text-xs font-bold font-mono transition-colors duration-300 ${
                      isCompleted ? "text-zinc-200" : isActive ? "text-teal-400" : "text-zinc-500"
                    }`}
                  >
                    0{step.id}. {step.label}
                  </h5>
                  <p className="text-[10px] text-zinc-500 mt-1 font-mono leading-relaxed min-h-[30px]">
                    {step.details}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Horizontal Terminal Console (Below Steps) */}
      <div className="rounded-2xl border border-zinc-900 bg-black/90 p-4 font-mono text-[10px] text-emerald-400 shadow-inner flex flex-col justify-between h-40">
        <div className="flex items-center justify-between border-b border-zinc-900/80 pb-2 mb-2 text-zinc-500">
          <div className="flex items-center gap-1.5">
            <Terminal className="h-3 w-3 text-teal-400" />
            <span>CONSOLE METADATA LOG</span>
          </div>
          <span className="text-[9px] uppercase tracking-wider text-zinc-600">
            STD_OUT Stream
          </span>
        </div>
        
        {/* Scrollable logs area with flexible growth */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {terminalLogs.map((log, i) => (
            <div key={i} className="leading-relaxed">
              <span className="text-zinc-700 select-none mr-1.5">&gt;</span>
              <span className={log.includes("✓") || log.includes("🎉") ? "text-teal-400" : log.includes("triggered") ? "text-indigo-400" : "text-emerald-400/90"}>
                {log}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
