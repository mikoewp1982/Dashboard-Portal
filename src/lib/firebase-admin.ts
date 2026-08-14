import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { initializeApp, cert, getApps, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

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

function createBoundAdminProxy<T extends object>(getInstance: () => T) {
  return new Proxy({} as T, {
    get(_target, prop) {
      ensureFirebaseAdminInitialized();
      const instance = getInstance();
      const value = instance[prop as keyof T];
      return typeof value === "function" ? value.bind(instance) : value;
    },
  });
}

export const adminAuth = createBoundAdminProxy(() => getAuth()) as ReturnType<typeof getAuth>;

export const adminDb = createBoundAdminProxy(() => getDatabase()) as ReturnType<typeof getDatabase>;

export const adminFirestore = createBoundAdminProxy(() => getFirestore()) as ReturnType<typeof getFirestore>;

export const adminMessaging = createBoundAdminProxy(() => getMessaging()) as ReturnType<typeof getMessaging>;
