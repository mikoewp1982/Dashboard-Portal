export function teacherAuthEmail(schoolId: string, nuptk: string) {
  const safe = `${schoolId}_${nuptk}`
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .slice(0, 64);
  return `${safe || "guru"}@teacher.gas.local`;
}
