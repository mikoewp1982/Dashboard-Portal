"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

import { EduLockDashboardPanel } from "./panels/EduLockDashboardPanel";
import { EduLockMonitoringPanel } from "./panels/EduLockMonitoringPanel";
import { EduLockClassesPanel } from "./panels/EduLockClassesPanel";
import { EduLockStudentsPanel } from "./panels/EduLockStudentsPanel";
import { EduLockCodesPanel } from "./panels/EduLockCodesPanel";
import { EduLockGeofencingPanel } from "./panels/EduLockGeofencingPanel";
import { EduLockViolationsPanel } from "./panels/EduLockViolationsPanel";
import { EduLockSettingsPanel } from "./panels/EduLockSettingsPanel";

export type EduLockTab = 
  | "dashboard" 
  | "monitoring" 
  | "classes" 
  | "students" 
  | "codes" 
  | "geofencing" 
  | "violations" 
  | "settings";

export default function EduLockWorkspace() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();

  const activeTab = useMemo<EduLockTab>(() => {
    const candidate = searchParams.get("tab") as EduLockTab | null;
    if (
      candidate === "dashboard" ||
      candidate === "monitoring" ||
      candidate === "classes" ||
      candidate === "students" ||
      candidate === "codes" ||
      candidate === "geofencing" ||
      candidate === "violations" ||
      candidate === "settings"
    ) {
      return candidate;
    }
    return "dashboard";
  }, [searchParams]);

  if (!user) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        Memuat data...
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {activeTab === "dashboard" && <EduLockDashboardPanel schoolId={user.schoolId || ""} />}
      {activeTab === "monitoring" && <EduLockMonitoringPanel schoolId={user.schoolId || ""} />}
      {activeTab === "classes" && <EduLockClassesPanel schoolId={user.schoolId || ""} />}
      {activeTab === "students" && <EduLockStudentsPanel schoolId={user.schoolId || ""} />}
      {activeTab === "codes" && <EduLockCodesPanel schoolId={user.schoolId || ""} />}
      {activeTab === "geofencing" && <EduLockGeofencingPanel schoolId={user.schoolId || ""} />}
      {activeTab === "violations" && <EduLockViolationsPanel schoolId={user.schoolId || ""} />}
      {activeTab === "settings" && <EduLockSettingsPanel schoolId={user.schoolId || ""} />}
    </div>
  );
}
