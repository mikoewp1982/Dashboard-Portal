"use client";

import { AlertCircle, BarChart3, Book, BookOpen, Clock, Download, FileText, Plus, RotateCcw, Trash2 } from "lucide-react";
import { exportToExcel } from "@/utils/export";

type LibraryTab = "loans" | "literacy" | "tasks" | "stats";
type TaskSubTab = "tasks" | "needs-grading" | "history";
type LiteracySubTab = "list" | "progress";

interface GasLibraryTabContentProps {
  activeTab: LibraryTab;
  taskSubTab: TaskSubTab;
  literacySubTab: LiteracySubTab;
  selectedClass: string;
  classes: any[];
  filteredLiteracyLogs: any[];
  literacyStudentStats: { completed: any[]; incomplete: any[]; total: number };
  loading: boolean;
  displayedTasks: any[];
  onClassChange: (value: string) => void;
  onTaskSubTabChange: (value: TaskSubTab) => void;
  onLiteracySubTabChange: (value: LiteracySubTab) => void;
  onOpenModal: () => void;
  onUpdateTaskStatus: (taskId: string, status: "ACTIVE" | "CLOSED") => void;
  onDeleteTask: (taskId: string) => void;
}

export function GasLibraryTabContent(props: GasLibraryTabContentProps) {
  const {
    activeTab,
    taskSubTab,
    literacySubTab,
    selectedClass,
    classes,
    filteredLiteracyLogs,
    literacyStudentStats,
    loading,
    displayedTasks,
    onClassChange,
    onTaskSubTabChange,
    onLiteracySubTabChange,
    onOpenModal,
    onUpdateTaskStatus,
    onDeleteTask,
  } = props;

  if (activeTab === "loans") {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Koleksi Judul", value: "0", desc: "Total judul buku terdaftar", border: "border-blue-500", iconWrap: "bg-blue-900/30 border-blue-500/30", icon: <Book className="w-6 h-6 text-blue-400" /> },
            { label: "Sedang Dipinjam", value: "0", desc: "Siswa sedang meminjam buku", border: "border-indigo-500", iconWrap: "bg-indigo-900/30 border-indigo-500/30", icon: <BookOpen className="w-6 h-6 text-indigo-400" /> },
            { label: "Terlambat Pengembalian", value: "0", desc: "Perlu tindak lanjut", border: "border-red-500", iconWrap: "bg-red-900/30 border-red-500/30", icon: <Clock className="w-6 h-6 text-red-400" /> },
          ].map((card) => (
            <div key={card.label} className={`glass-effect-dark-card rounded-xl shadow-sm p-6 border-l-4 ${card.border}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">{card.label}</p>
                  <h3 className={`text-2xl font-bold ${card.label === "Terlambat Pengembalian" ? "text-red-500" : "text-slate-100"}`}>{card.value}</h3>
                  <p className="text-xs text-slate-400 mt-1">{card.desc}</p>
                </div>
                <div className={`p-3 rounded-full border ${card.iconWrap}`}>{card.icon}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-effect-dark-card rounded-lg shadow-sm overflow-hidden border border-slate-700">
            <div className="px-6 py-4 border-b border-slate-700">
              <h3 className="text-sm font-semibold text-slate-200">Aktivitas Peminjaman Terkini</h3>
            </div>
            <div className="overflow-x-auto min-h-[160px]">
              <table className="min-w-full divide-y divide-slate-700/40">
                <thead className="bg-slate-900/30">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Siswa</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Buku</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Tgl Pinjam</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-500">Belum ada aktivitas peminjaman.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-effect-dark-card rounded-lg shadow-sm p-6 border border-slate-700">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Buku Populer</h3>
            <div className="py-8 text-center text-sm text-slate-500 border-b border-slate-700/50 mb-4">Belum ada data buku.</div>
            <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-md p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-4 w-4 text-yellow-500" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-xs font-medium text-yellow-500">Perhatian</h3>
                  <div className="mt-1 text-xs text-yellow-600/80">
                    <p>Data diperbarui secara otomatis dari sistem Lentera Digital setiap 15 menit.</p>
                    <p>Gunakan tombol Muat Ulang untuk mengambil snapshot terbaru secara hemat data.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === "literacy") {
    return (
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Laporan Literasi Siswa</h3>
            <p className="text-sm text-slate-400">Rekap laporan literasi yang dikirim melalui Lentera Digital.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <select
              value={selectedClass}
              onChange={(e) => onClassChange(e.target.value)}
              className="px-3 py-2 rounded-md border border-slate-700 bg-slate-900 text-sm font-medium text-slate-300 shadow-sm outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
            >
              <option value="">Semua Kelas</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
            <button
              onClick={() =>
                exportToExcel(
                  filteredLiteracyLogs.map((log) => ({
                    Tanggal: log.timestamp ? new Date(log.timestamp).toLocaleString("id-ID") : "-",
                    "Nama Siswa": log.studentName || "-",
                    Kelas: log.studentClass || "-",
                    "Judul Buku": log.bookTitle || log.taskTitle || "-",
                    Status: log.status || "-",
                    Nilai: log.grade || "-",
                  })),
                  `Monitoring_ELibrary_${selectedClass || "Semua_Kelas"}`
                )
              }
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-bold shadow-sm hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Excel
            </button>
          </div>
        </div>

        <div className="border-b border-slate-700">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {[
              { id: "list", label: "Daftar Laporan" },
              { id: "progress", label: "Status Pengerjaan" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => onLiteracySubTabChange(tab.id as LiteracySubTab)}
                className={`cursor-pointer border-b-2 py-3 px-1 text-sm font-medium transition-colors ${
                  literacySubTab === tab.id
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-slate-400 hover:border-slate-500 hover:text-slate-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {literacySubTab === "list" ? (
          <div className="glass-effect-dark-card rounded-lg shadow-sm overflow-hidden border border-slate-700">
            <div className="overflow-x-auto min-h-[200px]">
              <table className="min-w-full divide-y divide-slate-700/40">
                <thead className="bg-slate-900/30">
                  <tr>
                    {["Tanggal", "Nama Siswa", "Kelas", "Judul Buku", "Durasi", "Nilai", "Status"].map((header) => (
                      <th key={header} className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {filteredLiteracyLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500">Belum ada laporan literasi yang masuk.</td>
                    </tr>
                  ) : filteredLiteracyLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-300">{log.timestamp ? new Date(log.timestamp).toLocaleDateString("id-ID") : "-"}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-100">{log.studentName || "-"}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">{log.studentClass || "-"}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">{log.bookTitle || log.taskTitle || "-"}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">-</td>
                      <td className="px-6 py-4 text-sm text-slate-300">{log.grade || "-"}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">{log.status || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-effect-dark-card rounded-lg shadow-sm p-4 border-l-4 border-slate-500">
                <p className="text-xs font-medium text-slate-400">Total Siswa</p>
                <p className="text-2xl font-bold text-slate-100">{literacyStudentStats.total}</p>
                <p className="text-xs text-slate-400 mt-1">{selectedClass ? "Kelas Terpilih" : "Semua Kelas"}</p>
              </div>
              <div className="bg-green-50 rounded-lg shadow-sm p-4 border-l-4 border-green-500">
                <p className="text-xs font-medium text-green-700">Sudah Aktif Literasi</p>
                <p className="text-2xl font-bold text-green-700">{literacyStudentStats.completed.length}</p>
                <p className="text-xs text-green-700 mt-1">{literacyStudentStats.total > 0 ? Math.round((literacyStudentStats.completed.length / literacyStudentStats.total) * 100) : 0}% dari total</p>
              </div>
              <div className="bg-red-50 rounded-lg shadow-sm p-4 border-l-4 border-red-500">
                <p className="text-xs font-medium text-red-700">Belum Aktif Literasi</p>
                <p className="text-2xl font-bold text-red-700">{literacyStudentStats.incomplete.length}</p>
                <p className="text-xs text-red-700 mt-1">{literacyStudentStats.total > 0 ? Math.round((literacyStudentStats.incomplete.length / literacyStudentStats.total) * 100) : 0}% dari total</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: "Belum Aktif Literasi",
                  colorClass: "border-red-100",
                  headerClass: "bg-red-50 border-red-100 text-red-700",
                  count: literacyStudentStats.incomplete.length,
                  rows: literacyStudentStats.incomplete,
                  empty: "Semua siswa sudah aktif literasi.",
                  activity: false,
                },
                {
                  title: "Sudah Aktif Literasi",
                  colorClass: "border-green-100",
                  headerClass: "bg-green-50 border-green-100 text-green-700",
                  count: literacyStudentStats.completed.length,
                  rows: literacyStudentStats.completed,
                  empty: "Belum ada siswa yang aktif literasi.",
                  activity: true,
                },
              ].map((panel) => (
                <div key={panel.title} className={`glass-effect-dark-card rounded-lg shadow-sm overflow-hidden ${panel.colorClass}`}>
                  <div className={`px-6 py-3 border-b flex items-center justify-between ${panel.headerClass}`}>
                    <h4 className="text-sm font-semibold">{panel.title}</h4>
                    <span className="text-xs font-medium">{panel.count} Siswa</span>
                  </div>
                  <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                    <table className="min-w-full divide-y divide-slate-700/40">
                      <thead className="bg-slate-900/30 sticky top-0 z-10">
                        <tr>
                          {["No", "NISN", "Nama Siswa", "Kelas", ...(panel.activity ? ["Aktivitas"] : [])].map((header) => (
                            <th key={header} className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/30">
                        {panel.rows.length === 0 ? (
                          <tr>
                            <td colSpan={panel.activity ? 5 : 4} className="px-4 py-6 text-center text-xs text-slate-500">{panel.empty}</td>
                          </tr>
                        ) : panel.rows.map((student: any, index: number) => (
                          <tr key={student.id} className="hover:bg-slate-800/20 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-400">{index + 1}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-400">{student.nisn || "-"}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-slate-100">{student.name || "-"}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-400">{student.kelas || student.class || "-"}</td>
                            {panel.activity ? <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-400">{student.laporanCount} laporan</td> : null}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeTab === "stats") {
    return (
      <div className="glass-effect-dark-card rounded-xl border border-slate-700 p-8 text-center">
        <BarChart3 className="mx-auto h-12 w-12 text-slate-500 mb-3" />
        <p className="text-slate-300 font-bold">Statistik Literasi</p>
        <p className="text-sm text-slate-500 mt-1">Fitur statistik akan tersedia setelah integrasi data Lentera Digital.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Daftar Tugas</h2>
          <p className="text-sm text-slate-400">Buat, terbitkan, dan arsipkan tugas literasi untuk siswa sekolah Anda.</p>
        </div>
        <button
          onClick={onOpenModal}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-green-700 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          Buat Tugas Baru
        </button>
      </div>

      <div className="flex items-center gap-2">
        {(["tasks", "needs-grading", "history"] as TaskSubTab[]).map((tab) => {
          const label = tab === "tasks" ? "Daftar Tugas" : tab === "needs-grading" ? "Perlu Dinilai" : "Riwayat";
          const isActive = taskSubTab === tab;
          return (
            <button
              key={tab}
              onClick={() => onTaskSubTabChange(tab)}
              className={`cursor-pointer px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "glass-effect-dark-card border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 font-semibold">Memuat tugas literasi...</div>
      ) : taskSubTab === "needs-grading" ? (
        <div className="glass-effect-dark-card rounded-xl border border-slate-700 p-8 text-center">
          <FileText className="mx-auto h-10 w-10 text-slate-500 mb-3" />
          <p className="text-sm font-semibold text-slate-300">Belum ada laporan yang perlu dinilai.</p>
          <p className="text-xs text-slate-500 mt-1">Laporan siswa yang menunggu penilaian akan muncul di sini.</p>
        </div>
      ) : displayedTasks.length === 0 ? (
        <div className="glass-effect-dark-card rounded-xl border border-slate-700 p-8 text-center">
          <Book className="mx-auto h-10 w-10 text-slate-500 mb-3" />
          <p className="text-sm font-semibold text-slate-300">{taskSubTab === "tasks" ? "Belum ada tugas aktif." : "Belum ada riwayat tugas."}</p>
          <p className="text-xs text-slate-500 mt-1">{taskSubTab === "tasks" ? "Buat tugas baru untuk mulai memonitor aktivitas membaca siswa." : "Tugas yang sudah ditutup akan muncul di sini."}</p>
        </div>
      ) : (
        <div className="glass-effect-dark-card rounded-lg shadow-sm overflow-hidden border border-slate-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700/40">
              <thead className="bg-slate-900/50">
                <tr>
                  {["Judul Tugas", "Kelas", "Status", "Dibuat Pada", "Aksi"].map((header) => (
                    <th
                      key={header}
                      className={`px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider ${header === "Aksi" ? "text-right" : "text-left"}`}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {displayedTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-100">{task.title}</div>
                      {task.description ? <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{task.description}</div> : null}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{task.className || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        task.status === "ACTIVE"
                          ? "bg-teal-900/40 text-teal-400 border border-teal-700/40"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}>
                        {task.status === "ACTIVE" ? "Terkirim" : "Ditutup"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      {new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(task.createdAt))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onUpdateTaskStatus(task.id, task.status === "ACTIVE" ? "CLOSED" : "ACTIVE")}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                            task.status === "ACTIVE"
                              ? "bg-pink-900/30 text-pink-400 border border-pink-700/40 hover:bg-pink-900/50"
                              : "bg-emerald-900/30 text-emerald-400 border border-emerald-700/40 hover:bg-emerald-900/50"
                          }`}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          {task.status === "ACTIVE" ? "Tarik Kembali" : "Aktifkan"}
                        </button>
                        <button
                          onClick={() => onDeleteTask(task.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-900/30 text-red-400 border border-red-700/40 hover:bg-red-900/50 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
