import { initializeApp, getApps, getApp, cert } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

/**
 * lib/cache/firestore.ts
 *
 * This module establishes our persistent serverless database cache using Google Cloud Firestore.
 * It utilizes the firebase-admin SDK to guarantee secure server-side execution boundaries and
 * features a fail-safe fallback to allow local offline development even without active cloud credentials
 * or if environment credentials are malformed.
 */

let firestoreDb: Firestore | null = null;
let isFirestoreInitialized = false;

/**
 * Initializes and returns a single Firestore connection instance.
 * Gracefully deactivates itself if cloud credentials are missing or malformed, 
 * allowing local execution to continue.
 */
export function getFirestoreDb(): Firestore | null {
  if (typeof window !== "undefined") {
    return null; // Ensure Firestore admin never runs in client-side code
  }

  if (firestoreDb && isFirestoreInitialized) {
    return firestoreDb;
  }

  // Check if we are running in an emulator environment for local development
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.log(
      `[Firestore Cache] Local Emulator detected: connecting to ${process.env.FIRESTORE_EMULATOR_HOST}`
    );
  }

  try {
    if (getApps().length === 0) {
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      
      if (serviceAccountJson) {
        try {
          // Robust nested parse in case environment variable contains backslash or newline escaping errors
          const credential = JSON.parse(serviceAccountJson.trim());
          initializeApp({
            credential: cert(credential),
          });
        } catch (jsonError: any) {
          console.warn(
            `[Firestore Cache] FIREBASE_SERVICE_ACCOUNT_JSON was found but failed to parse: ${jsonError.message}. ` +
            `Falling back to default initialization.`
          );
          // Attempt default credentials if JSON parse failed
          initializeApp();
        }
      } else {
        // Default initialization utilizing ambient GCP service account details.
        initializeApp();
      }
    } else {
      getApp();
    }

    firestoreDb = getFirestore();
    isFirestoreInitialized = true;
    console.log(" [Firestore Cache] Database initialized successfully.");
    return firestoreDb;
  } catch (error: any) {
    console.warn(
      `[Firestore Cache] Database credentials missing or emulator offline: ${error.message}. ` +
      `Bypassing persistent database caching (running in Direct GitHub mode).`
    );
    isFirestoreInitialized = false;
    firestoreDb = null;
    return null;
  }
}

export interface FirestoreCacheDocument<T> {
  payload: T;
  etag: string | null;
  lastModified: string | null;
  updatedAt: string; // ISO timestamp
}

/**
 * Fetches a cached payload along with its metadata (ETag / Last-Modified) from Firestore.
 * Gracefully returns null if Firestore is bypassed.
 */
export async function getFirestoreCache<T>(
  collection: string,
  docId: string
): Promise<FirestoreCacheDocument<T> | null> {
  try {
    const db = getFirestoreDb();
    if (!db) return null;

    const docRef = db.collection(collection).doc(docId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return null;
    }

    const data = docSnap.data() as FirestoreCacheDocument<T>;
    return data;
  } catch (error) {
    console.warn(`[Firestore Cache] Get failed for ${collection}/${docId}:`, error);
    return null;
  }
}

/**
 * Persists a payload in Firestore alongside its ETag and Last-Modified conditional headers.
 * Gracefully ignores failures if Firestore is bypassed.
 */
export async function setFirestoreCache<T>(
  collection: string,
  docId: string,
  payload: T,
  etag: string | null = null,
  lastModified: string | null = null
): Promise<void> {
  try {
    const db = getFirestoreDb();
    if (!db) return;

    const docRef = db.collection(collection).doc(docId);
    
    const cacheDoc: FirestoreCacheDocument<T> = {
      payload,
      etag,
      lastModified,
      updatedAt: new Date().toISOString(),
    };

    await docRef.set(cacheDoc, { merge: true });
  } catch (error) {
    console.warn(`[Firestore Cache] Set failed for ${collection}/${docId}:`, error);
  }
}

/**
 * Explicitly deletes a cached record from Firestore.
 */
export async function deleteFirestoreCache(collection: string, docId: string): Promise<void> {
  try {
    const db = getFirestoreDb();
    if (!db) return;
    await db.collection(collection).doc(docId).delete();
  } catch (error) {
    console.warn(`[Firestore Cache] Delete failed for ${collection}/${docId}:`, error);
  }
}
