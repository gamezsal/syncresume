"use client";

import React, { useState } from "react";
import { ResumeData } from "@/lib/schemas/resume";
import { CheckCircle2, RefreshCw, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";

interface ResumeDiffViewProps {
  currentProfile: Partial<ResumeData> | null;
  stagedDraft: ResumeData | null;
  onApprovalSuccess?: () => void;
}

export default function ResumeDiffView({
  currentProfile,
  stagedDraft,
  onApprovalSuccess,
}: ResumeDiffViewProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [approvalMessage, setApprovalMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!stagedDraft) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-800 p-8 text-center bg-zinc-900/40">
        <AlertCircle className="mx-auto h-8 w-8 text-zinc-500 mb-3" />
        <p className="text-zinc-400 text-sm">No resume draft is currently staged for review.</p>
        <p className="text-zinc-600 text-xs mt-1">Upload a PDF resume above to generate a new diff preview.</p>
      </div>
    );
  }

  const handleApprove = async () => {
    setIsApproving(true);
    setApprovalMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/admin/resume/approve", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Approval failed.");
      }

      setApprovalMessage(data.message || "Resume approved and synced live!");
      if (onApprovalSuccess) {
        onApprovalSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-teal-500/30 bg-teal-950/20 p-5 backdrop-blur-md">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-6 w-6 text-teal-400 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Human-in-the-Loop Admin Review</h2>
            <p className="text-xs text-zinc-400">
              Review extracted fields from your newly uploaded PDF before committing changes to production.
            </p>
          </div>
        </div>
        <button
          onClick={handleApprove}
          disabled={isApproving}
          className="flex items-center justify-center gap-2 rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-teal-400 disabled:opacity-50 transition-all shadow-lg shadow-teal-500/20"
        >
          {isApproving ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Syncing Vector Index...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Approve & Sync Live
            </>
          )}
        </button>
      </div>

      {approvalMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-4 text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          {approvalMessage}
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-4 text-red-300 text-sm flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-400" />
          {errorMessage}
        </div>
      )}

      {/* Side-by-Side Diff Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Production Profile */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
            <span className="text-xs font-mono tracking-wider text-zinc-400 uppercase">Active Production Profile</span>
            <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-[10px] text-zinc-400">Live</span>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <span className="text-xs text-zinc-500 block">Full Name & Role</span>
              <p className="font-medium text-slate-200">{currentProfile?.fullName || "Salvador Gamez"}</p>
              <p className="text-xs text-zinc-400">{currentProfile?.headline || "Full-Stack & Cloud Engineer"}</p>
            </div>

            <div>
              <span className="text-xs text-zinc-500 block">Summary</span>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {currentProfile?.summary || "No active summary recorded."}
              </p>
            </div>

            <div>
              <span className="text-xs text-zinc-500 block mb-1">Work History Count</span>
              <p className="text-xs font-mono text-zinc-300">{currentProfile?.experience?.length || 0} active roles</p>
            </div>
          </div>
        </div>

        {/* Staged AI Draft */}
        <div className="rounded-2xl border border-teal-500/30 bg-zinc-900/90 p-5 relative">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
            <span className="text-xs font-mono tracking-wider text-teal-400 uppercase">New Staged AI Extraction</span>
            <span className="rounded-full bg-teal-500/20 text-teal-300 px-2.5 py-0.5 text-[10px] font-medium border border-teal-500/30">
              Staged Draft
            </span>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <span className="text-xs text-zinc-500 block">Parsed Name & Role</span>
              <p className="font-medium text-teal-300 flex items-center gap-1">
                {stagedDraft.fullName}
                <ArrowRight className="h-3.5 w-3.5 text-teal-500" />
              </p>
              <p className="text-xs text-zinc-300">{stagedDraft.headline}</p>
            </div>

            <div>
              <span className="text-xs text-zinc-500 block">Parsed Summary</span>
              <p className="text-xs text-slate-200 leading-relaxed bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                {stagedDraft.summary}
              </p>
            </div>

            <div>
              <span className="text-xs text-zinc-500 block mb-1">Extracted Skills</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  ...stagedDraft.skills.languages,
                  ...stagedDraft.skills.frameworks,
                  ...stagedDraft.skills.cloudAndDevOps,
                  ...stagedDraft.skills.databases,
                ].map((skill, idx) => (
                  <span
                    key={idx}
                    className="rounded bg-teal-950/60 border border-teal-500/30 px-2 py-0.5 text-[11px] text-teal-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs text-zinc-500 block mb-1">Parsed Experience ({stagedDraft.experience.length})</span>
              <div className="space-y-2">
                {stagedDraft.experience.map((exp, idx) => (
                  <div key={idx} className="rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-xs space-y-1">
                    <p className="font-medium text-slate-200">
                      {exp.role} @ <span className="text-teal-400">{exp.company}</span>
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      {exp.startDate} - {exp.endDate || "Present"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}