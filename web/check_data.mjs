// check_data.mjs - ESM module to check Firebase data
import { initializeApp, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const serviceAccount = require('./service-account.json');

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://kompas-5f0b4-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = getDatabase();

async function check() {
  // First, list all schools with data
  const allSnap = await db.ref("gas/schools").once("value");
  const all = allSnap.val() || {};
  
  console.log("=== Schools with teachers or students ===");
  for (const [schoolId, data] of Object.entries(all)) {
    const teachers = data.teachers || {};
    const students = data.students || {};
    const tCount = Object.keys(teachers).length;
    const sCount = Object.keys(students).length;
    
    if (tCount > 0 || sCount > 0) {
      console.log(`\nSchool: ${schoolId} (teachers: ${tCount}, students: ${sCount})`);
      
      for (const [key, t] of Object.entries(teachers)) {
        console.log(`  TEACHER [${key}]: name=${t.name || t.nama}, nuptk=${t.nuptk}, class=${t.homeroomClass || t.class || t.kelas || "(empty)"}, schoolId=${t.schoolId || "(empty)"}, role=${t.role || "(empty)"}`);
      }
      
      for (const [key, s] of Object.entries(students)) {
        console.log(`  STUDENT [${key}]: name=${s.name || s.nama}, nisn=${s.nisn}, class=${s.class || "(empty)"}, className=${s.className || "(empty)"}, kelas=${s.kelas || "(empty)"}, schoolId=${s.schoolId || "(empty)"}`);
      }
    }
  }
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
