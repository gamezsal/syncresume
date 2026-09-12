"use client";

import React, { useState } from "react";
import { 
  CheckCircle2, 
  RefreshCw, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  Briefcase,
  GraduationCap,
  Sparkles,
  Mail,
  Phone,
  Globe,
  MapPin,
  Github,
  Linkedin,
  Twitter,
  Plus,
  Minus,
  Check
} from "lucide-react";

// Mirroring ResumeData schema contract
export interface ContactData {
  website?: string;
  email?: string;
  phone?: string;
  twitter?: string;
  linkedin?: string;
  github?: string;
}

export interface HeaderData {
  name: string;
  shortAbout: string;
  location?: string;
  contacts: ContactData;
  skills: string[];
}

export interface ExperienceEntry {
  company: string;
  link?: string;
  location: string;
  contract: string;
  title: string;
  start: string;
  end?: string | null;
  description: string;
}

export interface EducationEntry {
  school: string;
  degree: string;
  start: string;
  end: string;
}

export interface ResumeData {
  header: HeaderData;
  summary: string;
  workExperience: ExperienceEntry[];
  education: EducationEntry[];
}

export interface ResumeDiffViewProps {
  currentProfile: Partial<ResumeData> | null;
  stagedDraft: ResumeData | null;
  onApprovalSuccess?: () => void;
}

export default function ResumeDiffView({ 
  currentProfile, 
  stagedDraft, 
  onApprovalSuccess 
}: ResumeDiffViewProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [activeTab, setActiveTab] = useState<"header" | "skills" | "experience" | "education">("header");
  const [approvalMessage, setApprovalMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fallback structures if currentProfile or stagedDraft properties are null/undefined
  const currentHeader = currentProfile?.header;
  const currentContacts = currentHeader?.contacts;
  const currentSkills = currentHeader?.skills ?? [];
  const currentWork = currentProfile?.workExperience ?? [];
  const currentEdu = currentProfile?.education ?? [];

  const draftHeader = stagedDraft?.header;
  const draftContacts = draftHeader?.contacts;
  const draftSkills = draftHeader?.skills ?? [];
  const draftWork = stagedDraft?.workExperience ?? [];
  const draftEdu = stagedDraft?.education ?? [];

  // Conditional early return if draft is missing
  if (!stagedDraft) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-800 p-8 text-center bg-zinc-900/40">
        <AlertCircle className="mx-auto h-8 w-8 text-zinc-500 mb-3" />
        <p className="text-zinc-400 text-sm font-medium">No resume draft is currently staged for review.</p>
        <p className="text-zinc-600 text-xs mt-1">Upload a PDF resume above to generate a new diff preview.</p>
      </div>
    );
  }

  // Count Changes for Tab Indicators (Protected against undefined properties)
  const skillsAdded = draftSkills.filter(s => !currentSkills.includes(s)).length;
  const workDiffCount = draftWork.length !== currentWork.length ? Math.abs(draftWork.length - currentWork.length) : 0;
  const eduDiffCount = draftEdu.length !== currentEdu.length ? Math.abs(draftEdu.length - currentEdu.length) : 0;

  const handleApprove = async () => {
    setIsApproving(true);
    setApprovalMessage(null);
    setErrorMessage(null);

    try {
      console.log("[ResumeDiffView] Directing database merge and live synchronization...");

      // 1. Retrieve auth token dynamically if Firebase Client Auth is initialized
      let authToken = "";
      try {
        const { getAuth } = await import("firebase/auth");
        const auth = getAuth();
        if (auth.currentUser) {
          authToken = await auth.currentUser.getIdToken();
        }
      } catch (authErr) {
        // Firebase Client Auth SDK not initialized in this module scope
      }

      // 2. Fallback check for session cookies in document.cookie
      if (!authToken && typeof document !== "undefined") {
        const cookies = document.cookie.split(";").reduce((acc, cookie) => {
          const [key, val] = cookie.trim().split("=");
          if (key && val) acc[key] = val;
          return acc;
        }, {} as Record<string, string>);

        authToken = cookies["__session"] || cookies["admin_session"] || "";
      }

      // 3. Construct headers with Authorization token if available
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const response = await fetch("/api/admin/resume/approve", {
        method: "POST",
        headers,
        credentials: "include", // Enforces sending __session / admin_session cookies across Edge CDN
        body: JSON.stringify({ payload: stagedDraft }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Staging approval failed to execute.");
      }

      setApprovalMessage("Staging resume successfully approved and live synchronized!");
      if (onApprovalSuccess) {
        onApprovalSuccess();
      }
    } catch (err: any) {
      console.error("[ResumeDiffView] Live approval failed:", err);
      setErrorMessage(err.message || "An unexpected error occurred during index approval.");
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 bg-zinc-950 text-zinc-100 rounded-3xl border border-zinc-900 shadow-2xl">
      
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 rounded-2xl border border-teal-500/20 bg-teal-950/10 p-5 backdrop-blur-md">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <ShieldCheck className="h-6 w-6 shrink-0" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-100">Human-in-the-Loop Admin Review</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Review the newly extracted fields from your PDF resume against the active production profile before saving.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleApprove}
            disabled={isApproving}
            className="w-full lg:w-auto flex items-center justify-center gap-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold text-sm px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20"
          >
            {isApproving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Syncing Database Index...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Approve & Sync Live</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success/Error Alerts */}
      {approvalMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-4 text-sm text-emerald-400">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{approvalMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-950/10 p-4 text-sm text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-zinc-900 overflow-x-auto gap-2 p-1 bg-zinc-900/30 rounded-xl">
        <button
          onClick={() => setActiveTab("header")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono rounded-lg transition-all shrink-0 ${
            activeTab === "header"
              ? "bg-zinc-900 text-teal-400 border border-zinc-800 font-bold"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Header & Summary</span>
        </button>
        
        <button
          onClick={() => setActiveTab("skills")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono rounded-lg transition-all shrink-0 ${
            activeTab === "skills"
              ? "bg-zinc-900 text-teal-400 border border-zinc-800 font-bold"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Globe className="h-4 w-4" />
          <span>Skills Inventory</span>
          {skillsAdded > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              +{skillsAdded}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("experience")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono rounded-lg transition-all shrink-0 ${
            activeTab === "experience"
              ? "bg-zinc-900 text-teal-400 border border-zinc-800 font-bold"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Briefcase className="h-4 w-4" />
          <span>Work History</span>
          {workDiffCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
              {workDiffCount} diff
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("education")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono rounded-lg transition-all shrink-0 ${
            activeTab === "education"
              ? "bg-zinc-900 text-teal-400 border border-zinc-800 font-bold"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <GraduationCap className="h-4 w-4" />
          <span>Education</span>
          {eduDiffCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {eduDiffCount} diff
            </span>
          )}
        </button>
      </div>

      {/* Comparison Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-4">
        
        {/* Left Side: Live Production (Safe-Checking for NULL / undefined) */}
        <div className="space-y-4 p-5 rounded-2xl bg-zinc-900/20 border border-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono text-zinc-400 tracking-wider uppercase">Active Production Profile</span>
            </div>
            {currentProfile === null && (
              <span className="text-[10px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded font-mono font-bold">
                Initial Set-up Empty
              </span>
            )}
          </div>

          {activeTab === "header" && (
            <div className="space-y-4 min-h-[300px]">
              {currentProfile ? (
                <>
                  <div>
                    <span className="text-[10px] text-zinc-500 font-mono block uppercase">Name</span>
                    <p className="text-base font-semibold text-white mt-0.5">{currentHeader?.name || "Not Defined"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 font-mono block uppercase">Short Elevator Bio</span>
                    <p className="text-sm text-zinc-300 mt-1 leading-relaxed">{currentHeader?.shortAbout || "Not Defined"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 font-mono block uppercase">Location</span>
                    <div className="flex items-center gap-1.5 text-sm text-zinc-400 mt-1">
                      <MapPin className="h-4 w-4 text-zinc-650 shrink-0" />
                      <span>{currentHeader?.location || "Not Defined"}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 font-mono block uppercase mb-1.5">Contact Channels</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-zinc-400">
                      <div className="flex items-center gap-2 p-2 rounded bg-zinc-900/40">
                        <Mail className="h-3.5 w-3.5 text-zinc-650" />
                        <span className="truncate">{currentContacts?.email || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded bg-zinc-900/40">
                        <Phone className="h-3.5 w-3.5 text-zinc-650" />
                        <span>{currentContacts?.phone || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded bg-zinc-900/40">
                        <Globe className="h-3.5 w-3.5 text-zinc-650" />
                        <span className="truncate">{currentContacts?.website || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded bg-zinc-900/40">
                        <Github className="h-3.5 w-3.5 text-zinc-650" />
                        <span className="truncate">{currentContacts?.github || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded bg-zinc-900/40">
                        <Linkedin className="h-3.5 w-3.5 text-zinc-650" />
                        <span className="truncate">{currentContacts?.linkedin || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded bg-zinc-900/40">
                        <Twitter className="h-3.5 w-3.5 text-zinc-650" />
                        <span className="truncate">{currentContacts?.twitter || "—"}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 font-mono block uppercase">Professional Summary Statement</span>
                    <p className="text-sm text-zinc-400 mt-1 leading-relaxed bg-zinc-950/40 p-3 rounded-lg border border-zinc-900">
                      {currentProfile?.summary || "Not Defined"}
                    </p>
                  </div>
                </>
              ) : (
                <EmptyValuePlaceholder />
              )}
            </div>
          )}

          {activeTab === "skills" && (
            <div className="space-y-4 min-h-[300px]">
              <span className="text-[10px] text-zinc-500 font-mono block uppercase">Primary Skills</span>
              {currentSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {currentSkills.map((skill, i) => (
                    <span key={i} className="inline-flex items-center rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-350 border border-zinc-800">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <EmptyValuePlaceholder />
              )}
            </div>
          )}

          {activeTab === "experience" && (
            <div className="space-y-4 min-h-[300px]">
              {currentWork.length > 0 ? (
                currentWork.map((job, i) => (
                  <div key={i} className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/20 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-slate-200">{job.title}</h4>
                        <p className="text-xs text-zinc-400 mt-0.5">{job.company} — {job.location}</p>
                      </div>
                      <span className="text-[10px] font-mono bg-zinc-900 px-2 py-0.5 rounded text-zinc-500">
                        {job.start} - {job.end || "Present"}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">{job.description}</p>
                  </div>
                ))
              ) : (
                <EmptyValuePlaceholder />
              )}
            </div>
          )}

          {activeTab === "education" && (
            <div className="space-y-4 min-h-[300px]">
              {currentEdu.length > 0 ? (
                currentEdu.map((edu, i) => (
                  <div key={i} className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/20 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-slate-200">{edu.degree}</h4>
                        <p className="text-xs text-zinc-400 mt-0.5">{edu.school}</p>
                      </div>
                      <span className="text-[10px] font-mono bg-zinc-900 px-2 py-0.5 rounded text-zinc-500">
                        {edu.start} - {edu.end}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyValuePlaceholder />
              )}
            </div>
          )}

        </div>

        {/* Right Side: Staged Extract (Validated via Zod / Gemini, safe checking enabled) */}
        <div className="space-y-4 p-5 rounded-2xl bg-zinc-900/10 border border-zinc-850 shadow-inner">
          <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-teal-400" />
              <span className="text-xs font-mono text-zinc-300 tracking-wider uppercase">Extracted PDF Draft</span>
            </div>
            <span className="text-[10px] bg-teal-500/10 border border-teal-500/20 text-teal-400 px-2 py-0.5 rounded font-mono font-bold">
              Staging Draft Stored
            </span>
          </div>

          {activeTab === "header" && (
            <div className="space-y-4 min-h-[300px]">
              <div>
                <span className="text-[10px] text-zinc-500 font-mono block uppercase">Name</span>
                <p className={`text-base font-bold mt-0.5 ${draftHeader?.name !== currentHeader?.name ? "text-teal-400 bg-teal-950/10 px-2 py-0.5 rounded border border-teal-500/10 inline-block" : "text-white"}`}>
                  {draftHeader?.name || "—"}
                </p>
              </div>
              
              <div>
                <span className="text-[10px] text-zinc-500 font-mono block uppercase">Short Elevator Bio</span>
                <p className={`text-sm mt-1 leading-relaxed ${draftHeader?.shortAbout !== currentHeader?.shortAbout ? "text-teal-400 bg-teal-950/10 p-2 rounded border border-teal-500/10" : "text-zinc-300"}`}>
                  {draftHeader?.shortAbout || "—"}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-zinc-500 font-mono block uppercase">Location</span>
                <div className={`flex items-center gap-1.5 text-sm mt-1 ${draftHeader?.location !== currentHeader?.location ? "text-teal-400 bg-teal-950/10 px-2 py-0.5 rounded border border-teal-500/10 inline-flex" : "text-zinc-400"}`}>
                  <MapPin className="h-4 w-4 shrink-0 text-teal-400/50" />
                  <span>{draftHeader?.location || "—"}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-zinc-500 font-mono block uppercase mb-1.5">Contact Channels</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className={`flex items-center gap-2 p-2 rounded border ${draftContacts?.email !== currentContacts?.email ? "border-teal-500/20 bg-teal-950/10 text-teal-400" : "border-zinc-900 bg-zinc-900/20 text-zinc-400"}`}>
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{draftContacts?.email || "—"}</span>
                  </div>
                  <div className={`flex items-center gap-2 p-2 rounded border ${draftContacts?.phone !== currentContacts?.phone ? "border-teal-500/20 bg-teal-950/10 text-teal-400" : "border-zinc-900 bg-zinc-900/20 text-zinc-400"}`}>
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <span>{draftContacts?.phone || "—"}</span>
                  </div>
                  <div className={`flex items-center gap-2 p-2 rounded border ${draftContacts?.website !== currentContacts?.website ? "border-teal-500/20 bg-teal-950/10 text-teal-400" : "border-zinc-900 bg-zinc-900/20 text-zinc-400"}`}>
                    <Globe className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{draftContacts?.website || "—"}</span>
                  </div>
                  <div className={`flex items-center gap-2 p-2 rounded border ${draftContacts?.github !== currentContacts?.github ? "border-teal-500/20 bg-teal-950/10 text-teal-400" : "border-zinc-900 bg-zinc-900/20 text-zinc-400"}`}>
                    <Github className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{draftContacts?.github || "—"}</span>
                  </div>
                  <div className={`flex items-center gap-2 p-2 rounded border ${draftContacts?.linkedin !== currentContacts?.linkedin ? "border-teal-500/20 bg-teal-950/10 text-teal-400" : "border-zinc-900 bg-zinc-900/20 text-zinc-400"}`}>
                    <Linkedin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{draftContacts?.linkedin || "—"}</span>
                  </div>
                  <div className={`flex items-center gap-2 p-2 rounded border ${draftContacts?.twitter !== currentContacts?.twitter ? "border-teal-500/20 bg-teal-950/10 text-teal-400" : "border-zinc-900 bg-zinc-900/20 text-zinc-400"}`}>
                    <Twitter className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{draftContacts?.twitter || "—"}</span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-zinc-500 font-mono block uppercase">Professional Summary Statement</span>
                <p className={`text-sm mt-1 leading-relaxed p-3 rounded-lg border ${stagedDraft?.summary !== currentProfile?.summary ? "border-teal-500/20 bg-teal-950/10 text-teal-300" : "border-zinc-900 bg-zinc-950/40 text-zinc-400"}`}>
                  {stagedDraft?.summary || "—"}
                </p>
              </div>
            </div>
          )}

          {activeTab === "skills" && (
            <div className="space-y-4 min-h-[300px]">
              <span className="text-[10px] text-zinc-500 font-mono block uppercase">Extracted Skills</span>
              <div className="flex flex-wrap gap-2">
                {draftSkills.map((skill, i) => {
                  const isNew = !currentSkills.includes(skill);
                  return (
                    <span 
                      key={i} 
                      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold border ${
                        isNew 
                          ? "bg-emerald-950/30 text-emerald-400 border-emerald-500/20 shadow-sm shadow-emerald-500/5" 
                          : "bg-zinc-900 text-zinc-350 border-zinc-800"
                      }`}
                    >
                      {isNew && <Plus className="h-3 w-3 shrink-0" />}
                      <span>{skill}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "experience" && (
            <div className="space-y-4 min-h-[300px]">
              {draftWork.map((job, i) => {
                const currentMatch = currentWork.find(w => w.company.toLowerCase() === job.company.toLowerCase());
                const isNew = !currentMatch;
                const isDiff = currentMatch && (currentMatch.title !== job.title || currentMatch.description !== job.description);

                return (
                  <div 
                    key={i} 
                    className={`p-4 rounded-xl border space-y-2 transition-all ${
                      isNew 
                        ? "bg-emerald-950/10 border-emerald-500/20 shadow-sm" 
                        : isDiff
                        ? "bg-yellow-950/10 border-yellow-500/20 shadow-sm"
                        : "bg-zinc-950/20 border-zinc-900"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-slate-100">{job.title}</h4>
                          {isNew && (
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase">
                              New
                            </span>
                          )}
                          {isDiff && (
                            <span className="text-[9px] font-bold text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded uppercase">
                              Modified
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">{job.company} — {job.location}</p>
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${isNew ? "bg-emerald-950/30 text-emerald-400" : "bg-zinc-900 text-zinc-500"}`}>
                        {job.start} - {job.end || "Present"}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">{job.description}</p>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "education" && (
            <div className="space-y-4 min-h-[300px]">
              {draftEdu.map((edu, i) => {
                const currentMatch = currentEdu.find(e => e.school.toLowerCase() === edu.school.toLowerCase());
                const isNew = !currentMatch;

                return (
                  <div 
                    key={i} 
                    className={`p-4 rounded-xl border space-y-2 ${
                      isNew 
                        ? "bg-emerald-950/10 border-emerald-500/20 shadow-sm" 
                        : "bg-zinc-950/20 border-zinc-900"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-slate-100">{edu.degree}</h4>
                          {isNew && (
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">{edu.school}</p>
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${isNew ? "bg-emerald-950/30 text-emerald-400" : "bg-zinc-900 text-zinc-500"}`}>
                        {edu.start} - {edu.end}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

// Sub-components to keep code self-contained and polished
function EmptyValuePlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/10">
      <AlertCircle className="h-6 w-6 text-zinc-650 mb-2" />
      <p className="text-xs font-mono text-zinc-500 tracking-wider uppercase">No Active Records</p>
      <p className="text-[11px] text-zinc-600 mt-0.5">Database field returned null/empty for this section.</p>
    </div>
  );
}
