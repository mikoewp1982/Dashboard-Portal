"use client";

import { X } from "lucide-react";
import { TeacherRubric } from "@/hooks/gas/seven-habits/useGasSevenHabits";
import { RUBRIC_FIELDS } from "./sevenHabitsConfig";

interface SevenHabitsRubricModalProps {
  isOpen: boolean;
  studentName: string;
  rubricValues: TeacherRubric;
  isSubmitting: boolean;
  onClose: () => void;
  onValueChange: (field: keyof Omit<TeacherRubric, "total">, value: number) => void;
  onSave: () => void;
}

export function SevenHabitsRubricModal({
  isOpen,
  studentName,
  rubricValues,
  isSubmitting,
  onClose,
  onValueChange,
  onSave,
}: SevenHabitsRubricModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:hidden">
      <div className="w-full max-w-md overflow-hidden rounded-lg glass-effect-dark-card shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-700 bg-slate-900/30 px-6 py-4">
          <div>
            <h3 className="text-lg font-medium text-slate-100">Penilaian Guru</h3>
            <p className="text-sm text-slate-400">{studentName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-slate-400 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-6">
          {RUBRIC_FIELDS.map((item) => (
            <div key={item.key}>
              <div className="mb-2 flex justify-between">
                <label className="text-sm font-medium text-slate-300">{item.label}</label>
                <span className="text-sm font-bold text-indigo-600">{rubricValues[item.key]}</span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="1"
                value={rubricValues[item.key]}
                onChange={(e) => onValueChange(item.key, Number(e.target.value))}
                className="w-full h-2 appearance-none rounded-lg bg-gray-200 cursor-pointer accent-indigo-600"
              />
              <p className="mt-1 text-xs text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-slate-700 bg-slate-900/30 px-6 py-4">
          <div className="flex flex-col">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Total Skor</span>
            <span className="text-2xl font-bold text-indigo-600">{rubricValues.total}</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-slate-300 glass-effect-dark-card hover:bg-slate-900/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={onSave}
              disabled={isSubmitting}
              className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Nilai"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
