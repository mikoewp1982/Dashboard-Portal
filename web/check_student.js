const admin = require("firebase-admin");
const serviceAccount = require("./service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://dashboard-portal-179f7-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = admin.database();

async function check() {
  const schoolsSnap = await db.ref("gas/schools").once("value");
  const schools = schoolsSnap.val() || {};
  for (const [schoolId, schoolData] of Object.entries(schools)) {
    console.log(`School: ${schoolId}`);
    const students = schoolData.students || {};
    console.log(` Students count: ${Object.keys(students).length}`);
    for (const [studentKey, s] of Object.entries(students)) {
      console.log(`  - Key: ${studentKey}`);
      console.log(`    NISN: ${s.nisn}, Name: ${s.name}, UUID: ${s.device_uuid}`);
    }
  }
}

check().then(() => process.exit(0)).catch(console.error);
