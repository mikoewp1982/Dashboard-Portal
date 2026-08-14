const { initializeApp, cert } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const serviceAccount = require('../service-account.json');

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://kompas-5f0b4-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = getDatabase();

async function checkPrincipals() {
  const principalsRef = db.ref('principals');
  const snapshot = await principalsRef.once('value');
  const principals = snapshot.val();
  
  if (!principals) {
    console.log("No principals found in 'principals' node.");
  } else {
    console.log("Principals found:");
    for (const [key, val] of Object.entries(principals)) {
      console.log(`- ${key}:`, val);
    }
  }
  
  // also check teacher nodes just in case
  const schoolsRef = db.ref('gas/schools');
  const schoolsSnap = await schoolsRef.once('value');
  const schools = schoolsSnap.val();
  if (schools) {
    for (const [schoolId, schoolData] of Object.entries(schools)) {
      if (schoolData.teachers) {
        for (const [teacherId, teacherData] of Object.entries(schoolData.teachers)) {
          if (teacherData.isPrincipal || teacherData.role === 'kepala sekolah') {
             console.log(`- Found principal in gas/schools/${schoolId}/teachers/${teacherId}:`, teacherData);
          }
        }
      }
    }
  }

  process.exit(0);
}

checkPrincipals().catch(console.error);
