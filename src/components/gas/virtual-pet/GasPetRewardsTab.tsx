"use client";

import { Gift, School, User, Users } from "lucide-react";

interface GasPetRewardsTabProps {
  rewardTarget: "all" | "class" | "student";
  selectedClassReward: string;
  selectedStudentId: string;
  studentSearchTerm: string;
  rewardType: "coins" | "exp" | "intelligence" | "social";
  rewardAmount: number;
  isSubmittingReward: boolean;
  uniqueClasses: unknown[];
  students: any[];
  onRewardTargetChange: (value: "all" | "class" | "student") => void;
  onClassRewardChange: (value: string) => void;
  onStudentSearchChange: (value: string) => void;
  onStudentSelect: (studentId: string, studentName: string) => void;
  onStudentClear: () => void;
  onRewardTypeChange: (value: "coins" | "exp" | "intelligence" | "social") => void;
  onRewardAmountChange: (value: number) => void;
  onSubmit: () => Promise<void>;
}

export function GasPetRewardsTab(props: GasPetRewardsTabProps) {
  const {
    rewardTarget,
    selectedClassReward,
    selectedStudentId,
    studentSearchTerm,
    rewardType,
    rewardAmount,
    isSubmittingReward,
    uniqueClasses,
    students,
    onRewardTargetChange,
    onClassRewardChange,
    onStudentSearchChange,
    onStudentSelect,
    onStudentClear,
    onRewardTypeChange,
    onRewardAmountChange,
    onSubmit,
  } = props;

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-500/30 text-blue-200 text-sm flex gap-3 items-start">
        <Gift className="w-5 h-5 flex-shrink-0 text-blue-400 mt-0.5" />
        <p><strong>Info:</strong> Reward akan dikirimkan secara langsung ke device siswa. Gunakan fitur ini untuk memberikan apresiasi massal atau bantuan darurat.</p>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-bold text-slate-100">Target Penerima</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "all", label: "Semua", icon: School },
            { id: "class", label: "Per Kelas", icon: Users },
            { id: "student", label: "Siswa", icon: User },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = rewardTarget === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onRewardTargetChange(item.id as "all" | "class" | "student")}
                className={`px-3 py-2 rounded-xl border text-xs sm:text-sm font-medium flex items-center justify-center gap-1 transition-all ${
                  isActive
                    ? "border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-900/50"
                    : "border-slate-700 bg-slate-800/50 hover:bg-slate-700 text-slate-300"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {rewardTarget === "class" && (
        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-100">Pilih Kelas</label>
          <select
            value={selectedClassReward}
            onChange={(e) => onClassRewardChange(e.target.value)}
            className="w-full p-3 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-900/50 text-slate-100 font-medium"
          >
            <option value="" className="bg-slate-900 text-slate-100">-- Pilih Kelas --</option>
            {uniqueClasses.map((className) => (
              <option key={String(className)} value={String(className)} className="bg-slate-900 text-slate-100">{String(className)}</option>
            ))}
          </select>
        </div>
      )}

      {rewardTarget === "student" && (
        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-100">Cari Siswa</label>
          <input
            type="text"
            placeholder="Ketik nama siswa..."
            value={studentSearchTerm}
            onChange={(e) => onStudentSearchChange(e.target.value)}
            className="w-full p-3 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 bg-slate-900/50 text-slate-100 font-medium placeholder-slate-500"
          />
          {studentSearchTerm.length > 1 && !selectedStudentId && (
            <div className="border border-slate-700 rounded-xl max-h-48 overflow-y-auto bg-slate-800 shadow-lg">
              {students
                .filter((student: any) => student.name?.toLowerCase().includes(studentSearchTerm.toLowerCase()))
                .slice(0, 5)
                .map((student: any) => (
                  <button
                    key={student.id}
                    onClick={() => onStudentSelect(student.id, student.name)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-700 border-b border-slate-700/50 last:border-0"
                  >
                    <div className="font-bold text-sm text-slate-100">{student.name}</div>
                    <div className="text-xs font-semibold text-slate-400">{student.kelas || student.class} | {student.nisn}</div>
                  </button>
                ))}
            </div>
          )}
          {selectedStudentId && (
            <div className="flex items-center justify-between p-3 bg-blue-900/30 rounded-xl text-blue-200 border border-blue-500/30 shadow-sm">
              <span className="font-bold text-sm">Siswa Terpilih: {students.find((student: any) => student.id === selectedStudentId)?.name}</span>
              <button onClick={onStudentClear} className="text-xs underline hover:text-blue-300 font-bold">Ganti</button>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-sm font-bold text-slate-100">Jenis Reward</label>
            <select
              value={rewardType}
              onChange={(e) => onRewardTypeChange(e.target.value as "coins" | "exp" | "intelligence" | "social")}
              className="w-full p-3 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-900/50 text-slate-100 font-medium"
            >
              <optgroup label="Resources" className="font-bold bg-slate-900 text-slate-300">
                <option value="coins" className="bg-slate-900 text-slate-100 font-medium">Coins (Mata Uang)</option>
                <option value="exp" className="bg-slate-900 text-slate-100 font-medium">XP (Experience Points)</option>
              </optgroup>
              <optgroup label="Non-Core Stats" className="font-bold bg-slate-900 text-slate-300">
                <option value="intelligence" className="bg-slate-900 text-slate-100 font-medium">Kecerdasan (+Intelligence)</option>
                <option value="social" className="bg-slate-900 text-slate-100 font-medium">Sosial (+Social)</option>
              </optgroup>
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-bold text-slate-100">Jumlah</label>
            <input
              type="number"
              min="1"
              max="1000"
              value={rewardAmount}
              onChange={(e) => onRewardAmountChange(parseInt(e.target.value, 10) || 0)}
              className="w-full p-3 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-900/50 text-slate-100 font-bold"
            />
          </div>
        </div>
        <p className="text-xs font-medium text-slate-400 mt-2">
          {rewardType === "coins" || rewardType === "exp"
            ? "Masukkan jumlah koin/XP."
            : "Reward manual hanya berlaku untuk stat non-inti seperti kecerdasan dan sosial."}
        </p>
      </div>

      <button
        onClick={() => void onSubmit()}
        disabled={isSubmittingReward || (rewardTarget === "class" && !selectedClassReward) || (rewardTarget === "student" && !selectedStudentId)}
        className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmittingReward ? "Mengirim..." : "Kirim Reward Sekarang"}
      </button>
    </div>
  );
}
