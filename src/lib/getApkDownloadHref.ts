import * as fs from "node:fs";
import * as path from "node:path";

type ApkManifest = {
  updatedAt?: string;
  files?: Record<
    string,
    {
      sha256?: string;
      signerSha256?: string;
      lastModified?: string;
      packageName?: string;
      versionCode?: number;
      versionName?: string;
      sizeBytes?: number;
      sizeMB?: number;
    }
  >;
};

let _cachedManifest: ApkManifest | null = null;
let _cachedManifestMtimeMs = 0;

function loadManifestOnce(): ApkManifest {
  const manifestPath = path.join(
    process.cwd(),
    "public",
    "apk",
    "apk-manifest.json"
  );

  let stat;
  try {
    stat = fs.statSync(manifestPath);
  } catch {
    return {};
  }

  if (
    _cachedManifest !== null &&
    _cachedManifestMtimeMs === stat.mtimeMs
  ) {
    return _cachedManifest;
  }

  try {
    const raw = fs.readFileSync(manifestPath, "utf-8");
    const stripped = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
    const parsed = JSON.parse(stripped) as ApkManifest;
    _cachedManifest = parsed;
    _cachedManifestMtimeMs = stat.mtimeMs;
    return parsed;
  } catch {
    return {};
  }
}

export function getApkDownloadHref(fileName: string) {
  const baseHref = `/apk/${fileName}`;
  const manifest = loadManifestOnce();
  const fileMeta = manifest.files?.[fileName];
  const versionToken = fileMeta?.sha256?.slice(0, 12) || fileMeta?.lastModified;
  if (!versionToken) return baseHref;
  return `${baseHref}?v=${encodeURIComponent(versionToken)}`;
}

export function getLatestApkMetaByPackageName(
  packageName: string,
  fallback: { fileName: string; versionName?: string; versionCode?: number }
) {
  const manifest = loadManifestOnce();
  const entries = Object.entries(manifest.files || {}).filter(
    ([, meta]) => meta?.packageName === packageName
  );

  if (entries.length === 0) return fallback;

  const best = entries
    .map(([fileName, meta]) => ({
      fileName,
      versionName: meta?.versionName,
      versionCode: typeof meta?.versionCode === "number" ? meta.versionCode : -1,
      isAlias: /-release\.apk$/i.test(fileName),
    }))
    .sort((a, b) => {
      if (a.versionCode !== b.versionCode) return b.versionCode - a.versionCode;
      if (a.isAlias !== b.isAlias) return a.isAlias ? 1 : -1;
      return a.fileName.localeCompare(b.fileName);
    })[0];

  return {
    fileName: best?.fileName || fallback.fileName,
    versionName: best?.versionName || fallback.versionName,
    versionCode: best?.versionCode ?? fallback.versionCode,
  };
}

export function getLatestApkFileNameByPackageName(
  packageName: string,
  fallbackFileName: string
) {
  return getLatestApkMetaByPackageName(packageName, { fileName: fallbackFileName })
    .fileName;
}
