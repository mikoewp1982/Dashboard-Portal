const { initializeApp, cert } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const serviceAccount = require('./service-account.json');

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: 'https://kompas-5f0b4-default-rtdb.asia-southeast1.firebasedatabase.app'
});

const db = getDatabase();
db.ref("schools/smpn3_pacet/config").once("value").then(snap => {
  console.log("CONFIG:", JSON.stringify(snap.val(), null, 2));
  process.exit(0);
});
