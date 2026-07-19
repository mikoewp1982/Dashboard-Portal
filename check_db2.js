const admin = require("firebase-admin");
const serviceAccount = require("./service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://kompas-5f0b4-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = admin.database();

async function check() {
  const schoolsSnap = await db.ref("gas/schools").once("value");
  const schools = schoolsSnap.val() || {};
  for (const [schoolId, schoolData] of Object.entries(schools)) {
    console.log(`School: ${schoolId}`);
    
    const teachers = schoolData.teachers || {};
    console.log(` Teachers count: ${Object.keys(teachers).length}`);
    for (const t of Object.values(teachers)) {
      console.log(`  - ${t.name} (class: ${t.homeroomClass || t.class || t.kelas}, role: ${t.role})`);
    }

    const students = schoolData.students || {};
    console.log(` Students count: ${Object.keys(students).length}`);
    for (const s of Object.values(students)) {
      console.log(`  - ${s.name} (class: ${s.className || s.class || s.kelas})`);
    }
  }
}

check().then(() => process.exit(0)).catch(console.error);
