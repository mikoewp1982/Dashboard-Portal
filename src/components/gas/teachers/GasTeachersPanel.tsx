"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useGasTeachers } from "@/hooks/gas/useGasTeachers";
import { GasModuleHeader } from "../shared/GasModuleHeader";
import { GasSummaryCards } from "../shared/GasSummaryCards";
import { GasTeachersTable } from "./GasTeachersTable";

type GasTeachersPanelProps = {
  schoolId?: string;
};

export function GasTeachersPanel({ schoolId }: GasTeachersPanelProps) {
  const { data, loading, lastSyncTime } = useGasTeachers(schoolId);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return data.filter((row) => {
      return (
        row.name?.toLowerCase().includes(query) ||
        row.nuptk?.toLowerCase().includes(query) ||
        row.class?.toLowerCase().includes(query)
      );
    });
  }, [data, searchQuery]);

  const activeTeachers = useMemo(
    () => data.filter((row) => String(row.status || "Aktif").toLowerCase() !== "nonaktif").length,
    [data]
  );

  const classCoverage = useMemo(() => new Set(data.map((row) => row.class).filter(Boolean)).size, [data]);
  const withoutClass = useMemo(() => data.filter((row) => !String(row.class || "").trim()).length, [data]);

  return (
    <div className="flex flex-1 flex-col">
      <GasModuleHeader
        title="GAS Teachers"
        description="Workspace operasional guru untuk kebutuhan presensi, penilaian, dan kontrol kelas di modul GAS."
        lastSyncTime={lastSyncTime}
      />

      <div className="flex-1 overflow-auto p-8">
        <GasSummaryCards
          items={[
            { label: "Guru Aktif", value: activeTeachers, hint: "Guru yang siap dipakai modul operasional GAS." },
            { label: "Cakupan Kelas", value: classCoverage, hint: "Jumlah kelas yang sudah punya relasi guru." },
            { label: "Tanpa Kelas", value: withoutClass, hint: "Perlu dirapikan dari DATABASE bila masih kosong." },
          ]}
        />

        <div className="mb-6 rounded-2xl border border-blue-500/15 bg-blue-500/10 p-5 text-sm text-slate-200">
          Fase 1 untuk `Teachers` dipakai sebagai fondasi operasional. Data identitas guru dan wali kelas tetap mengikuti
          modul `DATABASE`, sedangkan GAS membaca hasil akhirnya untuk proses lanjutan.
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Cari nama guru, NUPTK, atau kelas..."
            className="w-full rounded-xl border border-white/10 bg-slate-900/50 py-3 pl-12 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        <GasTeachersTable rows={filteredData} loading={loading} />
      </div>
    </div>
  );
}
