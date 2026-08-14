const { initializeApp } = require("firebase/app");
const { getDatabase, ref, get } = require("firebase/database");
const fetch = require("node-fetch");
global.fetch = fetch; // Polyfill for Node.js 16/18 if needed for older firebase version

const firebaseConfig = {
  databaseURL: "https://kompas-5f0b4-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function test() {
  try {
    const snapshot = await get(ref(db, "discipline_records_by_school/spentgapa"));
    const data = snapshot.val();
    console.log("DATA TYPE:", typeof data);
    console.log("DATA KEYS:", data ? Object.keys(data).length : 0);
    if (data) {
        console.log("FIRST RECORD:", Object.values(data)[0]);
    }
  } catch (e) {
    console.error("ERROR:", e);
  }
  process.exit(0);
}

test();
