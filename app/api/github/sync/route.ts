import { NextResponse } from "next/server";
import { getCachedData, setCachedData } from "@/lib/cache/redis";
import { getFirestoreCache, setFirestoreCache } from "@/lib/cache/firestore";
import { 
  getRepoMetadata, 
  getRepoFileTree, 
  getFileContent, 
  getRepoCommits 
} from "@/lib/github/client";
import { compileMarkdown } from "@/lib/github/parser";

/**
 * app/api/github/sync/route.ts
 * 
 * Upgraded Sync API Route Handler for the real-time GitHub Ingestion Engine.
 * Features enhanced diagnostics and error boundaries to prevent crashing the Next.js pipeline
 * when Firestore is disabled or GitHub tokens are unauthorized.
 */

export async function GET(request: Request) {
  try {
    // 1. Parse query parameters
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get("owner") || "gamezsal";
    const repo = searchParams.get("repo") || "syncresume";
    const branch = searchParams.get("branch") || "main";

    console.log(`[Sync Route] Triggered sync for ${owner}/${repo} on branch: ${branch}`);

    // Build unique cache keys
    const cacheKey = `github:repo:${owner}:${repo}:${branch}`;
    const collectionName = "github_cache";
    const docId = `repo_${owner}_${repo}_${branch}`;

    // 2. TIER 1: Check High-Speed Redis Cache (30-minute TTL)
    const redisCached = await getCachedData<any>(cacheKey);
    if (redisCached) {
      console.log(`[Sync Route] Redis CACHE HIT for ${owner}/${repo}`);
      return NextResponse.json({
        source: "redis_cache",
        data: redisCached
      }, {
        headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=600" }
      });
    }

    // 3. TIER 2: Check Persistent Firestore NoSQL Backup
    let firestoreCached = null;
    try {
      firestoreCached = await getFirestoreCache<any>(collectionName, docId);
      
      // Check if Firestore copy exists and is fresh (less than 30 minutes old)
      if (firestoreCached) {
        const updatedAt = new Date(firestoreCached.updatedAt).getTime();
        const ageMs = Date.now() - updatedAt;
        const isFresh = ageMs < 30 * 60 * 1000; // 30 minutes in ms

        if (isFresh) {
          console.log(`[Sync Route] Firestore CACHE HIT (Fresh) for ${owner}/${repo}. Backfilling Redis.`);
          // Backfill Redis so subsequent loads are sub-millisecond
          await setCachedData(cacheKey, firestoreCached.payload, 1800);

          return NextResponse.json({
            source: "firestore_cache_fresh",
            data: firestoreCached.payload
          }, {
            headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=600" }
          });
        }
      }
    } catch (firestoreErr: any) {
      // Catch Firestore permission or configuration errors cleanly
      console.warn(
        `[Sync Route] Firestore read bypassed due to configuration status: ${firestoreErr.message}. ` +
        `Directly falling back to live API calls.`
      );
    }

    // 4. TIER 3: Check GitHub API (with Conditional ETag / Last-Modified Check)
    console.log(`[Sync Route] Caches missed or stale. Running validation handshake with GitHub API...`);

    const conditionalHeaders = {
      etag: firestoreCached?.etag || undefined,
      lastModified: firestoreCached?.lastModified || undefined
    };

    let commitResult;
    try {
      // Query commits endpoint with our conditional headers to see if code changes exist
      commitResult = await getRepoCommits(owner, repo, branch, 10, conditionalHeaders);
    } catch (githubAuthErr: any) {
      console.error("[Sync Route] GitHub API Handshake Failed:", githubAuthErr.message);
      
      // Check for common credentials issues
      if (githubAuthErr.message.includes("401") || githubAuthErr.message.includes("Unauthorized")) {
        return NextResponse.json(
          { 
            error: "GitHub Authentication Failed", 
            message: "The GITHUB_TOKEN inside .env.local is unauthorized or invalid. Please check your token settings.",
            code: "GITHUB_UNAUTHORIZED"
          },
          { status: 401 }
        );
      }
      
      throw githubAuthErr; // Re-throw other unexpected errors
    }

    // GitHub returned a 304 Not Modified! Caches are safe to reuse.
    if (commitResult.status === 304 && firestoreCached) {
      console.log(`[Sync Route] GitHub returned 304 NOT MODIFIED. Re-validating expired database copy.`);
      
      // Update Firestore document timestamp so it is marked fresh again
      try {
        await setFirestoreCache(
          collectionName,
          docId,
          firestoreCached.payload,
          firestoreCached.etag,
          firestoreCached.lastModified
        );
      } catch (firestoreWriteErr) {
        console.warn("[Sync Route] Firestore write failed during revalidation. Bypassing cache refresh.");
      }

      // Backfill Redis
      await setCachedData(cacheKey, firestoreCached.payload, 1800);

      return NextResponse.json({
        source: "firestore_cache_revalidated",
        data: firestoreCached.payload
      });
    }

    // 5. CACHE MISS / CODE HAS CHANGED: Trigger Hybrid API Orchestration Pipeline
    console.log(`[Sync Route] Code updated or cache empty. Fetching fresh payload from GitHub APIs...`);

    // Fetch repository structural metadata and tree recursively in parallel GraphQL operations
    const [meta, fileTree] = await Promise.all([
      getRepoMetadata(owner, repo),
      getRepoFileTree(owner, repo, branch)
    ]);

    // Fetch and compile the README.md file
    let readmeHtml = "";
    try {
      const rawReadme = await getFileContent(owner, repo, "README.md", branch);
      readmeHtml = compileMarkdown(rawReadme);
    } catch (readmeError) {
      console.warn(`[Sync Route] README.md not found or failed to compile for ${owner}/${repo}:`, readmeError);
    }

    // Combine into our single, optimized, server-side payload
    const freshPayload = {
      metadata: {
        name: meta.name,
        description: meta.description,
        stars: meta.stargazerCount,
        forks: meta.forkCount,
        primaryLanguage: meta.primaryLanguage,
        pushedAt: meta.pushedAt,
        url: meta.url,
        defaultBranch: meta.defaultBranchRef?.name || "main"
      },
      fileTree,
      commits: commitResult.commits,
      readmeHtml,
      synchronizedAt: new Date().toISOString()
    };

    // 6. Sync Cache tiers back up with new payloads & conditional headers
    console.log(`[Sync Route] Saving freshly digested payload to Firestore database and Redis memory...`);
    
    try {
      await setFirestoreCache(
        collectionName,
        docId,
        freshPayload,
        commitResult.etag,
        commitResult.lastModified
      );
    } catch (firestoreWriteErr) {
      console.warn("[Sync Route] Firestore write failed during ingestion save. Bypassing persistent cache.");
    }

    await setCachedData(cacheKey, freshPayload, 1800);

    return NextResponse.json({
      source: "github_live_api",
      data: freshPayload
    });

  } catch (error: any) {
    console.error("[Sync Route] CRITICAL PIPELINE CRASH:", error);
    return NextResponse.json(
      { 
        error: "Internal Server Error", 
        message: error.message || "An error occurred during codebase ingestion." 
      },
      { status: 500 }
    );
  }
}
