const fetch = require("node-fetch");

async function test() {
  try {
    const res = await fetch("https://raw.githubusercontent.com/lanandra/asmaul-husna-json/master/asmaul-husna.json");
    if (!res.ok) {
      console.log(`Failed to fetch: ${res.status} ${res.statusText}`);
      return;
    }
    const data = await res.json();
    console.log("SUCCESS! Fetch Asmaul Husna: count =", data.length);
    console.log("Sample:", data[0]);
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
