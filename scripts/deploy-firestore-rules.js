const { initializeApp, cert } = require('firebase-admin/app');
const { getSecurityRules } = require('firebase-admin/security-rules');
const fs = require('fs');
const path = require('path');
const serviceAccount = require('../service-account.json');

initializeApp({
  credential: cert(serviceAccount)
});

async function deployFirestoreRules() {
  try {
    const rulesPath = path.join(__dirname, '..', 'firestore.rules');
    const source = fs.readFileSync(rulesPath, 'utf8');
    
    console.log("Membaca file firestore.rules...");
    const securityRules = getSecurityRules();
    
    console.log("Merilis ruleset ke Firestore...");
    await securityRules.releaseFirestoreRulesetFromSource(source);
    
    console.log("✅ BERHASIL! Aturan Firestore (Security Rules) telah di-deploy.");
    process.exit(0);
  } catch (error) {
    console.error("❌ GAGAL men-deploy aturan Firestore:", error);
    process.exit(1);
  }
}

deployFirestoreRules();
