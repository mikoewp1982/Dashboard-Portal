import { adminDb } from "./src/lib/firebase-admin";

async function check() {
  const schoolsSnap = await adminDb.ref("gas/schools").once("value");
  const schools = (schoolsSnap.val() || {}) as any;
  for (const [schoolId, schoolData] of Object.entries(schools)) {
    console.log(`School: ${schoolId}`);
    
    const teachers = (schoolData as any).teachers || {};
    console.log(` Teachers count: ${Object.keys(teachers).length}`);
    for (const t of Object.values(teachers) as any) {
      console.log(`  - ${t.name} (class: ${t.homeroomClass || t.class || t.kelas}, role: ${t.role})`);
    }

    const students = (schoolData as any).students || {};
    console.log(` Students count: ${Object.keys(students).length}`);
    for (const s of Object.values(students) as any) {
      console.log(`  - ${s.name} (class: ${s.className || s.class || s.kelas})`);
    }
  }
}

check().then(() => process.exit(0)).catch(console.error);
