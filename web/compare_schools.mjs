import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('./service-account.json', 'utf8'));

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
    databaseURL: 'https://kompas-5f0b4-default-rtdb.asia-southeast1.firebasedatabase.app'
  });
}

const db = getDatabase();

async function check() {
  const snap1 = await db.ref('schools/smpn3_pacet').once('value');
  const snap2 = await db.ref('schools/smpn_3_pacet').once('value');
  console.log('smpn3_pacet:');
  console.log('  name:', snap1.child('name').val() || snap1.child('schoolName').val());
  console.log('  npsn:', snap1.child('npsn').val());
  console.log('  config:', snap1.child('config').val());

  console.log('smpn_3_pacet:');
  console.log('  name:', snap2.child('name').val() || snap2.child('schoolName').val());
  console.log('  npsn:', snap2.child('npsn').val());
  console.log('  config:', snap2.child('config').val());
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
