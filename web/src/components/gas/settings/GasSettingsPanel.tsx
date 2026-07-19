"use client";

import { useState } from "react";
import Link from "next/link";
import { useGasSystemSettings } from "@/hooks/gas/settings/useGasSystemSettings";
import { School, Calendar } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { SchoolIdentityCard } from "./SchoolIdentityCard";
import { AcademicYearCard } from "./AcademicYearCard";

interface Props {
  schoolId: string;
}

export function GasSettingsPanel({ schoolId }: Props) {
  const { 
    identity, 
    academicYears, 
    activeYearId, 
    loading,
    saveIdentity, 
    addAcademicYear, 
    removeAcademicYear, 
    setActiveYear 
  } = useGasSystemSettings(schoolId);
  
  const { user } = useAuthStore();
  const canManage = user?.role === "admin" || user?.role === "super_admin";

  const [activeTab, setActiveTab] = useState<"identity" | "academic">("identity");

  if (loading) {
    return (
      <div className="flex-1 flex h-full items-center justify-center text-slate-400 p-6">
        Memuat pengaturan sistem...
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6 text-slate-200">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Pengaturan Sistem</h1>
            <p className="mt-1 text-sm text-slate-400">
              Konfigurasi master data sekolah dan tahun ajaran akademik.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
          >
            Kembali ke Dashboard Satu Pintu
          </Link>
        </div>

        <div className="mt-6 border-b border-slate-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("identity")}
              className={`${
                activeTab === "identity"
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-slate-400 hover:border-slate-600 hover:text-slate-300"
              } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex items-center gap-2 cursor-pointer transition-colors`}
            >
              <School className="h-4 w-4" />
              Identitas Sekolah
            </button>
            <button
              onClick={() => setActiveTab("academic")}
              className={`${
                activeTab === "academic"
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-slate-400 hover:border-slate-600 hover:text-slate-300"
              } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex items-center gap-2 cursor-pointer transition-colors`}
            >
              <Calendar className="h-4 w-4" />
              Tahun Ajaran
            </button>
          </nav>
        </div>
      </div>

      <div className="mt-6">
        {activeTab === "identity" && (
          <SchoolIdentityCard 
            identity={identity} 
            saveIdentity={saveIdentity} 
            canManage={canManage} 
          />
        )}

        {activeTab === "academic" && (
          <AcademicYearCard 
            academicYears={academicYears} 
            activeYearId={activeYearId} 
            addAcademicYear={addAcademicYear} 
            removeAcademicYear={removeAcademicYear} 
            setActiveYear={setActiveYear} 
            canManage={canManage} 
          />
        )}
      </div>
    </div>
  );
}
