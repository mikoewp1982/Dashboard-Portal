import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getFunctions } from "firebase/functions";

// Menggunakan kredensial asli dari Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyC0EzPVyqD6Z2NPF29I_bMSh0ejy116y44",
  authDomain: "dashboard-portal-179f7.firebaseapp.com",
  projectId: "dashboard-portal-179f7",
  storageBucket: "dashboard-portal-179f7.firebasestorage.app",
  messagingSenderId: "840983275298",
  appId: "1:840983275298:web:1c0470d3ba05a7f863677b",
  // Format standar URL RTDB (diperlukan jika Anda menggunakan layanan gratis Firebase Realtime Database)
  databaseURL: "https://dashboard-portal-179f7-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase only if it hasn't been initialized
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const functions = getFunctions(app);

export default app;
