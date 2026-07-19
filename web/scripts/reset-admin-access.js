const { initializeApp, cert } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const serviceAccount = require('../service-account.json');

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://dashboard-portal-179f7-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = getDatabase();

async function resetAccess() {
  try {
    const snap = await db.ref('schools').once('value');
    const schools = snap.val();
    
    if (!schools) {
      console.log("No schools found.");
      process.exit(0);
    }
    
    let updatedCount = 0;
    const updates = {};
    
    for (const [key, val] of Object.entries(schools)) {
      if (key !== 'smpn_3_pacet' && val.adminAccessActive === true) {
        updates[`${key}/adminAccessActive`] = false;
        updatedCount++;
      }
    }
    
    if (updatedCount > 0) {
      await db.ref('schools').update(updates);
      console.log(`Reset adminAccessActive to false for ${updatedCount} schools.`);
    } else {
      console.log("No schools needed reset.");
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

resetAccess();
