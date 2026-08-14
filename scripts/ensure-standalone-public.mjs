import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");
const publicDir = path.join(webRoot, "public");
const standalonePublicDir = path.join(webRoot, ".next", "standalone", "public");

function copyDirMerge(sourceDir, targetDir) {
  mkdirSync(targetDir, { recursive: true });

  for (const entry of readdirSync(sourceDir)) {
    const sourcePath = path.join(sourceDir, entry);
    const targetPath = path.join(targetDir, entry);
    const stats = statSync(sourcePath);

    if (stats.isDirectory()) {
      copyDirMerge(sourcePath, targetPath);
      continue;
    }

    cpSync(sourcePath, targetPath, { force: true });
  }
}

if (!existsSync(publicDir)) {
  console.log("[ensure-standalone-public] public/ tidak ditemukan, dilewati.");
  process.exit(0);
}

if (!existsSync(path.join(webRoot, ".next", "standalone"))) {
  console.log("[ensure-standalone-public] .next/standalone tidak ada, dilewati.");
  process.exit(0);
}

copyDirMerge(publicDir, standalonePublicDir);

const apkDir = path.join(standalonePublicDir, "apk");
const apkFiles = existsSync(apkDir)
  ? readdirSync(apkDir).filter((name) => name.toLowerCase().endsWith(".apk"))
  : [];

console.log(
  `[ensure-standalone-public] public/ digabung ke .next/standalone/public (${apkFiles.length} APK).`
);
apkFiles.forEach((name) => console.log(`  - ${name}`));
