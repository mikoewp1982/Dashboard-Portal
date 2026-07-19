import type { NextConfig } from "next";
import fs from "fs";

// Auto copy script
const srcDir = "D:\\Satu Pintu\\web\\public";
const destDir = "D:\\Dashboard Portal\\web\\public";

try {
  if (fs.existsSync(srcDir)) {
    fs.cpSync(srcDir, destDir, { recursive: true });
    console.log("✅ Auto-copy assets public berhasil.");
  }
} catch (e) {
  console.error("Gagal copy assets:", e);
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
