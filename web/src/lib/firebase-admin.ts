import { initializeApp, cert, getApps, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from '../../service-account.json';

// Path ini merujuk ke file yang ada di root proyek
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount as ServiceAccount),
    databaseURL: "https://dashboard-portal-179f7-default-rtdb.asia-southeast1.firebasedatabase.app" // Sesuai dengan project id kita
  });
}

export const adminAuth = getAuth();
export const adminDb = getDatabase();
export const adminFirestore = getFirestore();
