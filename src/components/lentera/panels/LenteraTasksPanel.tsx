"use client";

import { useState } from "react";
import { Plus, Trash2, CheckCircle, XCircle, Check } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useGasLibrary } from "@/hooks/gas/library/useGasLibrary";

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

export function LenteraTasksPanel() {
  const { user } = useAuthStore();
  const schoolId = user?.schoolId || "";
  const { tasks, classes, literacyLogs, loading, updateTaskStatus, deleteTask, addTask, updateLiteracyLogStatus, deleteLiteracyLog } = useGasLibrary(schoolId, "");
  
  const [taskView, setTaskView] = useState<"tasks" | "needs-grading" | "history">("tasks");

  // Add Task Modal State
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", points: 10, durationMinutes: 60, className: "", dueDate: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [showClassList, setShowClassList] = useState(false);

  // Grade Modal State
  const [gradingLog, setGradingLog] = useState<any>(null);
  const [gradeInput, setGradeInput] = useState("A");
  const [feedbackInput, setFeedbackInput] = useState("");

  const classEntries = (Array.isArray(classes) ? classes : []).map((c) => {
    const id = (c?.id || c?.uuid || c?.classId || getDisplayName(c)).toString().trim();
    const label = getDisplayName(c);
    return { id, label };
  });
  const allSelected = classEntries.length > 0 && selectedClassIds.length === classEntries.length;
  const someSelected = selectedClassIds.length > 0 && selectedClassIds.length < classEntries.length;
  const selectedEntries = classEntries.filter((entry) => selectedClassIds.includes(entry.id));
  const selectedClassList =
    classEntries.length === 0 || selectedClassIds.length === 0 || allSelected
      ? ["Semua Kelas"]
      : selectedEntries.map((entry) => entry.label);
  const friendlyClassName =
    classEntries.length === 0
      ? "Semua Kelas"
      : selectedClassIds.length === 0 || allSelected
        ? "Semua Kelas"
        : selectedClassIds.length === 1
          ? selectedEntries[0]?.label || "Semua Kelas"
          : `${selectedClassIds.length} Kelas (${selectedEntries.map((entry) => entry.label).join(", ")})`;

  const toggleTaskStatus = async (taskId: string, newIsActive: boolean) => {
    try {
      await updateTaskStatus(taskId, newIsActive ? "ACTIVE" : "CLOSED");
      alert(newIsActive ? "Tugas diterbitkan" : "Tugas ditarik ke draft");
    } catch {
      alert("Gagal mengubah status tugas");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus tugas ini secara permanen?")) {
      try {
        await deleteTask(taskId);
        alert("Tugas berhasil dihapus");
      } catch {
        alert("Gagal menghapus tugas");
      }
    }
  };

  const resetTaskForm = () => {
    setNewTask({ title: "", description: "", points: 10, durationMinutes: 60, className: "", dueDate: "" });
    setSelectedClassIds([]);
    setShowClassList(false);
  };

  const toggleClass = (id: string) => {
    setSelectedClassIds((prev) => (prev.includes(id) ? prev.filter((current) => current !== id) : [...prev, id]));
  };

  const toggleAllClasses = () => {
    if (allSelected) {
      setSelectedClassIds([]);
      return;
    }
    setSelectedClassIds(classEntries.map((entry) => entry.id));
  };

  const handleCreateTask = async (status: "ACTIVE" | "CLOSED") => {
    if (!newTask.title || !newTask.description) return alert("Judul dan deskripsi wajib diisi");
    setIsSubmitting(true);
    try {
      await addTask({
        ...newTask,
        className: friendlyClassName,
        classList: selectedClassList,
        status,
        assignedBy: user?.name || "Admin",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      setIsAddTaskModalOpen(false);
      resetTaskForm();
    } catch {
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
    } catch {
      alert("Gagal menyimpan nilai");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (log: any) => {
    if (confirm(`Tolak laporan membaca dari ${log.studentName}?`)) {
      try {
        await updateLiteracyLogStatus(log.id, "REJECTED", "E", "Laporan ditolak. Silakan buat ulang.");
      } catch {
        alert("Gagal menolak laporan");
      }
    }
  };

  const handleDeleteHistoryLog = async (log: any) => {
    const targetName = log.studentName || log.studentId || "siswa ini";
    if (confirm(`Apakah Anda yakin ingin menghapus riwayat laporan ${targetName} secara permanen?`)) {
      try {
        await deleteLiteracyLog(log.id, log.schoolId);
        alert("Riwayat laporan berhasil dihapus");
      } catch {
        alert("Gagal menghapus riwayat laporan");
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
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Aksi</th>
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleDeleteHistoryLog(log)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 rounded-md border border-slate-700 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                      </button>
                    </td>
                  </tr>
                ))}
                {historyLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
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
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[92vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">Buat Tugas Baru</h3>
              <p className="text-xs text-slate-400 mb-4">
                Pilih kelas target di bawah. Jika tidak memilih, tugas dikirim ke <span className="text-slate-200 font-medium">Semua Kelas</span>.
              </p>
              <div className="bg-slate-800/50 border border-slate-700 rounded-md p-3 mb-4">
                <p className="text-xs text-slate-300">Default sekolah: 10 poin, 60 menit.</p>
              </div>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="space-y-4 overflow-y-auto max-h-[68vh] pr-1"
              >
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

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-slate-300">Kirim ke Kelas</label>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">
                        Terpilih: <span className="font-semibold text-slate-200">{selectedEntries.length || (classEntries.length ? classEntries.length : 0)}</span> / {classEntries.length}
                      </span>
                      {classEntries.length > 1 && (
                        <button
                          type="button"
                          onClick={toggleAllClasses}
                          className="text-[11px] font-semibold px-2 py-0.5 rounded border border-slate-700 text-slate-300 hover:bg-slate-800 transition"
                        >
                          {allSelected ? "Kosongkan" : "Pilih Semua"}
                        </button>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowClassList((prev) => !prev)}
                    className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-left hover:border-blue-500/60 transition focus:border-blue-500 focus:outline-none"
                  >
                    <div className="flex-1 min-w-0">
                      {selectedEntries.length === 0 || allSelected ? (
                        <p className="text-sm font-medium text-slate-200">
                          {classEntries.length ? "Semua Kelas (Terpilih Semua)" : "Semua Kelas"}
                        </p>
                      ) : (
                        <p className="text-sm font-medium text-slate-200 truncate">
                          {selectedEntries.map((entry) => entry.label).join(", ")}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-400 mt-0.5">Klik untuk memilih kelas tertentu</p>
                    </div>
                    <Check className={`h-4 w-4 shrink-0 transition ${allSelected ? "text-green-400" : someSelected ? "text-amber-400" : "text-slate-600"}`} />
                  </button>

                  {showClassList && classEntries.length > 0 && (
                    <div className="border border-slate-700 rounded-xl bg-slate-950 divide-y divide-slate-800 max-h-52 overflow-y-auto">
                      {classEntries.map((entry) => {
                        const active = selectedClassIds.includes(entry.id);
                        return (
                          <button
                            key={entry.id}
                            type="button"
                            onClick={() => toggleClass(entry.id)}
                            className="w-full flex items-center justify-between gap-2 px-4 py-2.5 hover:bg-slate-900/80 transition text-left"
                          >
                            <span className={`text-sm ${active ? "text-white" : "text-slate-300"}`}>{entry.label}</span>
                            <span
                              className={`inline-flex items-center justify-center h-5 w-5 rounded border ${
                                active ? "bg-blue-600 border-blue-500 text-white" : "border-slate-600 text-transparent"
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

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddTaskModalOpen(false);
                      resetTaskForm();
                    }}
                    className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => void handleCreateTask("CLOSED")}
                    className="px-6 py-2 border border-slate-700 hover:bg-slate-800 text-slate-200 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? "Menyimpan..." : "Simpan sebagai Draft"}
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => void handleCreateTask("ACTIVE")}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? "Menyimpan..." : "Kirim ke Siswa"}
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
