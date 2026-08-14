/** Synthetic Auth email for GAS Guru PWA (not a real mailbox). */
export function teacherAuthEmail(schoolId: string, nuptk: string) {
  const safe = `${schoolId}_${nuptk}`
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .slice(0, 64);
  return `${safe || "guru"}@teacher.gas.local`;
}

/** Legacy aliases checked when rotating email format. */
export function teacherAuthEmailCandidates(schoolId: string, nuptk: string) {
  const safe = `${schoolId}_${nuptk}`
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .slice(0, 64);
  const local = safe || "guru";
  return [`${local}@teacher.gas.local`, `${local}@guru.edulock.local`];
}
