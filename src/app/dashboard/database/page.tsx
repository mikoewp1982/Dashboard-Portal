"use client";

import { useAuthStore } from "@/store/useAuthStore";
import MasterDataWorkspace from "@/components/database/MasterDataWorkspace";

export default function AdminDatabasePage() {
  const { user } = useAuthStore();

  if (!user || user.role !== "admin") {
    return (
      <div className="flex h-screen items-center justify-center p-6 text-slate-400 bg-[#0b1228]">
        Memuat data atau akses ditolak...
      </div>
    );
  }

  return <MasterDataWorkspace />;
}
