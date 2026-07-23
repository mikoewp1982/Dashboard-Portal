"use client";

import { useState, useEffect } from "react";
import { Settings, ShieldAlert, Clock, Activity, Save } from "lucide-react";
import { useGasSettings } from "@/hooks/gas/attendance/useGasSettings";
import { useEduLockUninstallAccess } from "@/hooks/edulock/useEduLockUninstallAccess";
import { useEduLockSettings } from "@/hooks/edulock/useEduLockSettings";

function hasActiveUninstallCode(access: { code: string; expiresAt: number | null } | null) {
  if (!access?.code || !access.expiresAt) return false;
  return access.expiresAt > Date.now();
}

function getHolidayNote(holiday: unknown) {
  if (!holiday || typeof holiday !== "object") {
    return "-";
  }

  const note = (holiday as { note?: unknown }).note;
  return typeof note === "string" && note.trim() ? note.trim() : "-";
}

export function EduLockSettingsPanel({ schoolId }: { schoolId: string }) {
  const { schedules, holidays, location } = useGasSettings(schoolId);
  const { access: uninstallAccess, loading: uninstallLoading } = useEduLockUninstallAccess(schoolId);
  const hasUninstallCode = hasActiveUninstallCode(uninstallAccess);

  const { settings, loading: settingsLoading, saving, saveSettings } = useEduLockSettings(schoolId);
  const [gpsWarnMinutes, setGpsWarnMinutes] = useState(2);
  const [gpsLockMinutes, setGpsLockMinutes] = useState(5);

  useEffect(() => {
    setGpsWarnMinutes(settings.gpsWarnMinutes);
    setGpsLockMinutes(settings.gpsLockMinutes);
  }, [settings.gpsWarnMinutes, settings.gpsLockMinutes]);

  const [holidayDateInput, setHolidayDateInput] = useState("");
  const [holidayNoteInput, setHolidayNoteInput] = useState("");
  
  const handleSaveWeekdaySchedule = () => {
    window.alert("Jadwal EduLock mengikuti Pengaturan Sistem GAS Presensi. Ubah jam efektif dari halaman GAS.");
  };

  const handleAddHoliday = () => {
    window.alert("Mock: Menambahkan hari libur");
  };

  const handleDeleteHoliday = (date: string) => {
    window.alert(`Mock: Menghapus hari libur ${date}`);
  };

  const handleSaveGpsPolicy = () => {
    window.alert("Mock: Menyimpan Kebijakan GPS");
  };

  return (
    <>
      <div className="space-y-6">
        <div className="rounded-2xl border border-white/10 bg-[#1e293b]/50 overflow-hidden backdrop-blur-xl shadow-xl">
          <div className="px-6 py-4 border-b border-white/10 bg-white/5">
            <h3 className="font-semibold text-white flex items-center">
              <Settings className="w-5 h-5 mr-2 text-indigo-400" />
              Pengaturan Sistem & Keamanan
            </h3>
          </div>
          
          <div className="p-6 space-y-8">
            <div>
              <h4 className="text-base font-medium text-white mb-4 flex items-center">
                <Clock className="w-4 h-4 mr-2 text-slate-400" />
                Jam Operasional Sekolah
              </h4>

              <div className="mb-6 bg-indigo-500/10 p-5 rounded-2xl border border-indigo-500/20 flex items-center justify-between">
                <div>
                  <h5 className="font-semibold text-white flex items-center">
                    <ShieldAlert className="w-4 h-4 mr-2 text-indigo-400" />
                    Status Proteksi Sekolah (Master Switch)
                  </h5>
                  <p className="text-sm text-indigo-200 mt-1">
                    Matikan tombol ini untuk Mode Senyap (Fase Instalasi). Saat MATI, aplikasi tidak akan mengunci HP siswa.
                    <br />
                    Nyalakan saat semua siswa sudah menginstall aplikasi.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.is_active_protection}
                    onChange={(e) => {
                      void saveSettings({ is_active_protection: e.target.checked });
                    }}
                    disabled={settingsLoading || saving}
                  />
                  <div className="w-14 h-7 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600 border border-white/10"></div>
                </label>
              </div>

              <div className="mb-6 bg-fuchsia-500/10 p-5 rounded-2xl border border-fuchsia-500/20 flex items-center justify-between">
                <div>
                  <h5 className="font-semibold text-white flex items-center">
                    <Activity className="w-4 h-4 mr-2 text-fuchsia-400" />
                    Mode Acara / Libur Sekolah
                  </h5>
                  <p className="text-sm text-fuchsia-200 mt-1">
                    Aktifkan mode ini saat acara sekolah agar siswa bisa menggunakan HP bebas tanpa monitoring.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.is_holiday_mode}
                    onChange={(e) => {
                      void saveSettings({ is_holiday_mode: e.target.checked });
                    }}
                    disabled={settingsLoading || saving}
                  />
                  <div className="w-14 h-7 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-fuchsia-600 border border-white/10"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm font-semibold text-white">Jadwal & Hari Efektif</div>
                      <div className="text-xs text-slate-400 mt-1">Jadwal ini mengikuti Pengaturan Sistem GAS Presensi agar jam masuk/pulang siswa selalu sinkron.</div>
                    </div>
                    <button type="button" onClick={handleSaveWeekdaySchedule} disabled={settingsLoading} className="btn-primary px-4 py-2 text-sm bg-indigo-600 rounded-xl font-semibold hover:bg-indigo-500 transition-colors flex items-center">
                      <Save className="w-4 h-4 mr-2" />
                      Info
                    </button>
                  </div>

                  <div className="space-y-2">
                    {schedules.map((d) => (
                        <div key={d.dayId} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <input
                              type="checkbox"
                              checked={d.isEnabled}
                              disabled={true} 
                              className="h-4 w-4 accent-indigo-500 rounded cursor-not-allowed"
                              readOnly
                            />
                            <div className="font-medium text-white">{d.dayName}</div>
                          </div>
                          <div className="grid shrink-0 grid-cols-[34px_96px_42px_96px] items-center gap-2">
                            <div className="text-[10px] text-slate-400 uppercase tracking-wider text-right">Masuk</div>
                            <input
                              type="time"
                              value={d.entryTime}
                              disabled={true}
                              readOnly
                              className={`rounded-lg border border-white/10 bg-slate-950/50 py-1.5 px-2 text-white w-24 text-sm ${d.isEnabled ? "" : "opacity-60"} cursor-not-allowed`}
                            />
                            <div className="text-[10px] text-slate-400 uppercase tracking-wider text-right">Pulang</div>
                            <input
                              type="time"
                              value={d.exitTime}
                              disabled={true}
                              readOnly
                              className={`rounded-lg border border-white/10 bg-slate-950/50 py-1.5 px-2 text-white w-24 text-sm ${d.isEnabled ? "" : "opacity-60"} cursor-not-allowed`}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                  
                  <div className="text-xs text-slate-400 mt-4 bg-white/5 border border-white/10 p-3 rounded-xl">
                    Sumber pengaturan: GAS Presensi. EduLock membaca hasil sinkronisasi agar tidak terjadi mismatch jam operasional.
                  </div>
                </div>
                
                <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 lg:w-[340px] xl:w-[360px] lg:justify-self-end">
                  <div className="text-sm font-semibold text-white">Hari Libur & Tanggal Merah</div>
                  <div className="text-xs text-slate-400 mt-1 bg-white/5 p-2 rounded-lg border border-white/5">Hari libur mengikuti GAS Presensi agar aturan bebas EduLock konsisten.</div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end mt-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Tanggal</label>
                      <input type="date" value={holidayDateInput} onChange={(e) => setHolidayDateInput(e.target.value)} className="w-full rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-white cursor-not-allowed opacity-80" disabled={true} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-slate-300 mb-1">Keterangan</label>
                      <input
                        type="text"
                        value={holidayNoteInput}
                        onChange={(e) => setHolidayNoteInput(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-white cursor-not-allowed opacity-80"
                        placeholder="Contoh: Hari Kemerdekaan"
                        disabled={true}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button type="button" onClick={handleAddHoliday} disabled={true} className="bg-indigo-600/50 text-white px-5 py-2 text-sm rounded-lg font-semibold cursor-not-allowed opacity-80 transition-colors flex items-center">
                      <span className="text-lg mr-1">+</span> Info
                    </button>
                  </div>

                  <div className="mt-5">
                    {holidays.length === 0 ? (
                      <div className="text-center text-slate-500 text-sm italic py-8 border border-dashed border-white/10 rounded-xl bg-white/5">Belum ada data hari libur</div>
                    ) : (
                      <div className="divide-y divide-white/10 rounded-xl border border-white/10 bg-white/5">
                        {holidays.map((h) => (
                          <div key={h.id} className="flex items-center justify-between gap-4 px-4 py-3">
                            <div>
                              <div className="text-sm font-semibold text-white">{h.date}</div>
                              <div className="text-xs text-slate-300">{getHolidayNote(h)}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteHoliday(h.date)}
                              disabled={true}
                              className="p-2 text-rose-300 hover:bg-white/10 rounded-lg transition-colors cursor-not-allowed opacity-50"
                              title="Kelola dari GAS Presensi"
                            >
                              <span className="text-xs">Hapus</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="md:col-span-2 rounded-2xl border border-white/10 bg-slate-900/50 p-6 shadow-inner">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-white">Kebijakan GPS Mati</div>
                      <div className="text-xs text-slate-400 mt-1">
                        Berlaku saat jam sekolah dan siswa terdeteksi di zona sekolah. Set 0 menit untuk lockdown langsung.
                      </div>
                    </div>
                    <button type="button" disabled={saving || settingsLoading} onClick={() => void saveSettings({ gpsWarnMinutes, gpsLockMinutes })} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 text-sm rounded-xl font-semibold whitespace-nowrap transition flex items-center">
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? "Menyimpan..." : "Simpan"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                      <label className="block text-sm font-medium text-slate-300 mb-2">Peringatan (menit)</label>
                      <input
                        type="number"
                        min={0}
                        value={String(gpsWarnMinutes)}
                        onChange={(e) => setGpsWarnMinutes(Math.max(0, Number(e.target.value || 0)))}
                        className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-2 text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                      <label className="block text-sm font-medium text-slate-300 mb-2">Lockdown (menit)</label>
                      <input
                        type="number"
                        min={0}
                        value={String(gpsLockMinutes)}
                        onChange={(e) => setGpsLockMinutes(Math.max(0, Number(e.target.value || 0)))}
                        className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-2 text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Latitude</label>
                    <input value={String(location?.latitude || "")} readOnly disabled className="w-full rounded-lg border border-white/10 bg-slate-950/50 px-4 py-2.5 text-white opacity-80 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Longitude</label>
                    <input value={String(location?.longitude || "")} readOnly disabled className="w-full rounded-lg border border-white/10 bg-slate-950/50 px-4 py-2.5 text-white opacity-80 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Radius (meter)</label>
                    <input
                      type="number"
                      value={String(location?.radius ?? 0)}
                      readOnly
                      disabled
                      className="w-full rounded-lg border border-white/10 bg-slate-950/50 px-4 py-2.5 text-white opacity-80 cursor-not-allowed"
                    />
                  </div>
                  <div className="w-full rounded-xl border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-200 mt-2">
                    Koordinat zona mengikuti GAS Presensi Sekolah dan tidak dapat diedit dari workspace EduLock.
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 flex flex-col justify-between">
                  <div>
                    <h5 className="font-semibold text-white mb-2 text-lg">Kode Uninstall Darurat (Offline)</h5>
                    <p className="text-sm text-slate-300 bg-white/5 p-3 rounded-lg border border-white/5">
                      Kode ini bersifat <strong>Darurat</strong> (Offline). Gunakan HANYA jika HP siswa kehabisan kuota atau bermasalah koneksi. Untuk penghapusan biasa, gunakan Tombol Uninstall di menu Data Siswa.
                    </p>
                    <div className="mt-6 flex flex-col items-center justify-center border border-dashed border-white/20 rounded-xl p-6 bg-slate-950/30">
                      <div className="text-3xl font-extrabold tracking-widest text-indigo-400 drop-shadow-md">
                        {uninstallLoading
                          ? "..."
                          : hasUninstallCode
                          ? uninstallAccess?.code || "-"
                          : "-"}
                      </div>
                      <div className="text-xs text-slate-400 mt-3 text-center">
                        {uninstallLoading
                          ? "Memuat kode uninstall dari panel Super Admin..."
                          : hasUninstallCode
                          ? `Berlaku sampai ${new Date(uninstallAccess?.expiresAt || 0).toLocaleString("id-ID")}`
                          : "Belum ada kode aktif. Minta Super Admin untuk membuat Kode Uninstall sekolah."}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
