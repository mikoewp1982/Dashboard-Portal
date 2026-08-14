export function normalizeSchoolId(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

export function getSchoolIdVariants(value: unknown) {
  const canonical = normalizeSchoolId(value);
  const legacy = canonical.replace(/[\s\-]+/g, "_");
  return canonical && canonical !== legacy ? [canonical, legacy] : canonical ? [canonical] : [];
}

