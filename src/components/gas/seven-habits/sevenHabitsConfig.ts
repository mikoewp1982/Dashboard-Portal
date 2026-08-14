"use client";

import { TeacherRubric } from "@/hooks/gas/seven-habits/useGasSevenHabits";

export const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export const WEEKS = [
  { value: 1, label: "Minggu ke-1" },
  { value: 2, label: "Minggu ke-2" },
  { value: 3, label: "Minggu ke-3" },
  { value: 4, label: "Minggu ke-4" },
  { value: 5, label: "Minggu ke-5" },
];

export const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
export const YEARS = Array.from({ length: 2040 - 2024 + 1 }, (_, i) => 2024 + i);

export const DEFAULT_TEACHER_RUBRIC: TeacherRubric = {
  honesty: 20,
  behavior: 20,
  initiative: 20,
  commitment: 20,
  total: 80,
};

export const RUBRIC_FIELDS: Array<{
  key: keyof Omit<TeacherRubric, "total">;
  label: string;
  desc: string;
}> = [
  { key: "honesty", label: "Kejujuran (0-25)", desc: "Siswa mengisi jurnal dengan jujur dan konsisten" },
  { key: "behavior", label: "Perubahan Perilaku (0-25)", desc: "Terlihat perubahan positif dalam keseharian" },
  { key: "initiative", label: "Inisiatif (0-25)", desc: "Proaktif melakukan kebiasaan tanpa disuruh" },
  { key: "commitment", label: "Komitmen (0-25)", desc: "Menunjukkan komitmen perbaikan berkelanjutan" },
];

export function normalizeIdentity(value: unknown) {
  return String(value || "").trim();
}

export function matchesStudentIdentity(
  student: { id?: string | number; nisn?: string | number },
  logStudentId: unknown
) {
  const normalizedLogStudentId = normalizeIdentity(logStudentId);
  if (!normalizedLogStudentId) return false;

  return [
    normalizeIdentity(student.id),
    normalizeIdentity(student.nisn),
  ].filter(Boolean).includes(normalizedLogStudentId);
}

export function getTeacherRatingKeyCandidates(
  student: { id?: string | number; nisn?: string | number },
  month: number,
  year: number
) {
  return [
    `${normalizeIdentity(student.id)}_${month}_${year}`,
    `${normalizeIdentity(student.nisn)}_${month}_${year}`,
  ].filter((value, index, array) => value !== `_${month}_${year}` && array.indexOf(value) === index);
}

export function getClassGradeBucket(className: unknown) {
  const normalized = String(className || "").trim().toUpperCase();
  if (/^(VII|7)\b/.test(normalized)) return "VII";
  if (/^(VIII|8)\b/.test(normalized)) return "VIII";
  if (/^(IX|9)\b/.test(normalized)) return "IX";
  return null;
}
