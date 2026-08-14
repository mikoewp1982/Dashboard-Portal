"use client";

import { useEffect, useMemo, useState } from "react";
import { MapIcon, Save } from "lucide-react";
import { useGasSettings } from "@/hooks/gas/attendance/useGasSettings";
import { useEduLockSettings } from "@/hooks/edulock/useEduLockSettings";

export function EduLockGeofencingPanel({ schoolId }: { schoolId: string }) {
  const { location: attendanceLocation } = useGasSettings(schoolId);
  const { settings, loading, saving, saveSettings } = useEduLockSettings(schoolId);
  const fallbackLocation = useMemo(
    () => settings.geofence ?? attendanceLocation,
    [attendanceLocation, settings.geofence]
  );
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [radius, setRadius] = useState("");
  const [message, setMessage] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (isDirty) return;
    setLatitude(String(fallbackLocation.latitude ?? ""));
    setLongitude(String(fallbackLocation.longitude ?? ""));
    setRadius(String(fallbackLocation.radius ?? ""));
  }, [fallbackLocation.latitude, fallbackLocation.longitude, fallbackLocation.radius, isDirty]);

  const handleSave = async () => {
    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);
    const parsedRadius = Number(radius);

    if (!Number.isFinite(parsedLatitude) || parsedLatitude < -90 || parsedLatitude > 90) {
      const text = "Latitude harus berupa angka antara -90 dan 90.";
      setMessage(text);
      window.alert(text);
      return;
    }
    if (!Number.isFinite(parsedLongitude) || parsedLongitude < -180 || parsedLongitude > 180) {
      const text = "Longitude harus berupa angka antara -180 dan 180.";
      setMessage(text);
      window.alert(text);
      return;
    }
    if (!Number.isFinite(parsedRadius) || parsedRadius < 50 || parsedRadius > 5000) {
      const text = "Radius EduLock harus antara 50 dan 5.000 meter.";
      setMessage(text);
      window.alert(text);
      return;
    }

    try {
      await saveSettings({
        geofence: {
          latitude: parsedLatitude,
          longitude: parsedLongitude,
          radius: parsedRadius,
        },
      });
      setIsDirty(false);
      const text = `Zona EduLock tersimpan. Radius sekarang ${parsedRadius} meter.`;
      setMessage(text);
      window.alert(text);
    } catch (error) {
      const text = error instanceof Error ? error.message : "Gagal menyimpan zona EduLock.";
      setMessage(text);
      window.alert(text);
    }
  };

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
            Lokasi dan radius pada halaman ini khusus untuk zona EduLock. Perubahan lokasi absensi di GAS
            tidak akan mengubah zona EduLock yang sudah disimpan. Setelah mengubah angka, wajib klik
            tombol Simpan Zona EduLock.
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
                    className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-2.5 text-white outline-none focus:border-indigo-500"
                    value={latitude}
                    onChange={(event) => {
                      setIsDirty(true);
                      setLatitude(event.target.value);
                    }}
                    disabled={loading || saving}
                  />
                </div>
                <div>
                  <input
                    type="number"
                    step="any"
                    placeholder="Longitude (contoh: 106.816666)"
                    className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-2.5 text-white outline-none focus:border-indigo-500"
                    value={longitude}
                    onChange={(event) => {
                      setIsDirty(true);
                      setLongitude(event.target.value);
                    }}
                    disabled={loading || saving}
                  />
                </div>
              </div>
              <div className="text-xs text-slate-400 bg-white/5 p-2 rounded-lg border border-white/5">
                Tentukan titik pusat area sekolah untuk EduLock, bukan titik gerbang absensi.
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold tracking-wide text-slate-300 mb-2">Radius Aman (Meter)</label>
              <input
                type="number"
                min={50}
                max={5000}
                className="w-full max-w-[200px] rounded-xl border border-white/10 bg-slate-900/80 px-4 py-2.5 text-white mb-2 outline-none focus:border-indigo-500"
                value={radius}
                onChange={(event) => {
                  setIsDirty(true);
                  setRadius(event.target.value);
                }}
                disabled={loading || saving}
              />
              <div className="text-xs text-slate-400 bg-white/5 p-2 rounded-lg border border-white/5">
                Minimal 50 meter. Atur agar seluruh area sekolah tercakup tanpa memperluas zona secara berlebihan.
              </div>
            </div>

            {!settings.geofence && (
              <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                Belum ada zona EduLock khusus. Nilai awal diambil dari lokasi absensi dan baru dipisahkan setelah disimpan.
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={loading || saving || !schoolId}
                className="inline-flex items-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Menyimpan..." : "Simpan Zona EduLock"}
              </button>
              {message && <div className="text-sm text-emerald-300">{message}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
