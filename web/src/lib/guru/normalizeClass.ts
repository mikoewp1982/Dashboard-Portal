export function normalizeClassName(value: unknown): string {
  let normalized = String(value || "")
    .toUpperCase()
    .replace(/KELAS/g, "")
    .trim();

  normalized = normalized
    .replace(/VIII/g, "8")
    .replace(/VII/g, "7")
    .replace(/IX/g, "9")
    .replace(/III/g, "3")
    .replace(/II/g, "2")
    .replace(/IV/g, "4")
    .replace(/VI/g, "6")
    .replace(/V/g, "5")
    .replace(/\s+/g, "")
    .trim();

  return normalized;
}

export function readHomeroomClass(row: Record<string, unknown> | null | undefined): string {
  if (!row) return "";
  return String(
    row.homeroomClass || row.class || row.kelas || row.wali_kelas || row.className || ""
  ).trim();
}

export function readStudentClass(row: Record<string, unknown> | null | undefined): string {
  if (!row) return "";
  return String(row.className || row.kelas || row.class || "").trim();
}
