"use client";

export const gasMenuItems = [
  { id: "dashboard", label: "Beranda GAS", status: "coming_soon" },
  { id: "students", label: "Manajemen Siswa", status: "active" },
  { id: "attendance", label: "Presensi Sekolah", status: "active" },
  { id: "presensi-sholat", label: "Presensi Sholat", status: "active" },
  { id: "settings", label: "Pengaturan Sistem", status: "active" },
  { id: "attendance-report", label: "Rekap Kehadiran", status: "active" },
  { id: "discipline", label: "Rekap Kedisiplinan", status: "active" },
  { id: "library", label: "Monitoring E-Library", status: "active" },
  { id: "prayer-monitoring", label: "Rekap Sholat", status: "active" },
  { id: "virtual-pet", label: "Virtual Pet Monitor", status: "active" },
  { id: "seven-habits", label: "7 KAIH", status: "active" },
  { id: "halo-spentgapa", label: "Laporan Masuk", status: "active" },
  { id: "notifications", label: "Broadcast Notifikasi", status: "active" },
  { id: "teachers", label: "Teachers", status: "active_hidden" },
] as const;

export type GasTab = (typeof gasMenuItems)[number]["id"];

export type GasRecord = {
  id: string;
  name?: string;
  nisn?: string;
  nuptk?: string;
  class?: string;
  kelas?: string;
  className?: string;
  status?: string;
  gender?: string;
  religion?: string;
};

export const defaultGasTab: GasTab = "dashboard";

export const getGasTabLabel = (tab: GasTab) => gasMenuItems.find((item) => item.id === tab)?.label || "GAS";

export const getGasPath = (tab: GasTab, schoolId: string) => {
  if (tab === "students") return `gas/schools/${schoolId}/students`;
  if (tab === "teachers") return `gas/schools/${schoolId}/teachers`;
  return "";
};

export const isGasImplementedTab = (tab: GasTab) => tab === "students" || tab === "teachers" || tab === "attendance" || tab === "presensi-sholat" || tab === "settings" || tab === "attendance-report" || tab === "prayer-monitoring" || tab === "discipline" || tab === "library" || tab === "virtual-pet" || tab === "seven-habits" || tab === "halo-spentgapa" || tab === "notifications";
