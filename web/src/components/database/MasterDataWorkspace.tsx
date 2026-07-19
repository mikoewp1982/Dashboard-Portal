"use client";

import { useState } from "react";
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
