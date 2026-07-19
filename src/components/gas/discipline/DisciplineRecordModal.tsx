"use client";

import { useState } from "react";
import { X, Search } from "lucide-react";
import { DisciplineRule, DisciplineRecord } from "@/types/discipline";

interface DisciplineRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: any[];
  rules: DisciplineRule[];
  onSave: (record: Omit<DisciplineRecord, "id">) => Promise<void>;
  userName: string;
}

export function DisciplineRecordModal({ isOpen, onClose, students, rules, onSave, userName }: DisciplineRecordModalProps) {
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedRule, setSelectedRule] = useState<number | "">("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const activeRules = rules.filter(r => r.isActive);
  const filteredStudents = search.length > 2 
    ? students.filter(s => s.name?.toLowerCase().includes(search.toLowerCase()) || s.nisn?.includes(search))
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || selectedRule === "") return;
    
    setIsSubmitting(true);
    const rule = rules.find(r => r.id === Number(selectedRule));
    if (!rule) return;

    await onSave({
      studentId: selectedStudent.id,
      studentNameSnapshot: selectedStudent.name,
      classNameSnapshot: selectedStudent.class,
      ruleId: rule.id,
      ruleNameSnapshot: rule.ruleName,
      category: rule.category,
      points: rule.points,
      date: Date.now(),
      note: note.trim() || null,
      recordedBy: "admin", // Diisi ID admin nanti jika mau, sementara admin role string
      recordedByName: userName,
      reportedByRole: "admin",
      createdAt: Date.now()
    });

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-700 bg-[#0b1228] shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-800 p-6">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Catat Pelanggaran Baru</h2>
            <p className="text-sm text-slate-400">Tambahkan catatan pelanggaran ke profil siswa</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-200">1. Pilih Siswa</h3>
            {!selectedStudent ? (
              <div>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Ketik minimal 3 huruf nama atau NISN..."
                    className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                {search.length > 2 && (
                  <div className="mt-2 border border-slate-700 rounded-2xl overflow-hidden bg-slate-900 max-h-48 overflow-y-auto">
                    {filteredStudents.length > 0 ? filteredStudents.map(s => (
                      <div 
                        key={s.id} 
                        onClick={() => setSelectedStudent(s)}
                        className="px-4 py-3 border-b border-slate-800 cursor-pointer hover:bg-slate-800 transition"
                      >
                        <div className="font-bold text-slate-200">{s.name}</div>
                        <div className="text-xs text-slate-400">{s.nisn} • Kelas {s.class}</div>
                      </div>
                    )) : (
                      <div className="p-4 text-center text-sm text-slate-400">Tidak ada siswa ditemukan</div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-effect-dark-card rounded-2xl p-4 flex items-center justify-between border border-blue-500/30 bg-blue-900/10">
                <div>
                  <div className="font-bold text-slate-100">{selectedStudent.name}</div>
                  <div className="text-sm text-slate-400">{selectedStudent.nisn} • Kelas {selectedStudent.class}</div>
                </div>
                <button type="button" onClick={() => { setSelectedStudent(null); setSearch(""); }} className="text-xs text-red-400 hover:text-red-300 font-semibold px-3 py-1.5 rounded-lg bg-red-900/30">
                  Ganti
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-200">2. Pilih Pelanggaran</h3>
            <select
              value={selectedRule}
              onChange={(e) => setSelectedRule(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-sm text-white focus:border-blue-500 focus:outline-none"
              required
            >
              <option value="">-- Pilih Jenis Pelanggaran --</option>
              {activeRules.map(r => (
                <option key={r.id} value={r.id}>{r.ruleName} (+{r.points} Poin)</option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-200">3. Keterangan Tambahan (Opsional)</h3>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Catatan tambahan kejadian..."
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-sm text-white focus:border-blue-500 focus:outline-none h-24"
            />
          </div>
        </form>

        <div className="border-t border-slate-800 p-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-300 hover:bg-slate-800 transition">
            Batal
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={!selectedStudent || selectedRule === "" || isSubmitting}
            className="px-6 py-2.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Menyimpan..." : "Simpan Pelanggaran"}
          </button>
        </div>
      </div>
    </div>
  );
}
