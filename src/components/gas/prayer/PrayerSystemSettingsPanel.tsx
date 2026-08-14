"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, CalendarDays, Clock3, Layers3, Plus, Save, Settings2, Trash2, Wand2 } from "lucide-react";
import {
  PrayerClassOption,
  PrayerClassSchedule,
  PrayerDateOverride,
  PrayerEligibleGender,
  PrayerTypeConfig,
  PrayerTypeId,
} from "@/types/gasPrayerConfig";

interface Props {
  prayerTypes: PrayerTypeConfig[];
  schedules: PrayerClassSchedule[];
  overrides: PrayerDateOverride[];
  classes: PrayerClassOption[];
  loading?: boolean;
  savePrayerTypes: (types: PrayerTypeConfig[]) => Promise<void>;
  saveSchedules: (schedules: PrayerClassSchedule[]) => Promise<void>;
  saveOverrides: (overrides: PrayerDateOverride[]) => Promise<void>;
}

const DAY_OPTIONS = [
  { value: 1, label: "Senin" },
  { value: 2, label: "Selasa" },
  { value: 3, label: "Rabu" },
  { value: 4, label: "Kamis" },
  { value: 5, label: "Jumat" },
  { value: 6, label: "Sabtu" },
  { value: 0, label: "Minggu" },
];

const SCHEDULABLE_TYPES: PrayerTypeId[] = ["DHUHA", "JUMAT"];

const getGenderLabel = (value: PrayerEligibleGender) => {
  if (value === "male") return "Putra saja";
  if (value === "female") return "Putri saja";
  return "Semua gender";
};

const createScheduleDraft = (): PrayerClassSchedule => ({
  id: `schedule_${Date.now()}`,
  prayerType: "DHUHA",
  classIds: [],
  dayOfWeek: 1,
  startTime: "07:00",
  endTime: "07:30",
  active: true,
  notes: "",
});

const createOverrideDraft = (): PrayerDateOverride => ({
  id: `override_${Date.now()}`,
  date: "",
  prayerType: "DHUHA",
  classIds: [],
  action: "deactivate",
  notes: "",
});

const toYmdDate = (value: Date) => {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const parseYmdDate = (value: string) => {
  const normalized = String(value || "").trim();
  if (!normalized) return null;
  const parsed = new Date(`${normalized}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const addDays = (value: Date, days: number) => {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
};

const ensureNextFriday = (start: Date) => {
  let cursor = new Date(start);
  for (let i = 0; i < 7; i += 1) {
    if (cursor.getDay() === 5) return cursor;
    cursor = addDays(cursor, 1);
  }
  return cursor;
};

const normalizeClassLabel = (value: string) =>
  String(value || "").trim().toUpperCase().replace(/\s+/g, "");

const filterClassIdsByGrade = (items: PrayerClassOption[], grade: 7 | 8 | 9) => {
  const roman = grade === 7 ? "VII" : grade === 8 ? "VIII" : "IX";
  const arabic = String(grade);
  return items
    .filter((item) => {
      const normalized = normalizeClassLabel(item.label);
      return normalized.startsWith(`${roman}-`) || normalized.startsWith(`${roman}.`) || normalized === roman || normalized.startsWith(`${arabic}-`) || normalized.startsWith(`${arabic}.`) || normalized === arabic;
    })
    .map((item) => item.id);
};

function ClassPicker({
  classes,
  selectedIds,
  onChange,
}: {
  classes: PrayerClassOption[];
  selectedIds: string[];
  onChange: (next: string[]) => void;
}) {
  if (classes.length === 0) {
    return <div className="rounded-md border border-dashed border-slate-700/70 px-3 py-2 text-xs text-slate-400">Data kelas belum tersedia.</div>;
  }

  const toggleClass = (classId: string) => {
    onChange(selectedIds.includes(classId) ? selectedIds.filter((item) => item !== classId) : [...selectedIds, classId]);
  };

  const selectGrade = (grade: 7 | 8 | 9) => {
    onChange(filterClassIdsByGrade(classes, grade));
  };

  return (
    <div className="rounded-md border border-slate-700/70 bg-slate-950/40 p-3">
      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-slate-400">Pilih kelas</div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => selectGrade(7)}
            className="rounded-md border border-slate-700 px-2.5 py-1 text-[11px] font-semibold text-slate-200"
          >
            Kelas 7
          </button>
          <button
            type="button"
            onClick={() => selectGrade(8)}
            className="rounded-md border border-slate-700 px-2.5 py-1 text-[11px] font-semibold text-slate-200"
          >
            Kelas 8
          </button>
          <button
            type="button"
            onClick={() => selectGrade(9)}
            className="rounded-md border border-slate-700 px-2.5 py-1 text-[11px] font-semibold text-slate-200"
          >
            Kelas 9
          </button>
          <button
            type="button"
            onClick={() => onChange(classes.map((item) => item.id))}
            className="rounded-md border border-slate-700 px-2.5 py-1 text-[11px] font-semibold text-slate-200"
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => onChange([])}
            className="rounded-md border border-slate-700 px-2.5 py-1 text-[11px] font-semibold text-slate-200"
          >
            Kosongkan
          </button>
          <span className="ml-1 text-[11px] text-slate-400">{selectedIds.length} kelas</span>
        </div>
      </div>
      <div className="grid max-h-36 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
        {classes.map((classItem) => {
          const active = selectedIds.includes(classItem.id);
          return (
            <label
              key={classItem.id}
              className={`flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 text-xs transition ${
                active
                  ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-100"
                  : "border-slate-700/70 bg-slate-900/60 text-slate-300"
              }`}
            >
              <input
                type="checkbox"
                checked={active}
                onChange={() => toggleClass(classItem.id)}
                className="h-3.5 w-3.5 rounded border-slate-500 bg-slate-900 text-emerald-500"
              />
              <span className="truncate">{classItem.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export function PrayerSystemSettingsPanel({
  prayerTypes,
  schedules,
  overrides,
  classes,
  loading = false,
  savePrayerTypes,
  saveSchedules,
  saveOverrides,
}: Props) {
  const [typeState, setTypeState] = useState<PrayerTypeConfig[]>(prayerTypes);
  const [scheduleState, setScheduleState] = useState<PrayerClassSchedule[]>(schedules);
  const [overrideState, setOverrideState] = useState<PrayerDateOverride[]>(overrides);
  const [savingSection, setSavingSection] = useState<"" | "types" | "schedules" | "overrides">("");
  const [rotationStartDate, setRotationStartDate] = useState("");
  const [rotationWeeks, setRotationWeeks] = useState(12);
  const [rotationClassIds, setRotationClassIds] = useState<string[]>([]);
  const [rotationSkipExisting, setRotationSkipExisting] = useState(true);
  const [rotationNotes, setRotationNotes] = useState("Rotasi Jumat otomatis");

  useEffect(() => {
    setTypeState(prayerTypes);
  }, [prayerTypes]);

  useEffect(() => {
    setScheduleState(schedules);
  }, [schedules]);

  useEffect(() => {
    setOverrideState(overrides);
  }, [overrides]);

  useEffect(() => {
    if (rotationClassIds.length === 0 && classes.length > 0) {
      setRotationClassIds(classes.map((item) => item.id));
    }
  }, [classes, rotationClassIds.length]);

  const classLabelMap = useMemo(
    () => new Map(classes.map((item) => [item.id, item.label])),
    [classes]
  );

  const handleSaveTypes = async () => {
    const invalidGlobal = typeState.find(
      (item) => item.scheduleMode === "global_daily" && (!item.startTime || !item.endTime)
    );
    if (invalidGlobal) {
      alert(`Jam khusus untuk ${invalidGlobal.label} belum lengkap. Isi jam mulai dan jam selesai terlebih dahulu.`);
      return;
    }

    setSavingSection("types");
    try {
      await savePrayerTypes(typeState);
      alert("Konfigurasi jenis sholat berhasil disimpan.");
    } catch (error) {
      console.error("Failed to save prayer types", error);
      alert(`Gagal menyimpan jenis sholat. ${(error as Error).message}`);
    } finally {
      setSavingSection("");
    }
  };

  const handleSaveSchedules = async () => {
    const invalid = scheduleState.find((item) => item.classIds.length === 0 || !item.startTime || !item.endTime);
    if (invalid) {
      alert("Setiap jadwal harus memiliki minimal satu kelas dan jam mulai/selesai.");
      return;
    }

    setSavingSection("schedules");
    try {
      await saveSchedules(scheduleState);
      alert("Jadwal sholat per kelas berhasil disimpan.");
    } catch (error) {
      console.error("Failed to save prayer schedules", error);
      alert(`Gagal menyimpan jadwal sholat. ${(error as Error).message}`);
    } finally {
      setSavingSection("");
    }
  };

  const handleSaveOverrides = async () => {
    const invalid = overrideState.find((item) => !item.date || item.classIds.length === 0);
    if (invalid) {
      alert("Setiap override harus memiliki tanggal dan minimal satu kelas.");
      return;
    }

    setSavingSection("overrides");
    try {
      await saveOverrides(overrideState);
      alert("Override tanggal sholat berhasil disimpan.");
    } catch (error) {
      console.error("Failed to save prayer overrides", error);
      alert(`Gagal menyimpan override tanggal. ${(error as Error).message}`);
    } finally {
      setSavingSection("");
    }
  };

  const moveRotationClass = (index: number, direction: -1 | 1) => {
    setRotationClassIds((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      const swapped = next[target];
      next[target] = next[index];
      next[index] = swapped;
      return next;
    });
  };

  const setRotationGrade = (grade: 7 | 8 | 9) => {
    setRotationClassIds(filterClassIdsByGrade(classes, grade));
  };

  const handleGenerateFridayRotation = () => {
    const startDate = parseYmdDate(rotationStartDate);
    if (!startDate) {
      alert("Tanggal mulai rotasi belum diisi.");
      return;
    }
    if (!Number.isFinite(rotationWeeks) || rotationWeeks <= 0) {
      alert("Jumlah minggu harus lebih dari 0.");
      return;
    }
    if (rotationClassIds.length === 0) {
      alert("Urutan kelas rotasi masih kosong.");
      return;
    }

    const firstFriday = ensureNextFriday(startDate);
    if (firstFriday.getTime() !== startDate.getTime()) {
      alert(`Tanggal mulai bukan hari Jumat. Generator memakai Jumat terdekat: ${toYmdDate(firstFriday)}.`);
    }

    const existingKeys = new Set(
      overrideState
        .filter((item) => item.prayerType === "JUMAT")
        .flatMap((item) => item.classIds.map((classId) => `${item.date}|${classId}|${item.action}`))
    );

    const createdAt = Date.now();
    const nextOverrides: PrayerDateOverride[] = [];
    for (let i = 0; i < rotationWeeks; i += 1) {
      const date = toYmdDate(addDays(firstFriday, i * 7));
      const classId = rotationClassIds[i % rotationClassIds.length];
      const key = `${date}|${classId}|activate`;
      if (rotationSkipExisting && existingKeys.has(key)) continue;
      nextOverrides.push({
        id: `rot_jumat_${date}_${classId}_${createdAt}_${i}`,
        date,
        prayerType: "JUMAT",
        classIds: [classId],
        action: "activate",
        notes: rotationNotes,
      });
    }

    if (nextOverrides.length === 0) {
      alert("Tidak ada override baru yang dibuat (semua sudah ada atau input tidak valid).");
      return;
    }

    setOverrideState((prev) => [...nextOverrides, ...prev]);
    alert(`Generator membuat ${nextOverrides.length} override Jumat. Klik "Simpan Override" untuk menyimpan ke database.`);
  };

  if (loading) {
    return <div className="h-64 animate-pulse rounded-lg border border-slate-700/60 bg-slate-900/50" />;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-700/60 bg-slate-900/50 p-5 text-slate-200 shadow">
        <div className="flex items-start gap-3">
          <Settings2 className="mt-0.5 h-5 w-5 text-cyan-400" />
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Konfigurasi Multi-Sholat</h3>
            <p className="mt-1 text-sm text-slate-400">
              Panel ini menyiapkan aturan `prayer_v2` untuk Dzuhur, Dhuha, dan Jumat. Tahap ini fokus ke konfigurasi admin web agar jadwal per kelas dan override tanggal bisa disusun rapi.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-700/60 bg-slate-900/50 p-6 text-slate-200 shadow">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-medium text-slate-100">Jenis Sholat & Aturan Dasar</h3>
            <p className="mt-1 text-sm text-slate-400">Aktifkan jenis sholat yang dipakai dan atur siapa yang masuk ke kewajiban presensi.</p>
          </div>
          <button
            onClick={() => void handleSaveTypes()}
            disabled={savingSection !== "" && savingSection !== "types"}
            className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-blue-600 to-blue-700 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="mr-2 h-4 w-4" />
            {savingSection === "types" ? "Menyimpan..." : "Simpan Jenis"}
          </button>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          {typeState.map((typeItem) => (
            <div key={typeItem.id} className="rounded-xl border border-slate-700/70 bg-slate-950/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-base font-semibold text-slate-100">{typeItem.label}</div>
                  <div className="mt-1 text-xs text-slate-400">{typeItem.description}</div>
                </div>
                <label className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={typeItem.enabled}
                    onChange={(e) =>
                      setTypeState((prev) =>
                        prev.map((item) => (item.id === typeItem.id ? { ...item, enabled: e.target.checked } : item))
                      )
                    }
                    className="h-4 w-4 rounded border-slate-500 bg-slate-900 text-blue-500"
                  />
                  Aktif
                </label>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Mode Jadwal</label>
                  <input
                    value={typeItem.scheduleMode}
                    readOnly
                    className="w-full rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-300"
                  />
                </div>

                  {typeItem.scheduleMode === "global_daily" && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Jam Mulai</label>
                          <div className="relative">
                            <Clock3 className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
                            <input
                              type="time"
                              value={typeItem.startTime || ""}
                              onChange={(e) =>
                                setTypeState((prev) =>
                                  prev.map((item) => (item.id === typeItem.id ? { ...item, startTime: e.target.value } : item))
                                )
                              }
                              className="w-full rounded-md border border-slate-700 bg-slate-900/70 py-2 pl-9 pr-3 text-sm text-slate-200"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Jam Selesai</label>
                          <div className="relative">
                            <Clock3 className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
                            <input
                              type="time"
                              value={typeItem.endTime || ""}
                              onChange={(e) =>
                                setTypeState((prev) =>
                                  prev.map((item) => (item.id === typeItem.id ? { ...item, endTime: e.target.value } : item))
                                )
                              }
                              className="w-full rounded-md border border-slate-700 bg-slate-900/70 py-2 pl-9 pr-3 text-sm text-slate-200"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Hari Wajib</label>
                        <div className="flex flex-wrap gap-2">
                          {DAY_OPTIONS.map((day) => {
                            const isActive = typeItem.activeDays?.includes(day.value) ?? (day.value !== 1);
                            return (
                              <label key={day.value} className="flex items-center gap-1.5 rounded-md border border-slate-700 px-2 py-1 text-[11px] text-slate-300">
                                <input
                                  type="checkbox"
                                  checked={isActive}
                                  onChange={(e) => {
                                    const currentDays = typeItem.activeDays ?? [2, 3, 4, 5, 6, 7];
                                    const nextDays = e.target.checked
                                      ? [...currentDays, day.value]
                                      : currentDays.filter((d) => d !== day.value);
                                    setTypeState((prev) =>
                                      prev.map((item) => (item.id === typeItem.id ? { ...item, activeDays: nextDays } : item))
                                    );
                                  }}
                                  className="h-3 w-3 rounded border-slate-500 bg-slate-900 text-blue-500"
                                />
                                {day.label}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Gender Wajib</label>
                  <select
                    value={typeItem.eligibleGender}
                    onChange={(e) =>
                      setTypeState((prev) =>
                        prev.map((item) =>
                          item.id === typeItem.id ? { ...item, eligibleGender: e.target.value as PrayerEligibleGender } : item
                        )
                      )
                    }
                    className="w-full rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200"
                  >
                    <option value="all">Semua gender</option>
                    <option value="male">Putra</option>
                    <option value="female">Putri</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={typeItem.requireMuslim}
                      onChange={(e) =>
                        setTypeState((prev) =>
                          prev.map((item) => (item.id === typeItem.id ? { ...item, requireMuslim: e.target.checked } : item))
                        )
                      }
                      className="h-4 w-4 rounded border-slate-500 bg-slate-900 text-blue-500"
                    />
                    Wajib Muslim
                  </label>
                  <label className="flex items-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={typeItem.locationRequired}
                      onChange={(e) =>
                        setTypeState((prev) =>
                          prev.map((item) => (item.id === typeItem.id ? { ...item, locationRequired: e.target.checked } : item))
                        )
                      }
                      className="h-4 w-4 rounded border-slate-500 bg-slate-900 text-blue-500"
                    />
                    Pakai lokasi
                  </label>
                </div>

                <div className="rounded-md border border-dashed border-slate-700/70 px-3 py-2 text-xs text-slate-400">
                  Ringkasan: {typeItem.enabled ? "aktif" : "nonaktif"} • {getGenderLabel(typeItem.eligibleGender)} • {typeItem.requireMuslim ? "Muslim wajib" : "tidak dibatasi agama"}
                  {typeItem.scheduleMode === "global_daily" && typeItem.startTime && typeItem.endTime
                    ? ` • jam ${typeItem.startTime}-${typeItem.endTime}`
                    : "."}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-slate-700/60 bg-slate-900/50 p-6 text-slate-200 shadow">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-medium text-slate-100">Jadwal Sholat Per Kelas</h3>
            <p className="mt-1 text-sm text-slate-400">Dipakai untuk Dhuha dan Jumat yang memang tidak berlaku ke semua siswa setiap hari.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setScheduleState((prev) => [...prev, createScheduleDraft()])}
              className="inline-flex items-center justify-center rounded-md border border-slate-600 px-3 py-2 text-sm font-medium text-slate-200"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Jadwal
            </button>
            <button
              onClick={() => void handleSaveSchedules()}
              disabled={savingSection !== "" && savingSection !== "schedules"}
              className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-emerald-600 to-teal-700 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="mr-2 h-4 w-4" />
              {savingSection === "schedules" ? "Menyimpan..." : "Simpan Jadwal"}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {scheduleState.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-700/70 px-4 py-6 text-center text-sm text-slate-400">
              Belum ada jadwal khusus. Tambahkan jadwal untuk Dhuha atau Jumat per kelas.
            </div>
          )}

          {scheduleState.map((item, index) => (
            <div key={item.id} className="rounded-xl border border-slate-700/70 bg-slate-950/40 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                  <Layers3 className="h-4 w-4 text-emerald-400" />
                  Jadwal #{index + 1}
                </div>
                <button
                  onClick={() => setScheduleState((prev) => prev.filter((schedule) => schedule.id !== item.id))}
                  className="inline-flex items-center rounded-md border border-red-500/30 px-2 py-1 text-xs text-red-300"
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  Hapus
                </button>
              </div>

              <div className="grid gap-3 lg:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Jenis Sholat</label>
                  <select
                    value={item.prayerType}
                    onChange={(e) =>
                      setScheduleState((prev) =>
                        prev.map((schedule) =>
                          schedule.id === item.id ? { ...schedule, prayerType: e.target.value as PrayerTypeId } : schedule
                        )
                      )
                    }
                    className="w-full rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200"
                  >
                    {SCHEDULABLE_TYPES.map((typeId) => (
                      <option key={typeId} value={typeId}>
                        {typeState.find((typeItem) => typeItem.id === typeId)?.label || typeId}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Hari</label>
                  <select
                    value={item.dayOfWeek}
                    onChange={(e) =>
                      setScheduleState((prev) =>
                        prev.map((schedule) =>
                          schedule.id === item.id ? { ...schedule, dayOfWeek: Number(e.target.value) } : schedule
                        )
                      )
                    }
                    className="w-full rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200"
                  >
                    {DAY_OPTIONS.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Jam Mulai</label>
                  <div className="relative">
                    <Clock3 className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="time"
                      value={item.startTime}
                      onChange={(e) =>
                        setScheduleState((prev) =>
                          prev.map((schedule) =>
                            schedule.id === item.id ? { ...schedule, startTime: e.target.value } : schedule
                          )
                        )
                      }
                      className="w-full rounded-md border border-slate-700 bg-slate-900/70 py-2 pl-10 pr-3 text-sm text-slate-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Jam Selesai</label>
                  <input
                    type="time"
                    value={item.endTime}
                    onChange={(e) =>
                      setScheduleState((prev) =>
                        prev.map((schedule) =>
                          schedule.id === item.id ? { ...schedule, endTime: e.target.value } : schedule
                        )
                      )
                    }
                    className="w-full rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200"
                  />
                </div>
              </div>

              <div className="mt-3">
                <ClassPicker
                  classes={classes}
                  selectedIds={item.classIds}
                  onChange={(next) =>
                    setScheduleState((prev) =>
                      prev.map((schedule) => (schedule.id === item.id ? { ...schedule, classIds: next } : schedule))
                    )
                  }
                />
              </div>

              <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto]">
                <input
                  type="text"
                  value={item.notes}
                  onChange={(e) =>
                    setScheduleState((prev) =>
                      prev.map((schedule) => (schedule.id === item.id ? { ...schedule, notes: e.target.value } : schedule))
                    )
                  }
                  placeholder="Catatan admin, contoh: bergiliran pekan 1"
                  className="w-full rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200"
                />
                <label className="flex items-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={item.active}
                    onChange={(e) =>
                      setScheduleState((prev) =>
                        prev.map((schedule) => (schedule.id === item.id ? { ...schedule, active: e.target.checked } : schedule))
                      )
                    }
                    className="h-4 w-4 rounded border-slate-500 bg-slate-900 text-emerald-500"
                  />
                  Jadwal aktif
                </label>
              </div>

              <div className="mt-3 text-xs text-slate-400">
                Kelas terpilih: {item.classIds.map((classId) => classLabelMap.get(classId) || classId).join(", ") || "-"}.
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-slate-700/60 bg-slate-900/50 p-6 text-slate-200 shadow">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-medium text-slate-100">Override Tanggal</h3>
            <p className="mt-1 text-sm text-slate-400">Cocok untuk Dhuha model hybrid atau penyesuaian Jumat pada pekan tertentu.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOverrideState((prev) => [...prev, createOverrideDraft()])}
              className="inline-flex items-center justify-center rounded-md border border-slate-600 px-3 py-2 text-sm font-medium text-slate-200"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Override
            </button>
            <button
              onClick={() => void handleSaveOverrides()}
              disabled={savingSection !== "" && savingSection !== "overrides"}
              className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="mr-2 h-4 w-4" />
              {savingSection === "overrides" ? "Menyimpan..." : "Simpan Override"}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-amber-600/30 bg-slate-950/40 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-2">
                <Wand2 className="mt-0.5 h-4 w-4 text-amber-300" />
                <div>
                  <div className="text-sm font-semibold text-slate-100">Generator Rotasi Jumat</div>
                  <div className="mt-1 text-xs text-slate-400">
                    Buat override Jumat otomatis berdasarkan tanggal mulai dan urutan kelas. Hasilnya masuk sebagai draft override dan perlu disimpan lewat tombol "Simpan Override".
                  </div>
                </div>
              </div>
              <button
                onClick={handleGenerateFridayRotation}
                className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-2 text-sm font-semibold text-white"
              >
                <Wand2 className="mr-2 h-4 w-4" />
                Generate
              </button>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Tanggal Jumat Pertama</label>
                <input
                  type="date"
                  value={rotationStartDate}
                  onChange={(e) => setRotationStartDate(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Jumlah Minggu</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={rotationWeeks}
                  onChange={(e) => setRotationWeeks(Number(e.target.value))}
                  className="w-full rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200"
                />
              </div>
              <div className="lg:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Catatan Override</label>
                <input
                  type="text"
                  value={rotationNotes}
                  onChange={(e) => setRotationNotes(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200"
                />
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <label className="flex items-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={rotationSkipExisting}
                  onChange={(e) => setRotationSkipExisting(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-500 bg-slate-900 text-amber-500"
                />
                Lewati tanggal yang sudah punya override Jumat untuk kelas yang sama
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setRotationGrade(7)}
                  className="rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200"
                >
                  Kelas 7
                </button>
                <button
                  onClick={() => setRotationGrade(8)}
                  className="rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200"
                >
                  Kelas 8
                </button>
                <button
                  onClick={() => setRotationGrade(9)}
                  className="rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200"
                >
                  Kelas 9
                </button>
                <button
                  onClick={() => setRotationClassIds(classes.map((item) => item.id))}
                  className="rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200"
                >
                  Isi semua kelas
                </button>
                <button
                  onClick={() => setRotationClassIds([])}
                  className="rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200"
                >
                  Kosongkan
                </button>
              </div>
            </div>

            <div className="mt-3 rounded-md border border-slate-700/70 bg-slate-950/40 p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Urutan Kelas Rotasi</div>
              {rotationClassIds.length === 0 ? (
                <div className="rounded-md border border-dashed border-slate-700/70 px-3 py-2 text-xs text-slate-400">Belum ada kelas dipilih.</div>
              ) : (
                <div className="space-y-2">
                  {rotationClassIds.map((classId, index) => (
                    <div key={`${classId}_${index}`} className="flex items-center justify-between gap-2 rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-100">{classLabelMap.get(classId) || classId}</div>
                        <div className="text-[11px] text-slate-400">Posisi #{index + 1}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveRotationClass(index, -1)}
                          disabled={index === 0}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 text-slate-200 disabled:opacity-40"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => moveRotationClass(index, 1)}
                          disabled={index === rotationClassIds.length - 1}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 text-slate-200 disabled:opacity-40"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setRotationClassIds((prev) => prev.filter((item, i) => !(item === classId && i === index)))}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-500/40 text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {overrideState.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-700/70 px-4 py-6 text-center text-sm text-slate-400">
              Belum ada override tanggal. Gunakan ini untuk mengaktifkan atau menonaktifkan jadwal pada tanggal tertentu.
            </div>
          )}

          {overrideState.map((item, index) => (
            <div key={item.id} className="rounded-xl border border-slate-700/70 bg-slate-950/40 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                  <CalendarDays className="h-4 w-4 text-amber-400" />
                  Override #{index + 1}
                </div>
                <button
                  onClick={() => setOverrideState((prev) => prev.filter((override) => override.id !== item.id))}
                  className="inline-flex items-center rounded-md border border-red-500/30 px-2 py-1 text-xs text-red-300"
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  Hapus
                </button>
              </div>

              <div className="grid gap-3 lg:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Tanggal</label>
                  <input
                    type="date"
                    value={item.date}
                    onChange={(e) =>
                      setOverrideState((prev) =>
                        prev.map((override) => (override.id === item.id ? { ...override, date: e.target.value } : override))
                      )
                    }
                    className="w-full rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Jenis Sholat</label>
                  <select
                    value={item.prayerType}
                    onChange={(e) =>
                      setOverrideState((prev) =>
                        prev.map((override) =>
                          override.id === item.id ? { ...override, prayerType: e.target.value as PrayerTypeId } : override
                        )
                      )
                    }
                    className="w-full rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200"
                  >
                    {SCHEDULABLE_TYPES.map((typeId) => (
                      <option key={typeId} value={typeId}>
                        {typeState.find((typeItem) => typeItem.id === typeId)?.label || typeId}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Aksi</label>
                  <select
                    value={item.action}
                    onChange={(e) =>
                      setOverrideState((prev) =>
                        prev.map((override) =>
                          override.id === item.id
                            ? { ...override, action: e.target.value === "activate" ? "activate" : "deactivate" }
                            : override
                        )
                      )
                    }
                    className="w-full rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200"
                  >
                    <option value="deactivate">Nonaktifkan</option>
                    <option value="activate">Aktifkan paksa</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Ringkasan</label>
                  <div className="rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-300">
                    {item.action === "activate" ? "Aktif paksa" : "Nonaktif"} untuk {typeState.find((typeItem) => typeItem.id === item.prayerType)?.label || item.prayerType}
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <ClassPicker
                  classes={classes}
                  selectedIds={item.classIds}
                  onChange={(next) =>
                    setOverrideState((prev) =>
                      prev.map((override) => (override.id === item.id ? { ...override, classIds: next } : override))
                    )
                  }
                />
              </div>

              <div className="mt-3">
                <input
                  type="text"
                  value={item.notes}
                  onChange={(e) =>
                    setOverrideState((prev) =>
                      prev.map((override) => (override.id === item.id ? { ...override, notes: e.target.value } : override))
                    )
                  }
                  placeholder="Contoh: latihan manasik, pesantren kilat, agenda khusus"
                  className="w-full rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
