"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { DatabaseSidebar } from "./shared/DatabaseSidebar";
import { DatabaseTab } from "./shared/databaseConfig";
import { OverviewPanel } from "./overview/OverviewPanel";
import { StudentsPanel } from "./students/StudentsPanel";
import { TeachersPanel } from "./teachers/TeachersPanel";
import { StaffPanel } from "./staff/StaffPanel";
import { ClassesPanel } from "./classes/ClassesPanel";

export default function MasterDataWorkspace() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<DatabaseTab>("Siswa");

  useEffect(() => {
    // #region debug-point B:database-workspace-render
    fetch("http://127.0.0.1:7777/event", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: "admin-kick-gate", runId: "pre-fix", hypothesisId: "B", location: "MasterDataWorkspace.tsx", msg: "[DEBUG] database workspace effect", data: { hasUser: !!user, role: user?.role ?? null, schoolId: user?.schoolId ?? null, activeTab, pathname: typeof window !== "undefined" ? window.location.pathname : null }, ts: Date.now() }) }).catch(() => {});
    // #endregion
  }, [user, activeTab]);

  if (!user || user.role !== "admin") {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0b1228] p-6 text-slate-400">
        Memuat data atau akses ditolak...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0b1228] text-slate-200">
      <DatabaseSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex flex-1 flex-col">
        {activeTab === "Dashboard Overview" && <OverviewPanel schoolId={user.schoolId} />}
        {activeTab === "Siswa" && <StudentsPanel schoolId={user.schoolId} />}
        {activeTab === "Guru/Wali Kelas" && <TeachersPanel schoolId={user.schoolId} />}
        {activeTab === "Petugas OSIS" && <StaffPanel schoolId={user.schoolId} />}
        {activeTab === "Kelas Paralel" && <ClassesPanel schoolId={user.schoolId} />}
      </div>
    </div>
  );
}
