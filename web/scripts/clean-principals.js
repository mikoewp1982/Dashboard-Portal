const { initializeApp, cert } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const { getAuth } = require('firebase-admin/auth');
const serviceAccount = require('../service-account.json');

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://dashboard-portal-179f7-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = getDatabase();
const auth = getAuth();

async function cleanPrincipals() {
  try {
    const garbagePrincipals = ['kepsek_jkt1'];
    
    for (const username of garbagePrincipals) {
      console.log(`Removing ${username} from principals node...`);
      await db.ref(`principals/${username}`).remove();
      
      const email = `${username}@kepsek.edulock.local`;
      try {
        const userRecord = await auth.getUserByEmail(email);
        if (userRecord) {
          console.log(`Deleting ${email} from Firebase Auth...`);
          await auth.deleteUser(userRecord.uid);
        }
      } catch (authErr) {
        if (authErr.code === 'auth/user-not-found') {
          console.log(`User ${email} not found in Firebase Auth, skipping.`);
        } else {
          console.error(`Error deleting from auth:`, authErr.message);
        }
      }
    }
    
    console.log("Done removing garbage principals completely.");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

cleanPrincipals();
