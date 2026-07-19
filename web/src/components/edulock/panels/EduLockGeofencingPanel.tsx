"use client";

import Link from "next/link";
import { MapIcon, MapPin } from "lucide-react";
import { useGasSettings } from "@/hooks/gas/attendance/useGasSettings";

export function EduLockGeofencingPanel({ schoolId }: { schoolId: string }) {
  const { location: schoolConfig } = useGasSettings(schoolId);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-[#1e293b]/50 overflow-hidden backdrop-blur-xl shadow-xl">
        <div className="px-6 py-4 border-b border-white/10 bg-white/5">
          <h3 className="font-semibold text-white flex items-center">
            <MapIcon className="w-5 h-5 mr-2 text-indigo-400" />
            Konfigurasi Lokasi Sekolah
          </h3>
        </div>
        <div className="p-6">
          <div className="mb-6 rounded-2xl border border-sky-400/20 bg-sky-500/10 px-5 py-4 text-sm text-sky-100 shadow-inner">
            Koordinat zona EduLock mengikuti sumber resmi dari `GAS &gt; Manajemen Presensi &gt; Presensi Sekolah &gt; Pengaturan Sistem`.
            Admin EduLock tidak dapat mengubah titik lokasi secara manual dari halaman ini.
          </div>
          
          <div className="max-w-2xl space-y-6">
            <div>
              <label className="block text-sm font-semibold tracking-wide text-slate-300 mb-2">Koordinat Sekolah (Latitude, Longitude)</label>
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div>
                  <input
                    type="number"
                    step="any"
                    placeholder="Latitude (contoh: -6.200000)"
                    className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-2.5 text-white opacity-80 cursor-not-allowed"
                    value={String(schoolConfig.latitude ?? "")}
                    readOnly
                    disabled
                  />
                </div>
                <div>
                  <input
                    type="number"
                    step="any"
                    placeholder="Longitude (contoh: 106.816666)"
                    className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-2.5 text-white opacity-80 cursor-not-allowed"
                    value={String(schoolConfig.longitude ?? "")}
                    readOnly
                    disabled
                  />
                </div>
              </div>
              <div className="text-xs text-slate-400 bg-white/5 p-2 rounded-lg border border-white/5">
                Data ini dibaca otomatis dari pengaturan lokasi presensi di GAS.
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold tracking-wide text-slate-300 mb-2">Radius Aman (Meter)</label>
              <input
                type="number"
                className="w-full max-w-[200px] rounded-xl border border-white/10 bg-slate-900/80 px-4 py-2.5 text-white mb-2 opacity-80 cursor-not-allowed"
                value={String(schoolConfig.radius ?? "")}
                readOnly
                disabled
              />
              <div className="text-xs text-slate-400 bg-white/5 p-2 rounded-lg border border-white/5">
                Radius aman mengikuti nilai radius absensi sekolah di GAS agar tidak terjadi mismatch operasional.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
