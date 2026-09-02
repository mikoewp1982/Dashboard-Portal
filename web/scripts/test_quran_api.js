const fetch = require("node-fetch");

async function test() {
  try {
    const res = await fetch("https://quran-api-id.vercel.app/surah/36");
    if (!res.ok) {
      console.log(`Failed to fetch: ${res.status} ${res.statusText}`);
      return;
    }
    const body = await res.json();
    const data = body.data;
    console.log("VERSE 1 KEYS:", Object.keys(data.verses[0]));
    console.log("VERSE 1 DETAILS:", JSON.stringify(data.verses[0], null, 2));
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
