import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  const snap = await adminDb.ref('virtual_pets').once('value');
  const pets = snap.val() || {};
  const studentMap: Record<string, any[]> = {};
  for (const [key, p] of Object.entries(pets)) {
    const sid = (p as any).studentId || 'unknown';
    if (!studentMap[sid]) studentMap[sid] = [];
    studentMap[sid].push({ key, schoolId: (p as any).schoolId });
  }
  
  const duplicates = Object.entries(studentMap).filter(([k,v]) => v.length > 1);
  return NextResponse.json({
    totalPets: Object.keys(pets).length,
    duplicateStudents: duplicates.length,
    sample: duplicates.slice(0, 3)
  });
}
