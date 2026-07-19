import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { initializeApp, cert, getApps, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';
import { getFirestore } from 'firebase-admin/firestore';

const DEFAULT_DATABASE_URL =
  'https://kompas-5f0b4-default-rtdb.asia-southeast1.firebasedatabase.app';

let initialized = false;

function ensureFirebaseAdminInitialized() {
  if (initialized) return;

  function readServiceAccount(): ServiceAccount | null {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();
    if (serviceAccountJson) {
      return JSON.parse(serviceAccountJson) as ServiceAccount;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
      return {
        projectId,
        clientEmail,
        privateKey,
      };
    }

    const localServiceAccountPath = path.join(process.cwd(), 'service-account.json');
    if (existsSync(localServiceAccountPath)) {
      return JSON.parse(readFileSync(localServiceAccountPath, 'utf8')) as ServiceAccount;
    }

    return null;
  }

  const serviceAccount = readServiceAccount();
  if (!getApps().length) {
    if (serviceAccount) {
      initializeApp({
        credential: cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL?.trim() || DEFAULT_DATABASE_URL,
      });
    } else {
      // Jika di-deploy ke Cloud Run / App Hosting, gunakan Application Default Credentials
      initializeApp({
        databaseURL: process.env.FIREBASE_DATABASE_URL?.trim() || DEFAULT_DATABASE_URL,
      });
    }
  }
  initialized = true;
}

export const adminAuth = new Proxy({}, {
  get(target, prop) {
    ensureFirebaseAdminInitialized();
    return getAuth()[prop as keyof ReturnType<typeof getAuth>];
  }
}) as ReturnType<typeof getAuth>;

export const adminDb = new Proxy({}, {
  get(target, prop) {
    ensureFirebaseAdminInitialized();
    return getDatabase()[prop as keyof ReturnType<typeof getDatabase>];
  }
}) as ReturnType<typeof getDatabase>;

export const adminFirestore = new Proxy({}, {
  get(target, prop) {
    ensureFirebaseAdminInitialized();
    return getFirestore()[prop as keyof ReturnType<typeof getFirestore>];
  }
}) as ReturnType<typeof getFirestore>;
