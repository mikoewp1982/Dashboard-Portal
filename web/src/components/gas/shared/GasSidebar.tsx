"use client";

import type { ComponentType } from "react";
import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Clock,
  HeartPulse,
  LayoutDashboard,
  Settings,
  Users,
  Bell,
  Award,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { GasTab } from "./gasConfig";

type GasSidebarProps = {
  activeTab: GasTab;
  onTabChange: (tab: GasTab) => void;
};

const iconMap = {
  dashboard: LayoutDashboard,
  students: Users,
  attendance: Clock,
  "presensi-sholat": Clock,
  settings: Settings,
  "attendance-report": Clock,
  discipline: Award,
  library: BookOpen,
  "prayer-monitoring": Clock,
  "virtual-pet": HeartPulse,
  "seven-habits": Award,
  "halo-spentgapa": AlertTriangle,
  notifications: Bell,
  teachers: Users,
} satisfies Record<GasTab, ComponentType<{ className?: string }>>;

export function GasSidebar({ activeTab, onTabChange }: GasSidebarProps) {
  const { user } = useAuthStore();
  const isPresensiGroupActive = activeTab === "attendance" || activeTab === "presensi-sholat";
  const isPresensiGroupExpanded = useMemo(() => isPresensiGroupActive, [isPresensiGroupActive]);

  const renderMenuButton = (
    tab: GasTab,
    label: string,
    options?: {
      icon?: ComponentType<{ className?: string }>;
      level?: "section" | "normal" | "nested";
      trailingChevron?: boolean;
    }
  ) => {
    const Icon = options?.icon ?? iconMap[tab];
    const isActive = activeTab === tab;
    const level = options?.level ?? "normal";

    return (
      <button
        type="button"
        onClick={() => onTabChange(tab)}
        className={`cursor-pointer flex w-full items-center gap-3 rounded-xl text-left transition-all duration-200 ${
          level === "section"
            ? isActive
              ? "bg-gradient-to-r from-blue-600/30 to-cyan-500/15 border border-blue-500/30 px-4 py-2.5 text-white"
              : "px-4 py-2.5 text-slate-300 hover:bg-white/10 hover:text-white"
            : level === "nested"
              ? isActive
                ? "border border-blue-500/25 bg-blue-600/15 px-3 py-2 text-white"
                : "px-3 py-2 text-slate-300 hover:bg-white/10 hover:text-white"
              : isActive
                ? "border border-blue-500/30 bg-gradient-to-r from-blue-600/20 to-cyan-500/10 px-4 py-2.5 text-white"
                : "px-4 py-2.5 text-slate-300 hover:bg-white/10 hover:text-white"
        }`}
      >
        <Icon className={`${level === "section" ? "h-5 w-5" : "h-4 w-4"} ${isActive ? "text-blue-300" : ""}`} />
        <span className={level === "section" ? "text-sm font-semibold" : "text-sm"}>{label}</span>
        {options?.trailingChevron ? (
          <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
        ) : null}
      </button>
    );
  };

  return (
    <aside className="w-full border-b border-white/10 bg-[#071633] p-3 lg:h-screen lg:w-72 lg:overflow-y-auto lg:border-b-0 lg:border-r lg:border-white/10">
      <div className="rounded-[28px] border border-cyan-500/15 bg-[#081a3c] p-3 shadow-xl backdrop-blur lg:min-h-[calc(100vh-1.5rem)]">
        <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-5 shadow-inner">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="flex items-center justify-center">
              <Image src="/Icon_GAS.png" alt="GAS" width={72} height={72} className="object-contain drop-shadow-md" />
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-tight">
                Gerbang Aplikasi Sekolah
              </div>
              <div className="mt-1 text-xs text-slate-400">Admin Sekolah</div>
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Logged In As:</div>
          <div className="mt-2 text-sm font-semibold text-white">{user?.schoolId || user?.name || "-"}</div>
          <div className="text-xs font-semibold uppercase text-blue-300">Admin Sekolah</div>
          {user?.schoolName ? <div className="mt-1 text-xs text-slate-400">{user.schoolName}</div> : null}
        </div>

        <div className="mt-4">
          <div className="px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">GAS</div>
          <div className="mt-2 space-y-1">
            {renderMenuButton("dashboard", "Beranda GAS", { level: "section" })}
          </div>
        </div>

        <div className="mx-2 my-3 h-px bg-white/10"></div>
        <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Master Data</div>
        <div className="space-y-1">
          {renderMenuButton("students", "Manajemen Siswa", { trailingChevron: true })}

          <div className="mb-1">
            <button
              type="button"
              onClick={() => onTabChange("attendance")}
              className={`cursor-pointer flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm transition-all duration-200 ${
                isPresensiGroupActive
                  ? "border border-blue-500/30 bg-gradient-to-r from-blue-600/20 to-cyan-500/10 text-white"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Clock className={`h-4 w-4 ${isPresensiGroupActive ? "text-blue-300" : ""}`} />
              <span>Manajemen Presensi</span>
              {isPresensiGroupExpanded ? (
                <ChevronDown className="ml-auto h-4 w-4 opacity-60" />
              ) : (
                <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
              )}
            </button>

            {isPresensiGroupExpanded && (
              <div className="mt-1 ml-6 space-y-1 border-l border-white/10 pl-3">
                {renderMenuButton("attendance", "Presensi Sekolah", { level: "nested", trailingChevron: true })}
                {renderMenuButton("presensi-sholat", "Presensi Sholat", { level: "nested", trailingChevron: true })}
              </div>
            )}
          </div>

          {renderMenuButton("settings", "Pengaturan Sistem", { trailingChevron: true })}
        </div>

        <div className="mx-2 my-3 h-px bg-white/10"></div>
        <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Monitoring & Laporan</div>
        <div className="space-y-1">
          {renderMenuButton("attendance-report", "Rekap Kehadiran", { trailingChevron: true })}
          {renderMenuButton("discipline", "Rekap Kedisiplinan", { trailingChevron: true })}
          {renderMenuButton("library", "Monitoring E-Library", { trailingChevron: true })}
          {renderMenuButton("prayer-monitoring", "Rekap Sholat", { trailingChevron: true })}
          {renderMenuButton("virtual-pet", "Virtual Pet Monitor", { trailingChevron: true })}
          {renderMenuButton("seven-habits", "7 KAIH", { trailingChevron: true })}
        </div>

        <div className="mx-2 my-3 h-px bg-white/10"></div>
        <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Layanan Aduan</div>
        <div className="space-y-1">
          {renderMenuButton("halo-spentgapa", "Laporan Masuk", { trailingChevron: true })}
        </div>

        <div className="mx-2 my-3 h-px bg-white/10"></div>
        <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Notifikasi</div>
        <div className="space-y-1">
          {renderMenuButton("notifications", "Broadcast Notifikasi", { trailingChevron: true })}
        </div>
      </div>
    </aside>
  );
}
