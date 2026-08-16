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

function isApkAliasFileName(fileName: string) {
  return /-(?:student)?release\.apk$/i.test(fileName);
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

  // Prefer versioned filenames (e.g. GAS-Siswa-1.0.80-siswa-23077.apk) so the
  // browser Save-As name matches the URL. Mobile browsers often ignore the
  // HTML download= attribute and use the path basename instead.
  const versionedEntries = entries.filter(
    ([fileName]) => !isApkAliasFileName(fileName)
  );
  const pool = versionedEntries.length > 0 ? versionedEntries : entries;

  const best = pool
    .map(([fileName, meta]) => ({
      fileName,
      versionName: meta?.versionName,
      versionCode: typeof meta?.versionCode === "number" ? meta.versionCode : -1,
    }))
    .sort((a, b) => {
      if (a.versionCode !== b.versionCode) return b.versionCode - a.versionCode;
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
