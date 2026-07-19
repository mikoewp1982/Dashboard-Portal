const { initializeApp, cert } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const serviceAccount = require('../service-account.json');

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://dashboard-portal-179f7-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = getDatabase();

async function run() {
  const s = await db.ref('schools').once('value');
  console.log(s.val());
  process.exit(0);
}
run();
