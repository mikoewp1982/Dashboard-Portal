import apkManifest from "@/data/apk-manifest.json";

type ApkManifest = {
  files?: Record<string, { sha256?: string; lastModified?: string }>;
};

export function getApkDownloadHref(fileName: string) {
  const baseHref = `/apk/${fileName}`;
  const manifest = apkManifest as ApkManifest;
  const fileMeta = manifest.files?.[fileName];
  const versionToken = fileMeta?.sha256?.slice(0, 12) || fileMeta?.lastModified;
  if (!versionToken) return baseHref;
  return `${baseHref}?v=${encodeURIComponent(versionToken)}`;
}
