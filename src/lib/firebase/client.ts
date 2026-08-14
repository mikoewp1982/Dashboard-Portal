import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getFunctions } from "firebase/functions";

// Menggunakan kredensial dari Firebase Console - Project KOMPAS
const firebaseConfig = {
  apiKey: "AIzaSyDu0-azn8PV7dNEnXC2HHsf2_gxSd7dzcs",
  authDomain: "kompas-5f0b4.firebaseapp.com",
  databaseURL: "https://kompas-5f0b4-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kompas-5f0b4",
  storageBucket: "kompas-5f0b4.firebasestorage.app",
  messagingSenderId: "562277218066",
  appId: "1:562277218066:web:dad422f2a11a29f7cba5cb"
};

// Initialize Firebase only if it hasn't been initialized
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const functions = getFunctions(app);

export default app;
