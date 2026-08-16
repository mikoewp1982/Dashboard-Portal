"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { LibraryTask } from "@/types/library";

interface LibraryTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: any[];
  onSave: (task: Omit<LibraryTask, "id">) => Promise<void>;
  userName: string;
}

function getDisplayName(cls: any): string {
  return (
    cls?.name ||
    cls?.className ||
    cls?.displayName ||
    cls?.label ||
    cls?.class_name ||
    (typeof cls === "string" ? cls : "") ||
    "Kelas"
  ).toString().trim();
}

function fromDatetimeLocal(value: string): number | undefined {
  if (!value) return undefined;
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? t : undefined;
}

export function LibraryTaskModal({ isOpen, onClose, classes, onSave, userName }: LibraryTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [poin, setPoin] = useState("30");
  const [durasi, setDurasi] = useState("45");
  const [startAtLocal, setStartAtLocal] = useState("");
  const [endAtLocal, setEndAtLocal] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [showClassList, setShowClassList] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedClassIds([]);
    setShowClassList(false);
    setStartAtLocal("");
    setEndAtLocal("");
  }, [isOpen]);

  if (!isOpen) return null;

  const classesList = Array.isArray(classes) ? classes : [];
  const allClassEntries = classesList.map((c) => {
    const id = (c?.id || c?.uuid || c?.classId || getDisplayName(c)).toString().trim();
    const label = getDisplayName(c);
    return { id, label, raw: c };
  });

  const allSelected = allClassEntries.length > 0 && selectedClassIds.length === allClassEntries.length;
  const someSelected = selectedClassIds.length > 0 && selectedClassIds.length < allClassEntries.length;
  const selectedEntries = allClassEntries.filter((c) => selectedClassIds.includes(c.id));

  const friendlyClassName =
    allClassEntries.length === 0
      ? "Semua Kelas"
      : selectedClassIds.length === 0
        ? "Semua Kelas"
        : selectedClassIds.length === allClassEntries.length
          ? "Semua Kelas"
          : selectedClassIds.length === 1
            ? selectedEntries[0]?.label || "Semua Kelas"
            : `${selectedClassIds.length} Kelas (${selectedEntries
                .map((e) => e.label)
                .join(", ")})`;

  const selectedClassList =
    allClassEntries.length === 0 || selectedClassIds.length === 0 || allSelected
      ? ["Semua Kelas"]
      : selectedEntries.map((e) => e.label);

  const toggleClass = (id: string) => {
    setSelectedClassIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedClassIds([]);
    } else {
      setSelectedClassIds(allClassEntries.map((c) => c.id));
    }
  };

  const startAt = fromDatetimeLocal(startAtLocal);
  const endAt = fromDatetimeLocal(endAtLocal);
  const missingSchedule = startAt === undefined || endAt === undefined;
  const invalidTimeRange =
    startAt !== undefined && endAt !== undefined && endAt <= startAt;
  const scheduleBlocked = missingSchedule || invalidTimeRange;

  const handleSubmit = async (status: "ACTIVE" | "CLOSED") => {
    if (!title) return;
    if (scheduleBlocked || startAt === undefined || endAt === undefined) return;

    setIsSubmitting(true);
    try {
      await onSave({
        title,
        description,
        className: friendlyClassName,
        classList: selectedClassList,
        assignedBy: "admin",
        assignedByName: userName,
        status,
        points: Number(poin) || 30,
        durationMinutes: Number(durasi) || 45,
        startAt,
        endAt,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } finally {
      setIsSubmitting(false);
    }

    onClose();

    setTitle("");
    setDescription("");
    setPoin("30");
    setDurasi("45");
    setStartAtLocal("");
    setEndAtLocal("");
    setSelectedClassIds([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[560px] max-h-[92vh] rounded-xl border border-slate-700 bg-[#0f172a] shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-start justify-between p-6 pb-2 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-100">Buat Tugas Literasi</h2>
            <p className="text-xs text-slate-400 mt-1">
              Tugas ini akan masuk ke Lentera Digital siswa sesuai sekolah yang sedang login.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 pt-4 space-y-4 overflow-y-auto">
          <div className="bg-slate-800/50 border border-slate-700 rounded-md p-3">
            <p className="text-xs text-slate-300">
              Default sekolah: <span className="font-semibold text-slate-200">30 poin</span>,{" "}
              <span className="font-semibold text-slate-200">45 menit</span>. Jika tidak memilih kelas
              tertentu, tugas otomatis dikirim ke{" "}
              <span className="font-semibold text-slate-200">Semua Kelas</span>.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Judul Tugas</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Membaca Cerpen"
                className="w-full px-3 py-2 bg-[#0b1221] border border-slate-700 rounded-md text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Deskripsi / Instruksi</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan detail tugas..."
                className="w-full px-3 py-2 bg-[#0b1221] border border-slate-700 rounded-md text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 h-24 resize-none"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Kirim ke Kelas</label>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-slate-400 mr-1">
                    Terpilih: <span className="font-semibold text-slate-200">{selectedEntries.length || (allClassEntries.length ? allClassEntries.length : 0)}</span> / {allClassEntries.length}
                  </span>
                  {allClassEntries.length > 1 && (
                    <button
                      type="button"
                      onClick={toggleAll}
                      className="text-[11px] font-semibold px-2 py-0.5 rounded border border-slate-700 text-slate-300 hover:bg-slate-800 transition"
                    >
                      {allSelected ? "Kosongkan" : "Pilih Semua"}
                    </button>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowClassList((v) => !v)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-[#0b1221] border border-slate-700 rounded-md text-left hover:border-blue-500/60 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <div className="flex-1 min-w-0">
                  {selectedEntries.length === 0 || allSelected ? (
                    <p className="text-sm font-medium text-slate-200">
                      {allClassEntries.length ? "✅ Semua Kelas (Terpilih Semua)" : "Semua Kelas"}
                    </p>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-slate-200 truncate">
                        {selectedEntries.map((e) => e.label).join(", ")}
                      </p>
                    </div>
                  )}
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Click untuk memilih kelas tertentu
                  </p>
                </div>
                <Check
                  className={`h-4 w-4 shrink-0 transition ${
                    allSelected ? "text-green-400" : someSelected ? "text-amber-400" : "text-slate-600"
                  }`}
                />
              </button>

              {showClassList && allClassEntries.length > 0 && (
                <div className="mt-2 border border-slate-700 rounded-md bg-[#0b1221] divide-y divide-slate-800 max-h-60 overflow-y-auto">
                  {allClassEntries.map((c) => {
                    const isOn = selectedClassIds.includes(c.id) || (allSelected && selectedClassIds.length === 0);
                    const active = selectedClassIds.includes(c.id) || (allSelected && selectedClassIds.length === 0);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleClass(c.id)}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-slate-800/60 transition text-left"
                      >
                        <span className={`text-sm ${active ? "text-white" : "text-slate-300"}`}>{c.label}</span>
                        <span
                          className={`inline-flex items-center justify-center h-5 w-5 rounded border ${
                            active
                              ? "bg-blue-600 border-blue-500 text-white"
                              : "border-slate-600 text-transparent"
                          }`}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Jadwal Tugas</label>
                <span className="text-[11px] text-slate-400">Wajib — batas waktu siswa mengerjakan</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-400">Mulai</label>
                  <input
                    type="datetime-local"
                    value={startAtLocal}
                    onChange={(e) => setStartAtLocal(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#0b1221] border border-slate-700 rounded-md text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-400">Selesai</label>
                  <input
                    type="datetime-local"
                    value={endAtLocal}
                    onChange={(e) => setEndAtLocal(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#0b1221] border border-slate-700 rounded-md text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              {missingSchedule && (
                <p className="text-[11px] text-amber-400 font-medium">
                  Waktu Mulai dan Selesai wajib diisi.
                </p>
              )}
              {invalidTimeRange && (
                <p className="text-[11px] text-red-400 font-medium">
                  Waktu Selesai harus lebih besar dari Waktu Mulai.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Poin</label>
                <input
                  type="number"
                  value={poin}
                  onChange={(e) => setPoin(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0b1221] border border-slate-700 rounded-md text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Durasi (Menit)</label>
                <input
                  type="number"
                  value={durasi}
                  onChange={(e) => setDurasi(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0b1221] border border-slate-700 rounded-md text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 pt-2 flex justify-between gap-3 shrink-0 border-t border-slate-800">
          <button
            onClick={() => handleSubmit("CLOSED")}
            disabled={!title || isSubmitting || scheduleBlocked}
            className="flex-1 px-4 py-2.5 rounded-md text-sm font-semibold text-slate-300 border border-slate-700 hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Menyimpan..." : "Simpan sebagai Draft"}
          </button>
          <button
            onClick={() => handleSubmit("ACTIVE")}
            disabled={!title || isSubmitting || scheduleBlocked}
            className="flex-1 px-4 py-2.5 rounded-md text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Menyimpan..." : "Kirim ke Siswa"}
          </button>
        </div>
      </div>
    </div>
  );
}
