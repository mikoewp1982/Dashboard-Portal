const fs = require('fs');
const path = require('path');

const oldPath = path.join(__dirname, 'src', 'app', 'super-admin', 'service-status');
const newPath = path.join(__dirname, 'src', 'app', 'super-admin', 'status-layanan');

try {
  fs.renameSync(oldPath, newPath);
  console.log('Berhasil mengubah rute menjadi status-layanan');
} catch (e) {
  console.error('Gagal:', e.message);
}
