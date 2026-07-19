const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'app', 'super-admin', 'status-layanan', 'layout.tsx');
try {
  fs.unlinkSync(file);
  console.log('Deleted layout.tsx');
} catch (e) {
  console.log('File not found or already deleted');
}
