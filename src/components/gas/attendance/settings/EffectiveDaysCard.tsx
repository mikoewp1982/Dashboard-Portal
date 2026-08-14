"use client";

import { Check, Clock, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { DailySchedule } from "@/types/gasSettings";

interface Props {
  schedules: DailySchedule[];
  saveSchedules: (schedules: DailySchedule[]) => Promise<void>;
}

export function EffectiveDaysCard({ schedules, saveSchedules }: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [localState, setLocalState] = useState<DailySchedule[]>(schedules);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalState(schedules);
  }, [schedules]);

  if (!schedules || schedules.length === 0) {
    return <div className="rounded-lg bg-slate-900/50 p-6 shadow border border-slate-700/60 animate-pulse h-64"></div>;
  }

  const handleToggle = (dayId: number, current: boolean) => {
    setLocalState((prev) =>
      prev.map((s) => (s.dayId === dayId ? { ...s, isEnabled: !current } : s))
    );
  };

  const handleTimeChange = (dayId: number, field: "entryTime" | "exitTime", value: string) => {
    setLocalState((prev) =>
      prev.map((s) => (s.dayId === dayId ? { ...s, [field]: value } : s))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveSchedules(localState);
      alert("Jadwal efektif berhasil disimpan dan disinkronkan ke Cloud!");
    } catch (error) {
      console.error("Failed to save schedule", error);
      alert("Gagal menyimpan jadwal ke Cloud.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-lg bg-slate-900/50 p-6 shadow border border-slate-700/60 text-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div>
           <h3 className="text-lg font-medium leading-6 text-slate-100">Jadwal & Hari Efektif</h3>
           <p className="text-sm text-slate-400 mt-1">Atur hari masuk sekolah dan jam operasional.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center justify-center rounded-md border border-transparent bg-gradient-to-r from-blue-600 to-blue-700 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="mr-1.5 h-3.5 w-3.5" />
          {isSaving ? "..." : "Simpan"}
        </button>
      </div>
      
      <div className="space-y-3">
        {localState.map((schedule) => (
          <div 
            key={schedule.dayId}
            className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border transition-all ${
              schedule.isEnabled 
                ? "border-blue-700/30 bg-blue-900/30" 
                : "border-slate-700/30 bg-slate-800/30 opacity-75"
            }`}
          >
            <div className="flex items-center gap-3 mb-3 sm:mb-0 min-w-[120px]">
              <button
                onClick={() => handleToggle(schedule.dayId, schedule.isEnabled)}
                className={`flex h-6 w-6 items-center justify-center rounded border transition-colors ${
                  schedule.isEnabled
                    ? "border-blue-500 bg-blue-500 text-white"
                    : "border-slate-600 bg-slate-900"
                }`}
              >
                {schedule.isEnabled && <Check className="h-4 w-4" />}
              </button>
              <span className={`font-medium ${schedule.isEnabled ? "text-slate-100" : "text-slate-400"}`}>
                {schedule.dayName}
              </span>
            </div>

            {schedule.isEnabled && (
              <div className="flex items-center gap-4 flex-1 sm:justify-end">
                <div className="flex items-center gap-2">
                   <Clock className="h-4 w-4 text-slate-400 hidden sm:block" />
                   <div className="flex flex-col">
                      <label className="text-[10px] uppercase text-slate-400 font-semibold">Masuk</label>
                      <input 
                        type="time" 
                        value={schedule.entryTime}
                        onChange={(e) => handleTimeChange(schedule.dayId, 'entryTime', e.target.value)}
                        className="text-sm border-slate-600 rounded-md focus:ring-blue-500 focus:border-blue-500 p-1 bg-slate-900/50 text-slate-100 w-24"
                      />
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   <div className="flex flex-col">
                      <label className="text-[10px] uppercase text-slate-400 font-semibold">Pulang</label>
                      <input 
                        type="time" 
                        value={schedule.exitTime}
                        onChange={(e) => handleTimeChange(schedule.dayId, 'exitTime', e.target.value)}
                        className="text-sm border-slate-600 rounded-md focus:ring-blue-500 focus:border-blue-500 p-1 bg-slate-900/50 text-slate-100 w-24"
                      />
                   </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-slate-400">
        Siswa hanya dapat melakukan absensi pada hari-hari yang diaktifkan. Jam Masuk dan Pulang digunakan untuk perhitungan keterlambatan dan durasi sekolah.
      </p>
    </div>
  );
}
