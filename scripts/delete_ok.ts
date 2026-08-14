import { adminDb } from "../src/lib/firebase-admin";

async function run() {
  try {
    let targetPetId = null;
    let targetStudentId = null;

    console.log('Searching by petName = OK');
    const petsSnap1 = await adminDb.ref('virtual_pets').orderByChild('petName').equalTo('OK').once('value');
    petsSnap1.forEach(child => {
        targetPetId = child.key;
        targetStudentId = child.val().studentId;
    });

    if (!targetPetId) {
        console.log('Searching by studentName = ok');
        const petsSnap2 = await adminDb.ref('virtual_pets').orderByChild('studentName').equalTo('ok').once('value');
        petsSnap2.forEach(child => {
            targetPetId = child.key;
            targetStudentId = child.val().studentId;
        });
    }

    if (!targetPetId) {
        console.log('Searching by petName = ok (lowercase)');
        const petsSnap3 = await adminDb.ref('virtual_pets').orderByChild('petName').equalTo('ok').once('value');
        petsSnap3.forEach(child => {
            targetPetId = child.key;
            targetStudentId = child.val().studentId;
        });
    }

    if (targetPetId) {
       console.log('Found garbage pet:', targetPetId, 'studentId:', targetStudentId);
       
       await adminDb.ref('virtual_pets').child(targetPetId).remove();
       console.log('Deleted pet data.');

       const questsSnap = await adminDb.ref('pet_quests').orderByChild('petId').equalTo(targetPetId).once('value');
       const questUpdates: any = {};
       questsSnap.forEach(q => { questUpdates[q.key] = null; });
       if (Object.keys(questUpdates).length > 0) {
           await adminDb.ref('pet_quests').update(questUpdates);
           console.log('Deleted pet quests.');
       }

       const achSnap = await adminDb.ref('pet_achievements').orderByChild('petId').equalTo(targetPetId).once('value');
       const achUpdates: any = {};
       achSnap.forEach(a => { achUpdates[a.key] = null; });
       if (Object.keys(achUpdates).length > 0) {
           await adminDb.ref('pet_achievements').update(achUpdates);
           console.log('Deleted pet achievements.');
       }
    } else {
       console.log('Garbage pet not found globally.');
    }
    
    console.log('Cleaning up student OK');
    const studentSnap = await adminDb.ref('gas/schools/spentgapa/students').orderByChild('nama').equalTo('ok').once('value');
    studentSnap.forEach(s => {
        adminDb.ref('gas/schools/spentgapa/students').child(s.key as string).remove();
        console.log('Deleted student record (nama):', s.key);
    });

    const studentSnap2 = await adminDb.ref('gas/schools/spentgapa/students').orderByChild('name').equalTo('ok').once('value');
    studentSnap2.forEach(s => {
        adminDb.ref('gas/schools/spentgapa/students').child(s.key as string).remove();
        console.log('Deleted student record (name):', s.key);
    });

    const studentSnap3 = await adminDb.ref('gas/schools/spentgapa/students').orderByChild('username').equalTo('ok').once('value');
    studentSnap3.forEach(s => {
        adminDb.ref('gas/schools/spentgapa/students').child(s.key as string).remove();
        console.log('Deleted student record (username):', s.key);
    });

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
