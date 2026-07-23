"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { GasSidebar } from "./shared/GasSidebar";
import { defaultGasTab, GasTab, isGasImplementedTab } from "./shared/gasConfig";
import { GasStudentsPanel } from "./students/GasStudentsPanel";
import { GasTeachersPanel } from "./teachers/GasTeachersPanel";
import { GasAttendancePanel } from "./attendance/GasAttendancePanel";
import { GasPrayerPanel } from "./prayer/GasPrayerPanel";
import { GasSettingsPanel } from "./settings/GasSettingsPanel";
import GasAttendanceReportPanel from "./attendance/GasAttendanceReportPanel";
import GasPrayerReportPanel from "./prayer/GasPrayerReportPanel";
import { GasDisciplinePanel } from "./discipline/GasDisciplinePanel";
import { GasLibraryPanel } from "./library/GasLibraryPanel";
import { GasPetPanel } from "./virtual-pet/GasPetPanel";
import { Gas7HabitsPanel } from "./seven-habits/Gas7HabitsPanel";
import { GasHaloSpentgapaPanel } from "./halo-spentgapa/GasHaloSpentgapaPanel";
import { GasNotificationsPanel } from "./notifications/GasNotificationsPanel";
import { GasComingSoonPanel } from "./GasComingSoonPanel";
import { GasDashboardPanel } from "./dashboard/GasDashboardPanel";
import { ErrorBoundary } from "./discipline/ErrorBoundary";

export default function GasWorkspace() {
  const { user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTab = useMemo<GasTab>(() => {
    const candidate = searchParams.get("tab") as GasTab | null;
    if (
      candidate === "dashboard" ||
      candidate === "students" ||
      candidate === "teachers" ||
      candidate === "attendance" ||
      candidate === "presensi-sholat" ||
      candidate === "settings" ||
      candidate === "attendance-report" ||
      candidate === "discipline" ||
      candidate === "prayer-monitoring" ||
      candidate === "virtual-pet" ||
      candidate === "library" ||
      candidate === "halo-spentgapa" ||
      candidate === "seven-habits" ||
      candidate === "notifications"
    ) {
      return candidate;
    }
    return defaultGasTab;
  }, [searchParams]);

  const handleTabChange = (tab: GasTab) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("tab", tab);
    router.replace(`${pathname}?${next.toString()}`);
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0b1228] p-6 text-slate-400">
        Memuat data atau akses ditolak...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0b1228] text-slate-200 lg:h-screen lg:overflow-hidden lg:flex-row">
      <GasSidebar activeTab={activeTab} onTabChange={handleTabChange} />

      <div className="flex flex-1 flex-col lg:min-h-0">
        {activeTab === "dashboard" && <GasDashboardPanel schoolId={user.schoolId || ""} />}
        {activeTab === "students" && <GasStudentsPanel schoolId={user.schoolId} />}
        {activeTab === "teachers" && <GasTeachersPanel schoolId={user.schoolId} />}
        {activeTab === "attendance" && <GasAttendancePanel schoolId={user.schoolId || ""} />}
        {activeTab === "presensi-sholat" && <GasPrayerPanel schoolId={user.schoolId || ""} />}
        {activeTab === "settings" && <GasSettingsPanel schoolId={user.schoolId || ""} />}
        {activeTab === "attendance-report" && <GasAttendanceReportPanel schoolId={user.schoolId || ""} />}
        {activeTab === "prayer-monitoring" && <GasPrayerReportPanel schoolId={user.schoolId || ""} />}
        {activeTab === "discipline" && (
          <ErrorBoundary>
            <GasDisciplinePanel schoolId={user.schoolId || ""} />
          </ErrorBoundary>
        )}
        {activeTab === "library" && <GasLibraryPanel schoolId={user.schoolId || ""} />}
        {activeTab === "virtual-pet" && <GasPetPanel schoolId={user.schoolId || ""} />}
        {activeTab === "seven-habits" && <Gas7HabitsPanel schoolId={user.schoolId || ""} />}
        {activeTab === "halo-spentgapa" && <GasHaloSpentgapaPanel schoolId={user.schoolId || ""} />}
        {activeTab === "notifications" && <GasNotificationsPanel schoolId={user.schoolId || ""} />}
        {!isGasImplementedTab(activeTab) && <GasComingSoonPanel activeTab={activeTab} />}
      </div>
    </div>
  );
}
