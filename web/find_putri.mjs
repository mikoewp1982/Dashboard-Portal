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
  const snap = await db.ref('active_devices').once('value');
  const devs = snap.val() || {};
  for (const [id, dev] of Object.entries(devs)) {
    const n = (dev.name || '').toLowerCase();
    if (n.includes('putri') && n.includes('nilasari')) {
      console.log('=== FOUND PUTRI ===');
      console.log('Device ID:', id);
      console.log('School ID:', dev.school_id || dev.schoolId);
      console.log('Data:', JSON.stringify(dev, null, 2));
    }
  }

  // Also check students node
  const snap2 = await db.ref('students').once('value');
  const stus = snap2.val() || {};
  for (const [id, stu] of Object.entries(stus)) {
    const n = (stu.nama || stu.name || '').toLowerCase();
    if (n.includes('nilasari')) {
      console.log('=== FOUND IN STUDENTS ===');
      console.log('ID:', id);
      console.log('School ID:', stu.school_id || stu.schoolId);
      console.log('Class:', stu.kelas || stu.class);
    }
  }
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
