"use client";

import { useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useGasLibrary } from "@/hooks/gas/library/useGasLibrary";

export function LenteraTasksPanel() {
  const { user } = useAuthStore();
  const schoolId = user?.schoolId || "";
  const { tasks, loading, updateTaskStatus, deleteTask } = useGasLibrary(schoolId, "");
  
  const [taskView, setTaskView] = useState<"tasks" | "needs-grading" | "history">("tasks");

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

  if (loading) {
    return <div className="text-slate-400 p-6">Memuat daftar tugas...</div>;
  }

  const filteredTasks = tasks.filter(t => taskView === "tasks" ? true : false); // Mock filter for now

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Daftar Tugas</h2>
          <p className="text-sm text-slate-400 mt-1">
            Buat, terbitkan, dan arsipkan tugas literasi untuk siswa sekolah Anda.
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
              Perlu Dinilai
            </button>
            <button
              onClick={() => setTaskView("history")}
              className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${
                taskView === "history"
                  ? "bg-blue-600 text-white"
                  : "bg-transparent text-slate-400 hover:text-slate-300"
              }`}
            >
              Riwayat
            </button>
          </div>
        </div>
        <button
          onClick={() => alert("Fitur tambah tugas (Modal) TBD")}
          className="flex items-center gap-2 rounded-md bg-pink-500 hover:bg-pink-600 px-4 py-2 text-sm font-medium text-white transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Buat Tugas Baru
        </button>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-900/30 overflow-hidden shadow-sm mt-4">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700/50">
            <thead className="bg-[#0f172a]/40">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Judul Tugas</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Poin</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Durasi</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Dibuat Pada</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 bg-transparent">
              {filteredTasks.map((task) => (
                <tr key={task.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-slate-200">{task.title}</div>
                    <div className="text-xs text-slate-400 max-w-[200px] truncate mt-0.5">{task.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {task.points} Poin
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {task.durationMinutes} Menit
                  </td>
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
                       <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 rounded-md border border-slate-700 hover:bg-slate-700 transition-colors">
                          <Edit className="w-3.5 h-3.5" /> Edit
                       </button>
                       <button 
                         onClick={() => toggleTaskStatus(task.id, task.status !== "ACTIVE")}
                         className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-300 bg-rose-500/10 rounded-md border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
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
              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
                    Belum ada tugas literasi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
