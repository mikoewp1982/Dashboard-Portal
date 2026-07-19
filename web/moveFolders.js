const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src', 'app', 'dashboard', 'super');
const targetGasDir = path.join(__dirname, 'src', 'app', 'super-admin', 'gas');
const targetServiceStatusDir = path.join(__dirname, 'src', 'app', 'super-admin', 'service-status');

// Create parent directory for GAS if it doesn't exist
const superAdminDir = path.join(__dirname, 'src', 'app', 'super-admin');
if (!fs.existsSync(superAdminDir)) {
  fs.mkdirSync(superAdminDir, { recursive: true });
}
if (!fs.existsSync(targetGasDir)) {
  fs.mkdirSync(targetGasDir, { recursive: true });
}

// Read contents of dashboard/super
if (fs.existsSync(srcDir)) {
  const items = fs.readdirSync(srcDir);
  
  for (const item of items) {
    const itemPath = path.join(srcDir, item);
    
    if (item === 'service-status') {
      const targetPath = targetServiceStatusDir;
      // Hapus folder kosong dari kegagalan sebelumnya jika ada
      if (fs.existsSync(targetPath) && fs.readdirSync(targetPath).length === 0) {
          fs.rmdirSync(targetPath);
      }
      try {
        // Move service-status to super-admin/service-status
        fs.renameSync(itemPath, targetPath);
        console.log(`Berhasil memindahkan service-status ke: ${targetPath}`);
      } catch (e) {
        console.log(`Gagal memindahkan service-status: ${e.message}`);
      }
    } else {
      // Move others to super-admin/gas
      const targetPath = path.join(targetGasDir, item);
      try {
        fs.renameSync(itemPath, targetPath);
        console.log(`Berhasil memindahkan ${item} ke: ${targetPath}`);
      } catch (e) {
        console.log(`Gagal memindahkan ${item}: ${e.message}`);
      }
    }
  }
  
  // Try to remove the old super directory
  try {
    fs.rmdirSync(srcDir);
    console.log(`Berhasil menghapus folder lama: ${srcDir}`);
  } catch (e) {
    console.log(`Catatan: Folder lama tidak bisa otomatis dihapus (mungkin masih ada file tersembunyi), biarkan saja atau hapus manual.`);
  }
  
  console.log("SELESAI! Semua folder berhasil dipindahkan.");
} else {
  console.log("Folder asal tidak ditemukan. Mungkin sudah dipindahkan sebelumnya?");
}
