"use client";

import React, { useState, useEffect } from "react";
import { auth, loginWithGoogle, logoutAdmin, hasFirebaseKeys } from "@/lib/firebase/client";
import { onAuthStateChanged, User } from "firebase/auth";
import ResumeDiffView from "@/components/admin/ResumeDiffView";
import {
  Upload,
  Loader2,
  RefreshCw,
  LogIn,
  LogOut,
  ShieldAlert,
  AlertTriangle,
  FileText,
} from "lucide-react";

const AUTHORIZED_EMAILS = [
  process.env.NEXT_PUBLIC_ADMIN_EMAIL || "gamezsalvador@gmail.com",
];

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [stagedDraft, setStagedDraft] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchState = async (token?: string) => {
    setIsLoading(true);
    try {
      let authToken = token;
      if (!authToken && user) {
        try {
          authToken = await user.getIdToken();
        } catch (e) {
          // ignore fallback error
        }
      }

      const headers: Record<string, string> = {};
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const res = await fetch("/api/admin/resume/status", {
        headers,
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentProfile(data.currentProfile || null);
        setStagedDraft(data.stagedDraft || null);
      }
    } catch (err) {
      console.error("Failed to load admin state:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!hasFirebaseKeys || !auth) {
      setAuthLoading(false);
      return;
    }

    let timer: ReturnType<typeof setTimeout> | undefined = undefined;

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setAuthLoading(false);

        if (currentUser) {
          (async () => {
            try {
              const idToken = await currentUser.getIdToken();
              if (typeof window !== "undefined") {
                document.cookie = `__session=${idToken}; path=/; max-age=3600; SameSite=Lax; Secure`;
              }
              await fetchState(idToken);
            } catch (tokenErr) {
              console.error("Failed to fetch ID token:", tokenErr);
              fetchState();
            }
          })();
        } else {
          if (typeof window !== "undefined") {
            document.cookie = "__session=; path=/; max-age=0; SameSite=Lax; Secure";
          }
        }
      },
      (err: any) => {
        console.error("Auth state change error:", err);
        setAuthError(err.message || "Auth error");
        setAuthLoading(false);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleLogin = async () => {
    setAuthError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setAuthError(err.message || "Sign in failed.");
    }
  };

  const handleUploadAndParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("resume", file);

    try {
      const idToken = await user.getIdToken();
      if (typeof window !== "undefined") {
        document.cookie = `__session=${idToken}; path=/; max-age=3600; SameSite=Lax; Secure`;
      }

      const res = await fetch("/api/admin/resume/parse", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "X-Firebase-Auth": `Bearer ${idToken}`,
        },
        credentials: "include",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setStagedDraft(data.data);
      } else {
        alert(`Error: ${data.error || data.message || "Parse failed"}`);
      }
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  if (!hasFirebaseKeys) {
    return (
      <div className="max-w-lg mx-auto my-16 rounded-2xl border border-amber-500/40 bg-amber-950/20 p-8 text-center backdrop-blur-md">
        <AlertTriangle className="mx-auto h-12 w-12 text-amber-400 mb-4" />
        <h1 className="text-xl font-bold text-slate-100 mb-2">
          Firebase Auth Config Missing
        </h1>
        <p className="text-xs text-amber-200/80 mb-4 leading-relaxed">
          <code className="bg-amber-950 px-1.5 py-0.5 rounded font-mono">
            NEXT_PUBLIC_FIREBASE_API_KEY
          </code>{" "}
          is not loaded in Next.js environment.
        </p>
        <p className="text-xs text-zinc-400 text-left bg-zinc-950 p-4 rounded-xl border border-zinc-800 font-mono space-y-1">
          <span className="text-zinc-500"># Please restart your Next.js dev server:</span>
          <br />
          1. Press <strong className="text-teal-400">Ctrl + C</strong> in terminal
          <br />
          2. Run <strong className="text-teal-400">npm run dev</strong>
        </p>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
        <p className="text-xs text-zinc-400">Initializing Admin Security...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 text-center backdrop-blur-md">
        <ShieldAlert className="mx-auto h-12 w-12 text-teal-400 mb-4" />
        <h1 className="text-xl font-bold text-slate-100 mb-2">
          Admin Portal Authentication
        </h1>
        <p className="text-xs text-zinc-400 mb-6">
          Sign in with your Google account to access the SyncResume command center and resume parser.
        </p>

        {authError && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300">
            {authError}
          </div>
        )}

        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-500 py-3 text-sm font-semibold text-zinc-950 hover:bg-teal-400 transition-all shadow-lg shadow-teal-500/20 cursor-pointer"
        >
          <LogIn className="h-4 w-4" />
          Sign In with Google
        </button>
      </div>
    );
  }

  const isAuthorized =
    AUTHORIZED_EMAILS.length === 0 ||
    AUTHORIZED_EMAILS.includes(user.email || "");

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto my-16 rounded-2xl border border-red-500/30 bg-red-950/20 p-8 text-center backdrop-blur-md">
        <ShieldAlert className="mx-auto h-12 w-12 text-red-400 mb-4" />
        <h1 className="text-xl font-bold text-slate-100 mb-2">Access Denied</h1>
        <p className="text-xs text-zinc-400 mb-6">
          Signed in as{" "}
          <span className="text-slate-200 font-medium">{user.email}</span>. This account is not authorized to access admin controls.
        </p>
        <button
          onClick={logoutAdmin}
          className="flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 mx-auto cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">
            SyncResume Admin Dashboard
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Authenticated as{" "}
            <span className="text-teal-400 font-medium">{user.email}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchState()}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-zinc-400 hover:text-slate-100 transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>
          <button
            onClick={logoutAdmin}
            className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-400 hover:text-slate-100 transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-md space-y-4">
        <div className="flex items-center gap-3 border-b border-zinc-800/80 pb-4">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Upload PDF Resume Draft
            </h2>
            <p className="text-xs text-zinc-400">
              Parses headers, skills, work experience, and education via Gemini Structured Outputs into Firestore staging.
            </p>
          </div>
        </div>

        <form onSubmit={handleUploadAndParse} className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="flex-1 text-xs text-zinc-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-teal-400 hover:file:bg-zinc-700 cursor-pointer"
            />
            <button
              type="submit"
              disabled={!file || isUploading}
              className="flex items-center justify-center gap-2 rounded-xl bg-teal-500 px-6 py-2.5 text-xs font-semibold text-zinc-950 hover:bg-teal-400 disabled:opacity-50 transition-all shadow-lg shadow-teal-500/10 cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Parsing Multimodal PDF...</span>
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  <span>Upload & Parse PDF</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <ResumeDiffView
        currentProfile={currentProfile as any}
        stagedDraft={stagedDraft as any}
        onApprovalSuccess={() => {
          fetchState();
        }}
      />
    </div>
  );
}

export const dynamic = "force-dynamic";
