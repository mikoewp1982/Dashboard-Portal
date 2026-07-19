const { initializeApp, cert } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const { getAuth } = require('firebase-admin/auth');
const serviceAccount = require('../service-account.json');

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://kompas-5f0b4-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = getDatabase();
const auth = getAuth();

async function fixWahyu() {
  try {
    // 1. Get old RTDB data
    const oldSnap = await db.ref('principals/wahyu_smpn3pacet').once('value');
    if (!oldSnap.exists()) {
      console.log("wahyu_smpn3pacet not found in RTDB");
    } else {
      const data = oldSnap.val();
      
      // 2. Create new Auth user
      const newEmail = "wahyu@kepsek.edulock.local";
      try {
        await auth.createUser({
          email: newEmail,
          password: "220282", // Using the password from the screenshot
          displayName: data.name || "wahyu"
        });
        console.log("Created Auth user:", newEmail);
      } catch (e) {
        if (e.code === 'auth/email-already-exists') {
          console.log("Auth user already exists, updating password...");
          const user = await auth.getUserByEmail(newEmail);
          await auth.updateUser(user.uid, { password: "220282" });
        } else {
          throw e;
        }
      }

      // 3. Create new RTDB node
      const newData = {
        ...data,
        username: "wahyu"
      };
      await db.ref('principals/wahyu').set(newData);
      console.log("Created principals/wahyu in RTDB");

      // 4. Delete old RTDB node
      await db.ref('principals/wahyu_smpn3pacet').remove();
      console.log("Deleted old principals/wahyu_smpn3pacet in RTDB");
      
      // 5. Delete old Auth user (optional, but clean)
      try {
        const oldUser = await auth.getUserByEmail("wahyu_smpn3pacet@kepsek.edulock.local");
        await auth.deleteUser(oldUser.uid);
        console.log("Deleted old Auth user wahyu_smpn3pacet@kepsek.edulock.local");
      } catch (e) {
        console.log("Could not delete old Auth user:", e.message);
      }
    }
    
    console.log("DONE");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

fixWahyu();
