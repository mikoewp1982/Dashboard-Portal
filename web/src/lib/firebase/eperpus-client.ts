import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

/** Secondary Firebase app: eperpus-sekolah (Lentera Digital catalog). */
const EPERPUS_APP_NAME = "eperpus-sekolah";

const eperpusConfig = {
  apiKey: "AIzaSyBvmr1cu8-WnGNiD5M_cla6lxr88QEYu28",
  authDomain: "eperpus-sekolah.firebaseapp.com",
  projectId: "eperpus-sekolah",
  storageBucket: "eperpus-sekolah.firebasestorage.app",
  messagingSenderId: "303647816343",
  appId: "1:303647816343:web:78ad36d2d1be25930547d2",
};

function getEperpusApp() {
  const existing = getApps().find((app) => app.name === EPERPUS_APP_NAME);
  if (existing) return existing;
  return initializeApp(eperpusConfig, EPERPUS_APP_NAME);
}

export const eperpusDb = getFirestore(getEperpusApp());
