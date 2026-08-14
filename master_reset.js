const fs = require('fs');
const path = require('path');

// 1. Hapus cache .next
try {
  console.log('Menghapus cache Next.js...');
  fs.rmSync(path.join(__dirname, '.next'), { recursive: true, force: true });
  console.log('✅ Cache .next berhasil dihapus.');
} catch (e) {
  console.log('ℹ️ Cache .next sudah bersih.');
}

// 2. Kembalikan nama folder ke service-status agar URL lama bekerja
const oldPath = path.join(__dirname, 'src', 'app', 'super-admin', 'status-layanan');
const newPath = path.join(__dirname, 'src', 'app', 'super-admin', 'service-status');
try {
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
    console.log('✅ Folder dikembalikan ke service-status.');
  }
} catch (e) {
  console.log('ℹ️ Folder sudah bernama service-status.');
}

// 3. Hapus layout.tsx yang bisa menyebabkan masalah kompilasi
const layoutFile = path.join(__dirname, 'src', 'app', 'super-admin', 'service-status', 'layout.tsx');
try {
  if (fs.existsSync(layoutFile)) {
    fs.unlinkSync(layoutFile);
    console.log('✅ File layout.tsx dihapus.');
  }
} catch(e) {}

console.log('🎉 PROSES BERSIH SELESAI!');
