"use client";

export const databaseMenuItems = [
  { label: "Dashboard Overview", id: "Dashboard Overview" },
  { label: "Siswa", id: "Siswa" },
  { label: "Guru/Wali Kelas", id: "Guru/Wali Kelas" },
  { label: "Petugas OSIS", id: "Petugas OSIS" },
  { label: "Kelas Paralel", id: "Kelas Paralel" },
] as const;

export type DatabaseTab = (typeof databaseMenuItems)[number]["id"];

export type DatabaseRecord = {
  id: string;
  studentId?: string;
  username?: string;
  name?: string;
  nisn?: string;
  nuptk?: string;
  class?: string;
  className?: string;
  grade?: string;
  position?: string;
  status?: string;
  gender?: string;
  religion?: string;
  device?: string;
};

export type OverviewCounts = {
  studentsActive: number;
  teachersActive: number;
  staffActive: number;
};

export type DatabaseFormData = {
  name: string;
  nisn: string;
  nuptk: string;
  class: string;
  position: string;
  status: string;
  gender: string;
  religion: string;
};

export const defaultFormData: DatabaseFormData = {
  name: "",
  nisn: "",
  nuptk: "",
  class: "",
  position: "",
  status: "Aktif",
  gender: "L",
  religion: "ISLAM",
};

export const getDatabasePath = (tab: DatabaseTab, schoolId: string) => {
  if (tab === "Siswa") return `gas/schools/${schoolId}/students`;
  if (tab === "Guru/Wali Kelas") return `gas/schools/${schoolId}/teachers`;
  if (tab === "Petugas OSIS") return `gas/schools/${schoolId}/staff`;
  if (tab === "Kelas Paralel") return `gas/schools/${schoolId}/classes`;
  return "";
};

export const romanFromGrade = (grade: number) => {
  if (grade === 7) return "VII";
  if (grade === 8) return "VIII";
  if (grade === 9) return "IX";
  if (grade === 10) return "X";
  if (grade === 11) return "XI";
  if (grade === 12) return "XII";
  return String(grade);
};
