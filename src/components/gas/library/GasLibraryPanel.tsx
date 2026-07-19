"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { BookOpen, FileText, Book, BarChart3, Plus, Pencil, Trash2, RotateCcw, Clock, AlertCircle, Download } from "lucide-react";
import { useGasLibrary } from "@/hooks/gas/library/useGasLibrary";
import { useGasStudents } from "@/hooks/gas/useGasStudents";
import { useAuthStore } from "@/store/useAuthStore";
import { LibraryTaskModal } from "./LibraryTaskModal";
import { GasLibraryTabContent } from "./GasLibraryTabContent";

type LibraryTab = "loans" | "literacy" | "tasks" | "stats";
type TaskSubTab = "tasks" | "needs-grading" | "history";
type LiteracySubTab = "list" | "progress";

export function GasLibraryPanel({ schoolId }: { schoolId: string }) {
  const { user } = useAuthStore();
  const [selectedClass, setSelectedClass] = useState("");
  const { tasks, classes, literacyLogs, loading, refresh, addTask, updateTaskStatus, deleteTask } = useGasLibrary(schoolId, selectedClass);
  const { data: students } = useGasStudents(schoolId);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<LibraryTab>("tasks");
  const [taskSubTab, setTaskSubTab] = useState<TaskSubTab>("tasks");
  const [literacySubTab, setLiteracySubTab] = useState<LiteracySubTab>("list");

  const activeTasks = useMemo(() => tasks.filter(t => t.status === "ACTIVE"), [tasks]);
  const closedTasks = useMemo(() => tasks.filter(t => t.status === "CLOSED"), [tasks]);

  const displayedTasks = useMemo(() => {
    if (taskSubTab === "tasks") return activeTasks;
    if (taskSubTab === "history") return closedTasks;
    return [];
  }, [taskSubTab, activeTasks, closedTasks]);

  const stats = useMemo(() => ({
    active: activeTasks.length,
    pending: literacyLogs.filter((log) => ["SUBMITTED", "PENDING", "WAITING_REVIEW"].includes(String(log.status || "").toUpperCase())).length,
    draft: closedTasks.length,
  }), [activeTasks, closedTasks, literacyLogs]);

  const filteredLiteracyLogs = useMemo(() => {
    const selectedClassData = classes.find(c => c.id === selectedClass);
    const selectedClassName = selectedClassData ? selectedClassData.name : "";
    return literacyLogs.filter((log) => !selectedClassName || log.studentClass === selectedClassName);
  }, [classes, literacyLogs, selectedClass]);

  const literacyStudentStats = useMemo(() => {
    // Cari id kelas yang dipilih
    const selectedClassData = classes.find(c => c.id === selectedClass);
    const selectedClassName = selectedClassData ? selectedClassData.name : "";

    const filteredStudents = selectedClassName
      ? students.filter(s => (s as any).kelas === selectedClassName || (s as any).class === selectedClassName)
      : students;

    const completed: any[] = [];
    const incomplete: any[] = [];

    filteredStudents.forEach(student => {
      const studentLogs = literacyLogs.filter(log => 
        log.studentId === student.id || log.studentId === (student as any).nisn || log.nisn === (student as any).nisn
      );

      if (studentLogs.length > 0) {
        completed.push({
          ...student,
          laporanCount: studentLogs.length
        });
      } else {
        incomplete.push(student);
      }
    });

    return { completed, incomplete, total: filteredStudents.length };
  }, [students, literacyLogs, selectedClass, classes]);


  return (
    <div className="flex h-full flex-col p-6 space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            Panel Lentera Digital
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-900/40 text-emerald-400 border border-emerald-700/40 gap-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              Terhubung: Lentera Digital
            </span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Kelola tugas, laporan literasi, dan aktivitas perpustakaan digital{user?.schoolName ? ` untuk ${user.schoolName}` : ""}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => void refresh()}
            disabled={loading}
            className="inline-flex items-center gap-2 self-start rounded-lg bg-slate-800 px-4 py-2 text-sm font-bold text-slate-100 transition hover:bg-slate-700 disabled:opacity-50 cursor-pointer"
          >
            <RotateCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Muat Ulang
          </button>
          <Link
            href="/dashboard"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10 self-start"
          >
            Kembali ke Dashboard Satu Pintu
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="glass-effect-dark-card rounded-xl border border-slate-700 p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-400">Tugas Aktif</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-100">{stats.active}</h3>
          <p className="mt-1 text-xs text-slate-400">Tugas yang sudah diterbitkan ke siswa</p>
        </div>
        <div className="glass-effect-dark-card rounded-xl border border-slate-700 p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-400">Laporan Menunggu</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-100">{stats.pending}</h3>
          <p className="mt-1 text-xs text-slate-400">Ringkasan siswa yang masih perlu ditinjau</p>
        </div>
        <div className="glass-effect-dark-card rounded-xl border border-slate-700 p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-400">Draft Tersimpan</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-100">{stats.draft}</h3>
          <p className="mt-1 text-xs text-slate-400">Tugas yang belum diterbitkan ke sekolah Anda</p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="border-b border-slate-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("loans")}
            className={`cursor-pointer flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
              activeTab === "loans"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:border-slate-500 hover:text-slate-300"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            Peminjaman Buku
          </button>
          <button
            onClick={() => setActiveTab("literacy")}
            className={`cursor-pointer flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
              activeTab === "literacy"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:border-slate-500 hover:text-slate-300"
            }`}
          >
            <FileText className="h-4 w-4" />
            Laporan Literasi
            <span className="ml-1 rounded-full bg-blue-900/40 border border-blue-700/40 px-2 py-0.5 text-xs font-medium text-blue-300">
              0
            </span>
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            className={`cursor-pointer flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
              activeTab === "tasks"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:border-slate-500 hover:text-slate-300"
            }`}
          >
            <Book className="h-4 w-4" />
            Tugas Literasi
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`cursor-pointer flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
              activeTab === "stats"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:border-slate-500 hover:text-slate-300"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Statistik
          </button>
        </nav>
      </div>

      <GasLibraryTabContent
        activeTab={activeTab}
        taskSubTab={taskSubTab}
        literacySubTab={literacySubTab}
        selectedClass={selectedClass}
        classes={classes}
        filteredLiteracyLogs={filteredLiteracyLogs}
        literacyStudentStats={literacyStudentStats}
        loading={loading}
        displayedTasks={displayedTasks}
        onClassChange={setSelectedClass}
        onTaskSubTabChange={setTaskSubTab}
        onLiteracySubTabChange={setLiteracySubTab}
        onOpenModal={() => setIsModalOpen(true)}
        onUpdateTaskStatus={updateTaskStatus}
        onDeleteTask={deleteTask}
      />

      <LibraryTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        classes={classes}
        userName={user?.name || "Admin"}
        onSave={addTask}
      />
    </div>
  );
}
