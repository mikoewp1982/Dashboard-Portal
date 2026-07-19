
import { LibraryTask } from "@/types/library";
import { Trash2, CheckCircle, XCircle } from "lucide-react";

interface LibraryTasksTableProps {
  tasks: LibraryTask[];
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: "ACTIVE" | "CLOSED") => void;
}

export function LibraryTasksTable({ tasks, onDelete, onUpdateStatus }: LibraryTasksTableProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-10 glass-effect-dark-card border border-slate-700/50 rounded-3xl">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-700">
          <span className="text-2xl">📚</span>
        </div>
        <p className="text-slate-300 font-bold">Belum ada tugas literasi</p>
        <p className="text-sm text-slate-500 mt-1">Buat tugas baru untuk mulai memonitor aktivitas membaca siswa.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-700 overflow-hidden">
      <table className="min-w-full divide-y divide-slate-700/30">
        <thead className="bg-gradient-to-r from-slate-900/70 to-slate-900/50">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Tugas</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Kelas</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Waktu</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Dibuat Oleh</th>
            <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
            <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Aksi</th>
          </tr>
        </thead>
        <tbody className="bg-slate-900/30 divide-y divide-slate-700/30">
          {tasks.map(task => (
            <tr key={task.id} className="hover:bg-slate-800/30 transition-colors">
              <td className="px-6 py-4 text-sm text-slate-100">
                <div className="font-bold">{task.title}</div>
                {task.description && <div className="text-xs text-slate-400 mt-1 line-clamp-1">{task.description}</div>}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-bold">
                {task.className}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                <div>{new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(task.createdAt))}</div>
                {task.dueDate && <div className="text-xs text-red-400 mt-1">Batas: {new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(task.dueDate))}</div>}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                {task.assignedByName || task.assignedBy}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  task.status === "ACTIVE" 
                    ? "bg-emerald-900/30 text-emerald-400 border border-emerald-700/50" 
                    : "bg-slate-800 text-slate-400 border border-slate-700"
                }`}>
                  {task.status === "ACTIVE" ? "Berjalan" : "Ditutup"}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onUpdateStatus(task.id, task.status === "ACTIVE" ? "CLOSED" : "ACTIVE")}
                    className={`p-1.5 rounded-lg border transition ${
                      task.status === "ACTIVE" 
                        ? "text-slate-400 border-slate-700 hover:text-slate-200 hover:bg-slate-800" 
                        : "text-emerald-400 border-emerald-900/50 hover:bg-emerald-900/30"
                    }`}
                    title={task.status === "ACTIVE" ? "Tutup Tugas" : "Buka Kembali Tugas"}
                  >
                    {task.status === "ACTIVE" ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => onDelete(task.id)}
                    className="p-1.5 text-slate-500 border border-slate-700 rounded-lg hover:text-red-400 hover:bg-slate-800 transition"
                    title="Hapus Tugas"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
