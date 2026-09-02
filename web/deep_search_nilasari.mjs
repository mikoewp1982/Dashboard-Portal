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
  const rootSnap = await db.ref().once('value');
  const root = rootSnap.val() || {};
  function search(obj, path = '') {
    if (!obj) return;
    if (typeof obj === 'string') {
      if (obj.toLowerCase().includes('nilasari')) {
        console.log('Match at path:', path, 'Value:', obj);
      }
      return;
    }
    if (typeof obj === 'object') {
      for (const [k, v] of Object.entries(obj)) {
        search(v, `${path}/${k}`);
      }
    }
  }
  search(root);
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
