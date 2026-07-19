"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { LibraryTask } from "@/types/library";

interface LibraryTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: any[];
  onSave: (task: Omit<LibraryTask, "id">) => Promise<void>;
  userName: string;
}

export function LibraryTaskModal({ isOpen, onClose, classes, onSave, userName }: LibraryTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [poin, setPoin] = useState("30");
  const [durasi, setDurasi] = useState("45");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (status: "ACTIVE" | "CLOSED") => {
    if (!title) return;

    setIsSubmitting(true);
    await onSave({
      title,
      description,
      // Menggunakan "Semua Kelas" karena di UI referensi tidak ada pemilih kelas
      className: "Semua Kelas", 
      assignedBy: "admin",
      assignedByName: userName,
      status,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    setIsSubmitting(false);
    onClose();
    
    // Reset form
    setTitle("");
    setDescription("");
    setPoin("30");
    setDurasi("45");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[500px] rounded-xl border border-slate-700 bg-[#0f172a] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-2">
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

        <div className="p-6 pt-4 space-y-4">
          {/* Info Box */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-md p-3">
            <p className="text-xs text-slate-300">Default sekolah: 30 poin, 45 menit.</p>
          </div>

          {/* Form */}
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

        {/* Footer Actions */}
        <div className="p-6 pt-2 flex justify-between gap-3">
          <button 
            onClick={() => handleSubmit("CLOSED")} 
            disabled={!title || isSubmitting}
            className="flex-1 px-4 py-2.5 rounded-md text-sm font-semibold text-slate-300 border border-slate-700 hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Simpan sebagai Draft
          </button>
          <button 
            onClick={() => handleSubmit("ACTIVE")} 
            disabled={!title || isSubmitting}
            className="flex-1 px-4 py-2.5 rounded-md text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Menyimpan..." : "Kirim ke Siswa"}
          </button>
        </div>
      </div>
    </div>
  );
}
