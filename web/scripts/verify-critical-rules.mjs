import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(webRoot, "..");

console.log("🔒 [verify-critical-rules] Menjalankan pemeriksaan otomatis anti-regresi fitur stabil...");

let errors = [];

// -------------------------------------------------------------
// 1. CEK ATURAN VIRTUAL PET DEATH & REVIVE DI web/src/lib/guru/petStatus.ts
// -------------------------------------------------------------
const petStatusPath = path.join(webRoot, "src", "lib", "guru", "petStatus.ts");
if (existsSync(petStatusPath)) {
  const content = readFileSync(petStatusPath, "utf-8");
  
  // Deteksi regresi operator && yang pernah merusak status pet tadi pagi
  if (content.includes("isMarkedDead && (health <= 0 || lowestVitalScore(pet) <= 0)") ||
      content.includes("isMarkedDead && (health <= 0 || lowest <= 0)")) {
    errors.push(
      "❌ REGRESI TERDETEKSI di web/src/lib/guru/petStatus.ts:\n" +
      "   Operator '&&' terdeteksi pada isDeadByRule! Pet vitals 0% (kelaparan/energi 0) TIDAK AKAN terbaca mati jika statusnya SICK.\n" +
      "   WAJIB gunakan operator '||': (isMarkedDead || health <= 0 || lowest <= 0)."
    );
  }

  // Pastikan vitals <= 0 (lowestVitalScore) ikut dihitung sebagai penentu mati/revive
  if (!content.includes("lowest <= 0") && !content.includes("lowestVitalScore(pet) <= 0")) {
    errors.push(
      "❌ REGRESI TERDETEKSI di web/src/lib/guru/petStatus.ts:\n" +
      "   isDeadByRule tidak memeriksa vitals terendah (lowest <= 0). Ini menyebabkan HP siswa terkunci tapi Web Admin tidak tahu."
    );
  }
} else {
  errors.push(`❌ File hilang: ${petStatusPath}`);
}

// -------------------------------------------------------------
// 2. CEK TOMBOL REVIVE DI TABEL STUDENTS AT RISK (GasPetRiskTab.tsx)
// -------------------------------------------------------------
const riskTabPath = path.join(webRoot, "src", "components", "gas", "virtual-pet", "GasPetRiskTab.tsx");
if (existsSync(riskTabPath)) {
  const content = readFileSync(riskTabPath, "utf-8");
  
  // Pastikan tombol Hidupkan bisa muncul untuk kondisi Sekarat maupun Mati
  const hasSekaratRevive = content.includes('"Sekarat"') && content.includes("onRevivePet");
  if (!hasSekaratRevive) {
    errors.push(
      "❌ REGRESI TERDETEKSI di web/src/components/gas/virtual-pet/GasPetRiskTab.tsx:\n" +
      "   Tombol 'Hidupkan' (onRevivePet) wajib tersedia untuk pet berstatus Sekarat dan Mati!\n" +
      "   Jangan sembunyikan tombol Hidupkan hanya karena statusnya bukan DEAD murni."
    );
  }
} else {
  errors.push(`❌ File hilang: ${riskTabPath}`);
}

// -------------------------------------------------------------
// 3. CEK TTL FCM MASTER SWITCH (WAJIB 24 JAM = 86400 DETIK)
// -------------------------------------------------------------
const masterSwitchPath = path.join(webRoot, "src", "lib", "admin", "edulockMasterSwitch.ts");
if (existsSync(masterSwitchPath)) {
  const content = readFileSync(masterSwitchPath, "utf-8");
  if (!content.includes("86400") && !content.includes("86_400") && !content.includes("24 * 60 * 60")) {
    errors.push(
      "❌ REGRESI TERDETEKSI di web/src/lib/admin/edulockMasterSwitch.ts:\n" +
      "   TTL FCM Master Switch wajib minimal 24 jam (86400 detik) agar HP siswa yang tidur/doze tidak kehilangan sinyal bangun!"
    );
  }
}

// -------------------------------------------------------------
// 4. CEK TTL FCM FIND DEVICE (WAJIB 5 MENIT = 300 DETIK)
// -------------------------------------------------------------
const findDevicePath = path.join(webRoot, "src", "lib", "admin", "edulockFindDevice.ts");
if (existsSync(findDevicePath)) {
  const content = readFileSync(findDevicePath, "utf-8");
  if (!content.includes("300") && !content.includes("5 * 60")) {
    errors.push(
      "❌ REGRESI TERDETEKSI di web/src/lib/admin/edulockFindDevice.ts:\n" +
      "   TTL FCM Find Device wajib minimal 300 detik (5 menit)!"
    );
  }
}

// -------------------------------------------------------------
// EVALUASI HASIL PEMERIKSAAN
// -------------------------------------------------------------
if (errors.length > 0) {
  console.error("\n" + "=".repeat(75));
  console.error("🚨 CRITICAL REGRESSION DETECTED! BUILD DIBATALKAN OTOMATIS! 🚨");
  console.error("=".repeat(75));
  errors.forEach((err, idx) => {
    console.error(`\n[${idx + 1}] ${err}`);
  });
  console.error("\n" + "=".repeat(75));
  console.error("Silakan perbaiki file di atas atau baca panduan di:");
  console.error("-> FITUR_STABIL_JANGAN_DISENTUH.md");
  console.error("=".repeat(75) + "\n");
  process.exit(1);
}

console.log("✅ [verify-critical-rules] LULUS: Semua aturan sakral fitur stabil aman!");
process.exit(0);
