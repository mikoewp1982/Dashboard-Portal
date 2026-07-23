"use client";

import { FormEvent, useMemo, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import Link from "next/link";
import { callAdminDatabaseApi } from "@/lib/callAdminDatabaseApi";
import { DatabaseBanner } from "@/components/database/shared/DatabaseBanner";
import { DatabaseFormData, DatabaseRecord, defaultFormData } from "@/components/database/shared/databaseConfig";
import { useClassesRealtime } from "@/hooks/database/useClassesRealtime";
import { useTeachersRealtime } from "@/hooks/database/useTeachersRealtime";
import { TeacherFormModal } from "./TeacherFormModal";
import { TeachersTable } from "./TeachersTable";

type TeachersPanelProps = {
  schoolId?: string;
};

export function TeachersPanel({ schoolId }: TeachersPanelProps) {
  const { data, loading, lastSyncTime } = useTeachersRealtime(schoolId);
  const { data: classOptionsSource } = useClassesRealtime(schoolId);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedRow, setSelectedRow] = useState<DatabaseRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<DatabaseFormData>(defaultFormData);

  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return data.filter((row) => row.name?.toLowerCase().includes(query) || row.nuptk?.toLowerCase().includes(query) || row.class?.toLowerCase().includes(query));
  }, [data, searchQuery]);

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
        tab: "Guru/Wali Kelas",
        id: selectedRow?.id,
        data: {
          name: formData.name,
          nuptk: formData.nuptk,
          class: formData.class,
          status: "Aktif",
        },
      });
      setIsModalOpen(false);
      setFormData(defaultFormData);
      setSelectedRow(null);
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan data guru.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return;
    try {
      await callAdminDatabaseApi({
        action: "delete",
        tab: "Guru/Wali Kelas",
        id,
      });
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Terjadi kesalahan saat menghapus data guru.");
    }
  };

  return (
    <>
      <div className="flex items-center justify-between border-b border-white/10 bg-[#0b1228] px-8 py-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Manajemen Guru/Wali Kelas</h1>
          <p className="mt-1 text-sm text-slate-400">Kelola data guru/wali kelas (Terhubung ke Database)</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            Terakhir disinkronisasi: {lastSyncTime.toLocaleString("id-ID")}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            Tambah Guru/Wali Kelas
          </button>
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
        <DatabaseBanner activeTab="Guru/Wali Kelas" />

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Cari nama guru, NUPTK, atau kelas..."
            className="w-full rounded-xl border border-white/10 bg-slate-900/50 py-3 pl-12 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <TeachersTable rows={filteredData} loading={loading} onEdit={openEditModal} onDelete={handleDelete} />
      </div>

      <TeacherFormModal
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
