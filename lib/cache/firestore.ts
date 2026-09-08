import { initializeApp, getApps, getApp, cert } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let firestoreDb: Firestore | null = null;

export function getFirestoreDb(): Firestore {
  if (firestoreDb) {
    return firestoreDb;
  }

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
          const credential = JSON.parse(serviceAccountJson);
          initializeApp({
            credential: cert(credential),
          });
          console.log(" [Firestore Cache] Initialized with Service Account JSON.");
        } catch (jsonErr) {
          console.warn(
            "[Firestore Cache] Invalid FIREBASE_SERVICE_ACCOUNT_JSON string format. Falling back to ambient Google Application Default Credentials."
          );
          initializeApp();
        }
      } else {
        // Fallback to ambient GCP service account credentials
        initializeApp();
        console.log(" [Firestore Cache] Initialized with ambient GCP Application Default Credentials.");
      }
    } else {
      getApp();
    }

    firestoreDb = getFirestore();
    return firestoreDb;
  } catch (error) {
    console.error("[Firestore Cache] Critical initialization error:", error);
    throw new Error("Failed to initialize Firestore serverless client.");
  }
}

export interface FirestoreCacheDocument<T> {
  payload: T;
  etag: string | null;
  lastModified: string | null;
  updatedAt: string;
}

export async function getFirestoreCache<T>(
  collection: string,
  docId: string
): Promise<FirestoreCacheDocument<T> | null> {
  try {
    const db = getFirestoreDb();
    const docRef = db.collection(collection).doc(docId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return null;
    }

    return docSnap.data() as FirestoreCacheDocument<T>;
  } catch (error) {
    console.error(`[Firestore Cache] Get failed for ${collection}/${docId}:`, error);
    return null;
  }
}

export async function setFirestoreCache<T>(
  collection: string,
  docId: string,
  payload: T,
  etag: string | null = null,
  lastModified: string | null = null
): Promise<void> {
  try {
    const db = getFirestoreDb();
    if (!db) return; // Fail-safe check
    
    const docRef = db.collection(collection).doc(docId);
    
    const cacheDoc: FirestoreCacheDocument<T> = {
      payload,
      etag,
      lastModified,
      updatedAt: new Date().toISOString(),
    };

    // Recursively clean undefined values to satisfy Firestore's strict schema
    const cleanDoc = sanitizeUndefined(cacheDoc);
    await docRef.set(cleanDoc, { merge: true });
  } catch (error) {
    console.error(`[Firestore Cache] Set failed for ${collection}/${docId}:`, error);
  }
}


export async function deleteFirestoreCache(collection: string, docId: string): Promise<void> {
  try {
    const db = getFirestoreDb();
    await db.collection(collection).doc(docId).delete();
  } catch (error) {
    console.error(`[Firestore Cache] Delete failed for ${collection}/${docId}:`, error);
  }
}

// Helper to recursively strip undefined properties or convert them to null
function sanitizeUndefined(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null) return null;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeUndefined);
  }
  if (typeof obj === "object") {
    const sanitized: Record<string, any> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = sanitizeUndefined(obj[key]);
        if (val !== undefined) {
          sanitized[key] = val;
        }
      }
    }
    return sanitized;
  }
  return obj;
}
