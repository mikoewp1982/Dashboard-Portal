"use client";

import { useState } from "react";
import { Plus, Trash2, CheckCircle, XCircle } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useGasLibrary } from "@/hooks/gas/library/useGasLibrary";

export function LenteraTasksPanel() {
  const { user } = useAuthStore();
  const schoolId = user?.schoolId || "";
  const { tasks, classes, literacyLogs, loading, updateTaskStatus, deleteTask, addTask, updateLiteracyLogStatus } = useGasLibrary(schoolId, "");
  
  const [taskView, setTaskView] = useState<"tasks" | "needs-grading" | "history">("tasks");

  // Add Task Modal State
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", points: 10, durationMinutes: 60, className: "", dueDate: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Grade Modal State
  const [gradingLog, setGradingLog] = useState<any>(null);
  const [gradeInput, setGradeInput] = useState("A");
  const [feedbackInput, setFeedbackInput] = useState("");

  const toggleTaskStatus = async (taskId: string, newIsActive: boolean) => {
    try {
      await updateTaskStatus(taskId, newIsActive ? "ACTIVE" : "CLOSED");
      alert(newIsActive ? "Tugas diterbitkan" : "Tugas ditarik ke draft");
    } catch (error) {
      alert("Gagal mengubah status tugas");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus tugas ini secara permanen?")) {
      try {
        await deleteTask(taskId);
        alert("Tugas berhasil dihapus");
      } catch (error) {
        alert("Gagal menghapus tugas");
      }
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !newTask.description) return alert("Judul dan deskripsi wajib diisi");
    setIsSubmitting(true);
    try {
      await addTask({
        ...newTask,
        status: "CLOSED", // default to draft
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      setIsAddTaskModalOpen(false);
      setNewTask({ title: "", description: "", points: 10, durationMinutes: 60, className: "", dueDate: "" });
    } catch (error) {
      alert("Gagal membuat tugas");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingLog) return;
    setIsSubmitting(true);
    try {
      await updateLiteracyLogStatus(gradingLog.id, "GRADED", gradeInput, feedbackInput);
      setGradingLog(null);
    } catch (error) {
      alert("Gagal menyimpan nilai");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (log: any) => {
    if (confirm(`Tolak laporan membaca dari ${log.studentName}?`)) {
      try {
        await updateLiteracyLogStatus(log.id, "REJECTED", "E", "Laporan ditolak. Silakan buat ulang.");
      } catch (error) {
        alert("Gagal menolak laporan");
      }
    }
  };

  if (loading) {
    return <div className="text-slate-400 p-6">Memuat daftar tugas...</div>;
  }

  const needsGradingLogs = literacyLogs.filter(l => l.status === "PENDING" || !l.status);
  const historyLogs = literacyLogs.filter(l => l.status === "GRADED" || l.status === "REJECTED");

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Kelola Literasi</h2>
          <p className="text-sm text-slate-400 mt-1">
            Buat tugas, terbitkan, dan nilai laporan membaca siswa.
          </p>
          <div className="flex space-x-2 mt-4">
            <button
              onClick={() => setTaskView("tasks")}
              className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${
                taskView === "tasks"
                  ? "bg-blue-600 text-white"
                  : "bg-transparent text-slate-400 hover:text-slate-300"
              }`}
            >
              Daftar Tugas
            </button>
            <button
              onClick={() => setTaskView("needs-grading")}
              className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${
                taskView === "needs-grading"
                  ? "bg-blue-600 text-white"
                  : "bg-transparent text-slate-400 hover:text-slate-300"
              }`}
            >
              Perlu Dinilai ({needsGradingLogs.length})
            </button>
            <button
              onClick={() => setTaskView("history")}
              className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${
                taskView === "history"
                  ? "bg-blue-600 text-white"
                  : "bg-transparent text-slate-400 hover:text-slate-300"
              }`}
            >
              Riwayat Penilaian
            </button>
          </div>
        </div>
        {taskView === "tasks" && (
          <button
            onClick={() => setIsAddTaskModalOpen(true)}
            className="flex items-center gap-2 rounded-md bg-pink-500 hover:bg-pink-600 px-4 py-2 text-sm font-medium text-white transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Buat Tugas Baru
          </button>
        )}
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-900/30 overflow-hidden shadow-sm mt-4">
        <div className="overflow-x-auto">
          
          {/* TASKS TABLE */}
          {taskView === "tasks" && (
            <table className="min-w-full divide-y divide-slate-700/50">
              <thead className="bg-[#0f172a]/40">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Judul Tugas</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Poin</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Durasi</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Batas Waktu</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Dibuat Pada</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50 bg-transparent">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-slate-200">{task.title}</div>
                      <div className="text-xs text-slate-400 max-w-[200px] truncate mt-0.5">{task.description}</div>
                      {task.className && <div className="text-[10px] font-medium text-blue-400 mt-1">Kelas: {task.className}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{task.points} Poin</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{task.durationMinutes} Menit</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-300">{task.dueDate || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs font-semibold rounded-full border ${
                        task.status === "ACTIVE" 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      }`}>
                        {task.status === "ACTIVE" ? 'Terkirim' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {new Date(task.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                         <button 
                           onClick={() => toggleTaskStatus(task.id, task.status !== "ACTIVE")}
                           className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                             task.status === "ACTIVE" ? 'text-amber-300 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20' : 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20'
                           }`}
                         >
                            {task.status === "ACTIVE" ? 'Tarik Kembali' : 'Terbitkan'}
                         </button>
                         <button 
                           onClick={() => handleDeleteTask(task.id)}
                           className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 rounded-md border border-slate-700 hover:text-rose-400 transition-colors"
                         >
                            <Trash2 className="w-3.5 h-3.5" /> Hapus
                         </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {tasks.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
                      Belum ada tugas literasi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {/* NEEDS GRADING TABLE */}
          {taskView === "needs-grading" && (
            <table className="min-w-full divide-y divide-slate-700/50">
              <thead className="bg-[#0f172a]/40">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Siswa</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Buku/Tugas</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Ringkasan</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Tanggal</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50 bg-transparent">
                {needsGradingLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-slate-200">{log.studentName || log.studentId}</div>
                      <div className="text-xs text-slate-400 mt-0.5">Kelas: {log.studentClass || "-"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-blue-300">{log.bookTitle || "-"}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{log.taskTitle || "Baca Bebas"}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300 max-w-[300px] truncate">
                      {log.summary || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {new Date(log.timestamp || 0).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                         <button 
                           onClick={() => setGradingLog(log)}
                           className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-500/10 rounded-md border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                         >
                            <CheckCircle className="w-3.5 h-3.5" /> Nilai
                         </button>
                         <button 
                           onClick={() => handleReject(log)}
                           className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-300 bg-rose-500/10 rounded-md border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
                         >
                            <XCircle className="w-3.5 h-3.5" /> Tolak
                         </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {needsGradingLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-emerald-400/70 font-medium">
                      🎉 Luar biasa! Semua laporan literasi sudah dinilai.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {/* HISTORY TABLE */}
          {taskView === "history" && (
            <table className="min-w-full divide-y divide-slate-700/50">
              <thead className="bg-[#0f172a]/40">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Siswa</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Buku/Tugas</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Nilai</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50 bg-transparent">
                {historyLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-slate-200">{log.studentName || log.studentId}</div>
                      <div className="text-xs text-slate-400 mt-0.5">Kelas: {log.studentClass || "-"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-300">{log.bookTitle || "-"}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{log.taskTitle || "Baca Bebas"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-bold text-amber-400">{log.grade || "-"}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-[10px] font-bold uppercase rounded-full border ${
                        log.status === "GRADED" 
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {log.status === "GRADED" ? 'Dinilai' : 'Ditolak'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      {new Date(log.timestamp || 0).toLocaleDateString('id-ID')}
                    </td>
                  </tr>
                ))}
                {historyLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">
                      Belum ada riwayat penilaian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

        </div>
      </div>

      {/* Add Task Modal */}
      {isAddTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">Buat Tugas Baru</h3>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Judul Tugas</label>
                  <input required type="text" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500" placeholder="Misal: Review Buku Fiksi" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Deskripsi Singkat</label>
                  <textarea required value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500 resize-none h-24" placeholder="Jelaskan apa yang harus siswa baca..." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Poin Reward</label>
                    <input type="number" required min={0} value={newTask.points} onChange={e => setNewTask({...newTask, points: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Durasi (Menit)</label>
                    <input type="number" required min={0} value={newTask.durationMinutes} onChange={e => setNewTask({...newTask, durationMinutes: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Batas Waktu</label>
                    <input type="date" value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Pilih Kelas (Opsional)</label>
                  <select value={newTask.className} onChange={e => setNewTask({...newTask, className: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500 appearance-none">
                    <option value="">Semua Kelas</option>
                    {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setIsAddTaskModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">Batal</button>
                  <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
                    {isSubmitting ? "Menyimpan..." : "Simpan & Jadikan Draft"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Grading Modal */}
      {gradingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-2">Penilaian Literasi</h3>
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 mb-6 space-y-2">
                <p className="text-sm"><span className="text-slate-400">Siswa:</span> <span className="text-white font-medium">{gradingLog.studentName}</span></p>
                <p className="text-sm"><span className="text-slate-400">Buku:</span> <span className="text-white font-medium">{gradingLog.bookTitle || "-"}</span></p>
                <div className="mt-2 text-sm text-slate-300 italic border-l-2 border-slate-600 pl-3">
                  "{gradingLog.summary}"
                </div>
              </div>
              <form onSubmit={handleGradeSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Nilai (Grade)</label>
                  <select value={gradeInput} onChange={e => setGradeInput(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500 appearance-none">
                    <option value="A">A - Sangat Baik</option>
                    <option value="B">B - Baik</option>
                    <option value="C">C - Cukup</option>
                    <option value="D">D - Kurang</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Umpan Balik (Opsional)</label>
                  <textarea value={feedbackInput} onChange={e => setFeedbackInput(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500 resize-none h-20" placeholder="Berikan komentar untuk siswa..." />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setGradingLog(null)} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">Batal</button>
                  <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
                    {isSubmitting ? "Menyimpan..." : "Kirim Nilai"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
