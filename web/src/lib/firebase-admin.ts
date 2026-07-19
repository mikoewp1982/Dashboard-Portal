import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { initializeApp, cert, getApps, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';
import { getFirestore } from 'firebase-admin/firestore';

const DEFAULT_DATABASE_URL =
  'https://dashboard-portal-179f7-default-rtdb.asia-southeast1.firebasedatabase.app';

function readServiceAccount(): ServiceAccount {
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

  throw new Error(
    'Firebase Admin credentials tidak ditemukan. Isi FIREBASE_SERVICE_ACCOUNT_KEY atau FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY.'
  );
}

if (!getApps().length) {
  initializeApp({
    credential: cert(readServiceAccount()),
    databaseURL: process.env.FIREBASE_DATABASE_URL?.trim() || DEFAULT_DATABASE_URL,
  });
}

export const adminAuth = getAuth();
export const adminDb = getDatabase();
export const adminFirestore = getFirestore();
