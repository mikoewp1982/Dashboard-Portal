const admin = require("firebase-admin");
const serviceAccount = require("./service-account.json"); // if it exists, but let's check how web/src/lib/firebase-admin.ts initializes it

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://lenteranusa-2dddf-default-rtdb.firebaseio.com" // Need to find the actual DB URL
});

const db = admin.database();
// ...
