const { initializeApp, cert } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const serviceAccount = require('../service-account.json');

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://dashboard-portal-179f7-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = getDatabase();

async function cleanSchools() {
  try {
    const garbageIds = ['SCH-001', 'SCH-002', 'SCH-003', 'sch-001', 'sch-002', 'sch-003'];
    
    for (const id of garbageIds) {
      console.log(`Removing ${id} from schools...`);
      await db.ref(`schools/${id}`).remove();
      
      console.log(`Removing ${id} from gas/schools...`);
      await db.ref(`gas/schools/${id}`).remove();
    }
    
    console.log("Done removing garbage schools completely.");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

cleanSchools();
