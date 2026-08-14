const { initializeApp, cert } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const serviceAccount = require('../service-account.json');

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://kompas-5f0b4-default-rtdb.asia-southeast1.firebasedatabase.app" // Ensure we use the RTDB URL
});

const db = getDatabase();

async function checkDB() {
  try {
    console.log("Checking schools node...");
    const schoolsSnap = await db.ref('schools').once('value');
    const schools = schoolsSnap.val();
    console.log("Schools:", JSON.stringify(schools, null, 2));

    if (schools) {
        for (const key of Object.keys(schools)) {
            console.log(`\nChecking students for school: ${key}`);
            const studentsSnap = await db.ref(`gas/schools/${key}/students`).once('value');
            console.log(`Students for ${key}:`, JSON.stringify(studentsSnap.val(), null, 2));
            
            console.log(`\nChecking teachers for school: ${key}`);
            const teachersSnap = await db.ref(`gas/schools/${key}/teachers`).once('value');
            console.log(`Teachers for ${key}:`, JSON.stringify(teachersSnap.val(), null, 2));
        }
    }
    
    // Check if there are any students under 20555784 just in case
    console.log("\nChecking gas/schools/20555784...");
    const npsnSnap = await db.ref('gas/schools/20555784').once('value');
    console.log("20555784 data:", JSON.stringify(npsnSnap.val(), null, 2));

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkDB();
