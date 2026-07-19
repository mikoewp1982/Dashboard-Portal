"use client";

import { FormEvent, useMemo, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import Link from "next/link";
import { callAdminDatabaseApi } from "@/lib/callAdminDatabaseApi";
import { DatabaseBanner } from "@/components/database/shared/DatabaseBanner";
import { DatabaseFormData, DatabaseRecord, defaultFormData } from "@/components/database/shared/databaseConfig";
import { useStaffRealtime } from "@/hooks/database/useStaffRealtime";
import { useStudentsLookup } from "@/hooks/database/useStudentsLookup";
import { StaffFormModal } from "./StaffFormModal";
import { StaffTable } from "./StaffTable";

type StaffPanelProps = {
  schoolId?: string;
};

export function StaffPanel({ schoolId }: StaffPanelProps) {
  const { data, loading, lastSyncTime } = useStaffRealtime(schoolId);
  const studentsByNisn = useStudentsLookup("Petugas OSIS", schoolId);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedRow, setSelectedRow] = useState<DatabaseRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<DatabaseFormData>(defaultFormData);

  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return data.filter((row) => row.name?.toLowerCase().includes(query) || row.nisn?.toLowerCase().includes(query));
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
      const nisnKey = String(formData.nisn || "").trim();
      const found = studentsByNisn[nisnKey];
      if (!found?.name || !found?.class) {
        throw new Error("NISN siswa tidak ditemukan di Database Siswa. Tambahkan siswa dulu atau pastikan NISN benar.");
      }

      await callAdminDatabaseApi({
        action: modalMode === "add" ? "create" : "update",
        tab: "Petugas OSIS",
        id: selectedRow?.id,
        data: {
          nisn: nisnKey,
          name: found.name,
          class: found.class,
          position: formData.position || "",
          status: "Aktif",
        },
      });
      setIsModalOpen(false);
      setFormData(defaultFormData);
      setSelectedRow(null);
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan data petugas OSIS.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return;
    try {
      await callAdminDatabaseApi({
        action: "delete",
        tab: "Petugas OSIS",
        id,
      });
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Terjadi kesalahan saat menghapus data petugas OSIS.");
    }
  };

  return (
    <>
      <div className="flex items-center justify-between border-b border-white/10 bg-[#0b1228] px-8 py-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Manajemen Petugas OSIS</h1>
          <p className="mt-1 text-sm text-slate-400">Kelola data petugas OSIS (Terhubung ke Database)</p>
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
            Tambah Petugas OSIS
          </button>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8">
        <DatabaseBanner activeTab="Petugas OSIS" />

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Cari nama atau NISN petugas OSIS..."
            className="w-full rounded-xl border border-white/10 bg-slate-900/50 py-3 pl-12 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <StaffTable rows={filteredData} loading={loading} onEdit={openEditModal} onDelete={handleDelete} />
      </div>

      <StaffFormModal
        isOpen={isModalOpen}
        mode={modalMode}
        formData={formData}
        setFormData={setFormData}
        isSubmitting={isSubmitting}
        studentsByNisn={studentsByNisn}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </>
  );
}
