const { initializeApp, cert } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const serviceAccount = require('../service-account.json');

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://kompas-5f0b4-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = getDatabase();

async function checkTeachers() {
  const teachersSnap = await db.ref('gas/schools/smpn_3_pacet/teachers').once('value');
  const teachers = teachersSnap.val();
  if (teachers) {
      console.log(`Found ${Object.keys(teachers).length} teachers in smpn_3_pacet`);
      for (const [key, val] of Object.entries(teachers)) {
          console.log(key, "=>", { username: val.username, name: val.name, role: val.role, isPrincipal: val.isPrincipal });
      }
  } else {
      console.log("No teachers found for smpn_3_pacet");
  }

  process.exit(0);
}
checkTeachers().catch(console.error);
