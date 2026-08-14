const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const serviceAccount = require('../service-account.json');

initializeApp({
  credential: cert(serviceAccount),
});

const email = 'mikoewp1982@gmail.com';
const newPassword = 'RafaBagas212';

getAuth().getUserByEmail(email)
  .then((user) => {
    return getAuth().updateUser(user.uid, {
      password: newPassword,
    });
  })
  .then((userRecord) => {
    console.log('✅ Password berhasil diperbarui untuk:', userRecord.email);
    console.log('🔑 Password baru:', newPassword);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
