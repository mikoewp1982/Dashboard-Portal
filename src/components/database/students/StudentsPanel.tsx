"use client";

import { FormEvent, useMemo, useState } from "react";
import { Activity, ArrowLeft, Clock3, Filter, Search, Smartphone, UserCheck, UserMinus } from "lucide-react";
import Link from "next/link";
import { callAdminDatabaseApi } from "@/lib/callAdminDatabaseApi";
import { useStudentsRealtime } from "@/hooks/database/useStudentsRealtime";
import { useClassesRealtime } from "@/hooks/database/useClassesRealtime";
import { useEduLockActiveSessions } from "@/hooks/edulock/useEduLockActiveSessions";
import { DatabaseBanner } from "@/components/database/shared/DatabaseBanner";
import { DatabaseFormData, DatabaseRecord, defaultFormData } from "@/components/database/shared/databaseConfig";
import { StudentFormModal } from "./StudentFormModal";
import { StudentsTable } from "./StudentsTable";
import { StudentToolbar } from "./StudentToolbar";

type StudentsPanelProps = {
  schoolId?: string;
};

type ActivityFilter = "all" | "active-now" | "active-today" | "active-7d" | "inactive" | "never";

const DAY_MS = 24 * 60 * 60 * 1000;

const getActivityStatus = (
  latestActivityAt: number | null,
  hasActiveEduLockSession: boolean
): DatabaseRecord["activityStatus"] => {
  if (hasActiveEduLockSession) return "ACTIVE_NOW";
  if (!latestActivityAt || latestActivityAt <= 0) return "NEVER";

  const age = Date.now() - latestActivityAt;
  if (age <= DAY_MS) return "ACTIVE_TODAY";
  if (age <= 7 * DAY_MS) return "ACTIVE_7D";
  return "INACTIVE";
};

const getActivityLabel = (status: DatabaseRecord["activityStatus"]) => {
  if (status === "ACTIVE_NOW") return "Sedang Aktif";
  if (status === "ACTIVE_TODAY") return "Aktif Hari Ini";
  if (status === "ACTIVE_7D") return "Aktif 7 Hari";
  if (status === "INACTIVE") return "Tidak Aktif >7 Hari";
  return "Belum Pernah Login";
};

export function StudentsPanel({ schoolId }: StudentsPanelProps) {
  const { data, loading, lastSyncTime, setLoading } = useStudentsRealtime(schoolId);
  const { data: classOptionsSource } = useClassesRealtime(schoolId);
  const { sessions: activeEduLockSessions } = useEduLockActiveSessions(schoolId || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState("all");
  const [selectedActivityFilter, setSelectedActivityFilter] = useState<ActivityFilter>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedRow, setSelectedRow] = useState<DatabaseRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [formData, setFormData] = useState<DatabaseFormData>(defaultFormData);

  const classOptions = useMemo(() => {
    const fromClasses = (classOptionsSource || []).map((c: { className?: string; name?: string; id?: string }) => c.className || c.name || c.id).filter(Boolean);
    const fromStudents = data.map((d) => d.class || d.className).filter(Boolean);
    const combined = Array.from(new Set([...fromClasses, ...fromStudents])) as string[];
    return combined.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
  }, [classOptionsSource, data]);

  const activityAwareData = useMemo(() => {
    const activeNisnSet = new Set(
      (activeEduLockSessions || [])
        .map((session) => String(session.nisn || "").trim())
        .filter(Boolean)
    );

    return data.map((row) => {
      const latestActivityAt = Math.max(Number(row.lastLoginAt || 0), Number(row.lastLoginEduLock || 0)) || null;
      const rowNisn = String(row.nisn || "").trim();
      const hasActiveEduLockSession = rowNisn ? activeNisnSet.has(rowNisn) : false;
      const activityStatus = getActivityStatus(latestActivityAt, hasActiveEduLockSession);

      return {
        ...row,
        latestActivityAt,
        hasActiveEduLockSession,
        activityStatus,
        activityLabel: getActivityLabel(activityStatus),
      } as DatabaseRecord;
    });
  }, [activeEduLockSessions, data]);

  const activitySummary = useMemo(() => {
    const activeNow = activityAwareData.filter((row) => row.activityStatus === "ACTIVE_NOW").length;
    const activeToday = activityAwareData.filter(
      (row) => row.activityStatus === "ACTIVE_NOW" || row.activityStatus === "ACTIVE_TODAY"
    ).length;
    const active7d = activityAwareData.filter(
      (row) =>
        row.activityStatus === "ACTIVE_NOW" ||
        row.activityStatus === "ACTIVE_TODAY" ||
        row.activityStatus === "ACTIVE_7D"
    ).length;
    const inactive = activityAwareData.filter((row) => row.activityStatus === "INACTIVE").length;
    const never = activityAwareData.filter((row) => row.activityStatus === "NEVER").length;

    return { activeNow, activeToday, active7d, inactive, never };
  }, [activityAwareData]);

  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return activityAwareData.filter((row) => {
      const rowClass = (row.class || row.className || "").trim();
      if (selectedClassFilter !== "all" && rowClass !== selectedClassFilter) {
        return false;
      }
      if (
        (selectedActivityFilter === "active-now" && row.activityStatus !== "ACTIVE_NOW") ||
        (selectedActivityFilter === "active-today" &&
          row.activityStatus !== "ACTIVE_NOW" &&
          row.activityStatus !== "ACTIVE_TODAY") ||
        (selectedActivityFilter === "active-7d" &&
          row.activityStatus !== "ACTIVE_NOW" &&
          row.activityStatus !== "ACTIVE_TODAY" &&
          row.activityStatus !== "ACTIVE_7D") ||
        (selectedActivityFilter === "inactive" && row.activityStatus !== "INACTIVE") ||
        (selectedActivityFilter === "never" && row.activityStatus !== "NEVER")
      ) {
        return false;
      }
      if (!query) return true;
      return (
        row.name?.toLowerCase().includes(query) ||
        row.nisn?.toLowerCase().includes(query) ||
        rowClass.toLowerCase().includes(query)
      );
    });
  }, [activityAwareData, searchQuery, selectedActivityFilter, selectedClassFilter]);

  const openAddModal = () => {
    setFormData(defaultFormData);
    setSelectedRow(null);
    setModalMode("add");
    setIsModalOpen(true);
  };

  const openEditModal = (row: DatabaseRecord) => {
    setSelectedRow(row);
    setFormData({
      name: row.name || "",
      nisn: row.nisn || "",
      nuptk: row.nuptk || "",
      class: row.class || "",
      position: row.position || "",
      status: row.status || "Aktif",
      gender: row.gender || "L",
      religion: row.religion || "ISLAM",
    });
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!schoolId) return;

    setIsSubmitting(true);
    try {
      await callAdminDatabaseApi({
        action: modalMode === "add" ? "create" : "update",
        tab: "Siswa",
        id: selectedRow?.id,
        data: { ...formData },
      });
      setIsModalOpen(false);
      setFormData(defaultFormData);
      setSelectedRow(null);
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan data siswa.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetGasDevice = async (row: DatabaseRecord) => {
    const studentName = row.name || row.nisn || row.id;
    if (!confirm(`Reset device GAS untuk siswa ${studentName}? Siswa dapat login ulang GAS di perangkat baru.`)) return;

    try {
      await callAdminDatabaseApi({
        action: "reset-gas-device",
        tab: "Siswa",
        id: row.id,
      });
      alert(`Device GAS untuk ${studentName} berhasil di-reset.`);
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Terjadi kesalahan saat mereset device GAS siswa.");
    }
  };

  const handleResetEduLockDevice = async (row: DatabaseRecord) => {
    const studentName = row.name || row.nisn || row.id;
    if (!confirm(`Reset device EduLock untuk siswa ${studentName}? Siswa dapat registrasi/login ulang EduLock di perangkat baru.`)) return;

    try {
      await callAdminDatabaseApi({
        action: "reset-edulock-device",
        tab: "Siswa",
        id: row.id,
      });
      alert(`Device EduLock untuk ${studentName} berhasil di-reset.`);
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Terjadi kesalahan saat mereset device EduLock siswa.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return;
    try {
      await callAdminDatabaseApi({
        action: "delete",
        tab: "Siswa",
        id,
      });
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Terjadi kesalahan saat menghapus data siswa.");
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus SEMUA data Siswa? Aksi ini tidak dapat dibatalkan!")) return;
    setIsDeletingAll(true);
    try {
      await callAdminDatabaseApi({
        action: "delete-all",
        tab: "Siswa",
      });
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Terjadi kesalahan saat menghapus semua data siswa.");
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <>
      <div className="flex items-center justify-between border-b border-white/10 bg-[#0b1228] px-8 py-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Manajemen Siswa</h1>
          <p className="mt-1 text-sm text-slate-400">Kelola data siswa (Terhubung ke Database)</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            Terakhir disinkronisasi: {lastSyncTime.toLocaleString("id-ID")}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StudentToolbar
            loading={loading}
            canDeleteAll={data.length > 0}
            isDeletingAll={isDeletingAll}
            onRefresh={handleRefresh}
            onDeleteAll={handleDeleteAll}
            onOpenAdd={openAddModal}
          />
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Dashboard Satu Pintu</span>
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8">
        <DatabaseBanner activeTab="Siswa" />

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <ActivitySummaryCard
            title="Sedang Aktif"
            value={activitySummary.activeNow}
            description="EduLock aktif realtime sekarang."
            icon={Activity}
            accentClass="border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
          />
          <ActivitySummaryCard
            title="Aktif Hari Ini"
            value={activitySummary.activeToday}
            description="Login/aktivitas GAS atau EduLock dalam 24 jam terakhir."
            icon={UserCheck}
            accentClass="border-blue-500/20 bg-blue-500/10 text-blue-300"
          />
          <ActivitySummaryCard
            title="Aktif 7 Hari"
            value={activitySummary.active7d}
            description="Masih terlihat memakai aplikasi dalam 7 hari terakhir."
            icon={Clock3}
            accentClass="border-cyan-500/20 bg-cyan-500/10 text-cyan-300"
          />
          <ActivitySummaryCard
            title="Tidak Aktif"
            value={activitySummary.inactive}
            description="Pernah login, tetapi tidak aktif lebih dari 7 hari."
            icon={UserMinus}
            accentClass="border-amber-500/20 bg-amber-500/10 text-amber-300"
          />
          <ActivitySummaryCard
            title="Belum Pernah Login"
            value={activitySummary.never}
            description="Belum ada jejak login GAS maupun EduLock."
            icon={Smartphone}
            accentClass="border-rose-500/20 bg-rose-500/10 text-rose-300"
          />
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Cari nama, NISN/NIP, atau kelas..."
              className="w-full rounded-xl border border-white/10 bg-slate-900/50 py-3 pl-12 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2 sm:w-64">
            <Filter className="h-4 w-4 text-blue-400 shrink-0" />
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3.5 py-3 text-sm font-medium text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">Semua Kelas ({data.length})</option>
              {classOptions.map((className) => {
                const count = data.filter((d) => (d.class || d.className) === className).length;
                return (
                  <option key={className} value={className}>
                    Kelas {className} ({count})
                  </option>
                );
              })}
            </select>
          </div>
          <div className="flex items-center gap-2 sm:w-64">
            <Activity className="h-4 w-4 text-emerald-400 shrink-0" />
            <select
              value={selectedActivityFilter}
              onChange={(e) => setSelectedActivityFilter(e.target.value as ActivityFilter)}
              className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3.5 py-3 text-sm font-medium text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">Semua Aktivitas ({activityAwareData.length})</option>
              <option value="active-now">Sedang Aktif ({activitySummary.activeNow})</option>
              <option value="active-today">Aktif Hari Ini ({activitySummary.activeToday})</option>
              <option value="active-7d">Aktif 7 Hari ({activitySummary.active7d})</option>
              <option value="inactive">Tidak Aktif ({activitySummary.inactive})</option>
              <option value="never">Belum Pernah Login ({activitySummary.never})</option>
            </select>
          </div>
        </div>

        <StudentsTable
          rows={filteredData}
          loading={loading}
          onEdit={openEditModal}
          onDelete={handleDelete}
          onResetGasDevice={handleResetGasDevice}
          onResetEduLockDevice={handleResetEduLockDevice}
        />
      </div>

      <StudentFormModal
        isOpen={isModalOpen}
        mode={modalMode}
        formData={formData}
        setFormData={setFormData}
        classes={classOptionsSource}
        isSubmitting={isSubmitting}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </>
  );
}

function ActivitySummaryCard({
  title,
  value,
  description,
  icon: Icon,
  accentClass,
}: {
  title: string;
  value: number;
  description: string;
  icon: typeof Activity;
  accentClass: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</div>
          <div className="mt-2 text-3xl font-black text-white">{value}</div>
          <p className="mt-2 text-xs leading-5 text-slate-400">{description}</p>
        </div>
        <div className={`rounded-xl border p-3 ${accentClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
