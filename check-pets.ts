import { initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

const app = initializeApp();
const db = getDatabase();

async function run() {
  const snap = await db.ref('virtual_pets').once('value');
  const pets = snap.val();
  const studentCounts: Record<string, number> = {};
  for (const [key, p] of Object.entries(pets || {})) {
    const sid = (p as any).studentId || 'unknown';
    studentCounts[sid] = (studentCounts[sid] || 0) + 1;
  }
  const duplicates = Object.entries(studentCounts).filter(([k,v])=>v>1);
  console.log('Total pets:', Object.keys(pets||{}).length);
  console.log('Duplicates:', duplicates.length);
  process.exit(0);
}
run();
