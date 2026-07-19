"use client";

import { useState, useEffect } from "react";
import { X, Save, AlertCircle, Trash2, Pencil } from "lucide-react";
import { DisciplineRule } from "@/types/discipline";

interface DisciplineRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: DisciplineRule[];
  onSave: (rules: DisciplineRule[]) => Promise<void>;
}

export function DisciplineRuleModal({ isOpen, onClose, rules, onSave }: DisciplineRuleModalProps) {
  const [localRules, setLocalRules] = useState<DisciplineRule[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [form, setForm] = useState({
    ruleName: "",
    points: 5,
    severity: "LOW" as DisciplineRule["severity"],
    description: "",
    category: "VIOLATION" as DisciplineRule["category"],
    isActive: true
  });

  useEffect(() => {
    if (isOpen) {
      setLocalRules(rules);
      resetForm();
    }
  }, [isOpen, rules]);

  if (!isOpen) return null;

  const resetForm = () => {
    setForm({
      ruleName: "",
      points: 5,
      severity: "LOW",
      description: "",
      category: "VIOLATION",
      isActive: true
    });
    setEditingId(null);
  };

  const handleEdit = (rule: DisciplineRule) => {
    setEditingId(rule.id);
    setForm({
      ruleName: rule.ruleName,
      points: rule.points,
      severity: rule.severity,
      description: rule.description || "",
      category: rule.category,
      isActive: rule.isActive
    });
  };

  const handleDelete = (id: number) => {
    setLocalRules(prev => prev.filter(r => r.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ruleName) return;

    if (editingId !== null) {
      setLocalRules(prev => prev.map(r => r.id === editingId ? {
        ...r,
        ...form,
        updatedAt: Date.now()
      } : r));
    } else {
      const nextId = localRules.length > 0 ? Math.max(...localRules.map(r => r.id)) + 1 : 1;
      setLocalRules(prev => [...prev, {
        id: nextId,
        ...form,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }]);
    }
    resetForm();
  };

  const handleSaveToServer = async () => {
    await onSave(localRules);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-3xl border border-slate-700 bg-[#0b1228] shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-800 p-6">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Kelola Aturan Kedisiplinan</h2>
            <p className="text-sm text-slate-400">Atur bobot poin untuk setiap pelanggaran</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          {/* List Rules */}
          <div className="flex-1 overflow-y-auto border-b lg:border-b-0 lg:border-r border-slate-800 p-6 space-y-4">
            {localRules.map(rule => (
              <div key={rule.id} className="glass-effect-dark-card rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-200">{rule.ruleName}</h3>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">{rule.severity}</span>
                  </div>
                  <p className="text-sm text-red-400 font-semibold mt-1">{rule.points} Poin</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEdit(rule)} className="p-2 text-blue-400 hover:bg-blue-900/30 rounded-xl transition">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(rule.id)} className="p-2 text-red-400 hover:bg-red-900/30 rounded-xl transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {localRules.length === 0 && (
              <div className="text-center py-10 text-slate-500 text-sm border border-dashed border-slate-700 rounded-2xl">
                Belum ada aturan. Silakan tambahkan aturan baru.
              </div>
            )}
          </div>

          {/* Form Area */}
          <div className="w-full lg:w-80 p-6 overflow-y-auto bg-slate-900/50">
            <h3 className="font-bold text-slate-200 mb-4">{editingId ? "Edit Aturan" : "Tambah Aturan"}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400">Nama Pelanggaran</label>
                <input 
                  type="text" 
                  value={form.ruleName}
                  onChange={e => setForm({...form, ruleName: e.target.value})}
                  className="w-full mt-1 px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400">Poin</label>
                  <input 
                    type="number" 
                    min={0}
                    value={form.points}
                    onChange={e => setForm({...form, points: Number(e.target.value)})}
                    className="w-full mt-1 px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400">Tingkat</label>
                  <select 
                    value={form.severity}
                    onChange={e => setForm({...form, severity: e.target.value as any})}
                    className="w-full mt-1 px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400">Deskripsi (Opsional)</label>
                <textarea 
                  value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                  className="w-full mt-1 px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:border-blue-500 focus:outline-none h-20"
                />
              </div>
              <div className="pt-2 flex gap-3">
                {editingId && (
                  <button type="button" onClick={resetForm} className="flex-1 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-semibold transition">
                    Batal
                  </button>
                )}
                <button type="submit" className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition">
                  {editingId ? "Simpan Perubahan" : "Tambahkan"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="border-t border-slate-800 p-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-300 hover:bg-slate-800 transition">
            Tutup
          </button>
          <button onClick={handleSaveToServer} className="px-6 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition flex items-center gap-2">
            <Save className="w-4 h-4" />
            Simpan Konfigurasi
          </button>
        </div>
      </div>
    </div>
  );
}
