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

export default function PipelineTelemetryCard() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [steps, setSteps] = useState<PipelineStep[]>([
    {
      id: 1,
      label: "Scraped PDF Content",
      status: "pending",
      details: "Idle (Ready to parse)",
      icon: FileText,
    },
    {
      id: 2,
      label: "Zod Schema Verification",
      status: "pending",
      details: "Awaiting payload verification",
      icon: Binary,
    },
    {
      id: 3,
      label: "Gemini 3.6 Ingestion Engine",
      status: "pending",
      details: "Awaiting LLM structural map",
      icon: Cpu,
    },
    {
      id: 4,
      label: "Vector Generation",
      status: "pending",
      details: "Awaiting Matryoshka L2 coordinate generation",
      icon: Sparkles,
    },
    {
      id: 5,
      label: "Firestore Vector Index Status",
      status: "pending",
      details: "Awaiting document vector seed",
      icon: Database,
    },
  ]);

  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "System initialized. Awaiting pipeline trigger...",
  ]);

  const runPipeline = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setCurrentStep(0);
    setTerminalLogs(["[Pipeline Telemetry] Ingestion loop manually triggered.", "Connecting to staging storage..."]);

    // Reset Steps
    setSteps(prev => prev.map(s => ({ ...s, status: "pending", details: "Awaiting execution..." })));

    const stepsTimeline = [
      {
        id: 1,
        details: "Parsed 1,424 Words from PDF structure cleanly",
        log: ["[Ingestion Client] Ingestion request triggered.", "[Ingestion Client] Extracting PDF content stream...", "[Ingestion Client] Read completed. Found 1,424 words across 4 document nodes."]
      },
      {
        id: 2,
        details: "Passed strict schema requirements",
        log: ["[Validator] Invoking Zod strict structure parsing...", "[Validator] Checking headers, contactInfo, workHistory, skills...", "[Validator] ✓ Zod schema integrity check passed with 100% compliance."]
      },
      {
        id: 3,
        details: "Structured output map aligned",
        log: ["[LLM Gateway] Dispatching payload to Gemini 3.6 Ingestion Engine...", "[LLM Gateway] Formatting structural JSON tree using structured output configuration...", "[LLM Gateway] ✓ JSON schema mapping complete. Response status: 200 OK."]
      },
      {
        id: 4,
        details: "Generated 768-Dim L2 Normalized coordinates",
        log: ["[Embeddings Engine] Calling models/gemini-embedding-001...", "[Embeddings Engine] Initiating Matryoshka Representation Slicing: 3,072 -> 768 dimensions.", "[Embeddings Engine] Applying L2 normalization to conform to unit-length Cosine requirements."]
      },
      {
        id: 5,
        details: "SEEDED successfully (KNN active)",
        log: ["[Firestore] Initializing transactional seed to collection: portfolio-knowledge...", "[Firestore] Mapping embedded vector coordinates to portfolio-knowledge/resume-experience...", "[Firestore] 🎉 Seeding complete. Composite nearest-neighbor vector indexes updated.", "[Pipeline Telemetry] Ingestion pipeline successfully completed! Recruiter RAG active."]
      }
    ];

    for (let idx = 0; idx < stepsTimeline.length; idx++) {
      const stepInfo = stepsTimeline[idx];
      setCurrentStep(stepInfo.id);

      // Set to running
      setSteps(prev => prev.map(s => s.id === stepInfo.id ? { ...s, status: "running", details: "Processing..." } : s));

      // Append logs sequentially
      for (const logText of stepInfo.log) {
        await new Promise(resolve => setTimeout(resolve, 350));
        setTerminalLogs(prev => [...prev, logText]);
      }

      await new Promise(resolve => setTimeout(resolve, 600));

      // Set to completed
      setSteps(prev => prev.map(s => s.id === stepInfo.id ? { ...s, status: "completed", details: stepInfo.details } : s));
    }

    setIsRunning(false);
  };

  return (
    <div className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-950 p-6 text-slate-100 shadow-xl shadow-cyan-500/5 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 shadow-md shadow-cyan-500/10">
            <Activity className="h-5 w-5 text-cyan-200 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold tracking-wide text-slate-200 uppercase">
              Pipeline Telemetry
            </h4>
            <p className="text-xs text-slate-400">
              Interactive RAG Ingestion & Vector Diagnostics
            </p>
          </div>
        </div>

        <button
          onClick={runPipeline}
          disabled={isRunning}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 transition-all duration-300 active:scale-95"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRunning ? "animate-spin" : ""}`} />
          Run Diagnostics
        </button>
      </div>

      {/* Steps List */}
      <div className="space-y-3.5">
        {steps.map((step) => {
          const StepIcon = step.icon;
          return (
            <div
              key={step.id}
              className={`flex items-start justify-between rounded-2xl border p-3 transition-all duration-300 ${
                step.status === "running"
                  ? "bg-slate-900/50 border-cyan-500/30 shadow-md shadow-cyan-500/5"
                  : step.status === "completed"
                  ? "bg-slate-900/10 border-slate-800/80"
                  : "bg-transparent border-slate-900"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors duration-300 ${
                    step.status === "running"
                      ? "bg-cyan-950/40 text-cyan-400 border border-cyan-500/20"
                      : step.status === "completed"
                      ? "bg-slate-900 text-cyan-400 border border-slate-800"
                      : "bg-slate-900/40 text-slate-500 border border-slate-950"
                  }`}
                >
                  <StepIcon className={`h-4.5 w-4.5 ${step.status === "running" ? "animate-pulse" : ""}`} />
                </div>
                <div>
                  <h5
                    className={`text-xs font-bold transition-colors duration-300 ${
                      step.status === "completed" ? "text-slate-200" : step.status === "running" ? "text-cyan-400" : "text-slate-400"
                    }`}
                  >
                    {step.id}. {step.label}
                  </h5>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                    {step.details}
                  </p>
                </div>
              </div>

              {/* Status Marker */}
              <div className="flex items-center pr-1">
                {step.status === "completed" ? (
                  <CheckCircle2 className="h-4.5 w-4.5 text-cyan-400" />
                ) : step.status === "running" ? (
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-ping" />
                    <span className="text-[10px] font-mono font-semibold text-cyan-400 uppercase">
                      ACTIVE
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] font-mono text-slate-600 uppercase">
                    PENDING
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mini terminal */}
      <div className="mt-5 rounded-2xl border border-slate-900 bg-black/90 p-3.5 font-mono text-[10px] text-emerald-400 shadow-inner">
        <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-2 text-slate-500">
          <div className="flex items-center gap-1.5">
            <Terminal className="h-3 w-3" />
            <span>CONSOLE METADATA LOG</span>
          </div>
          <span className="text-[9px] uppercase tracking-wider text-slate-600">
            STD_OUT Stream
          </span>
        </div>
        <div className="h-24 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {terminalLogs.map((log, i) => (
            <div key={i} className="leading-relaxed">
              <span className="text-slate-600 select-none mr-1.5">&gt;</span>
              <span className={log.includes("✓") || log.includes("🎉") ? "text-cyan-400" : log.includes("triggered") ? "text-indigo-400" : "text-emerald-400/90"}>
                {log}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
