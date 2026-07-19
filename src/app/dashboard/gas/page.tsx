"use client";

import { useAuthStore } from "@/store/useAuthStore";
import GasWorkspace from "@/components/gas/GasWorkspace";

export default function AdminGasPage() {
  const { user } = useAuthStore();

  if (!user || user.role !== "admin") {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0b1228] p-6 text-slate-400">
        Memuat data atau akses ditolak...
      </div>
    );
  }

  return <GasWorkspace />;
}
