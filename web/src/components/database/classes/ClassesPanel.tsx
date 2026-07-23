"use client";

import { FormEvent, useMemo, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import Link from "next/link";
import { callAdminDatabaseApi } from "@/lib/callAdminDatabaseApi";
import { DatabaseFormData, DatabaseRecord, defaultFormData, romanFromGrade } from "@/components/database/shared/databaseConfig";
import { useClassesRealtime } from "@/hooks/database/useClassesRealtime";
import { ClassFormModal } from "./ClassFormModal";
import { ClassesTable } from "./ClassesTable";
import { GradeFilter } from "./GradeFilter";

type ClassesPanelProps = {
  schoolId?: string;
};

export function ClassesPanel({ schoolId }: ClassesPanelProps) {
  const { data, loading, lastSyncTime } = useClassesRealtime(schoolId);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGrade, setSelectedGrade] = useState(7);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedRow, setSelectedRow] = useState<DatabaseRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<DatabaseFormData>(defaultFormData);

  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const byGrade = data.filter((row) => String(row.grade || "") === `Kelas ${selectedGrade}`);
    return byGrade.filter((row) => String(row.className || row.name || "").toLowerCase().includes(query));
  }, [data, searchQuery, selectedGrade]);

  const openAddModal = () => {
    setFormData({ ...defaultFormData, name: `${romanFromGrade(selectedGrade)}-A` });
    setSelectedRow(null);
    setModalMode("add");
    setIsModalOpen(true);
  };

  const openEditModal = (row: DatabaseRecord) => {
    setSelectedRow(row);
    const parsed = Number(String(row.grade || "").replace(/[^0-9]/g, ""));
    if (Number.isFinite(parsed) && parsed >= 1) setSelectedGrade(parsed);
    setFormData({
      ...defaultFormData,
      name: row.className || row.name || "",
      class: row.grade || "",
      status: row.status || "Aktif",
    });
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!schoolId) return;

    setIsSubmitting(true);
    try {
      const roman = romanFromGrade(selectedGrade);
      const raw = String(formData.name || "").trim();
      const normalized = raw.includes("-") ? raw : `${roman}-${raw.replace(/^[-\s]+/, "")}`;

      await callAdminDatabaseApi({
        action: modalMode === "add" ? "create" : "update",
        tab: "Kelas Paralel",
        id: selectedRow?.id,
        data: {
          className: normalized,
          grade: `Kelas ${selectedGrade}`,
          status: "Aktif",
        },
      });
      setIsModalOpen(false);
      setSelectedRow(null);
      setFormData(defaultFormData);
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan data kelas.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return;
    try {
      await callAdminDatabaseApi({
        action: "delete",
        tab: "Kelas Paralel",
        id,
      });
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Terjadi kesalahan saat menghapus data kelas.");
    }
  };

  return (
    <>
      <div className="flex items-center justify-between border-b border-white/10 bg-[#0b1228] px-8 py-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Manajemen Kelas Paralel</h1>
          <p className="mt-1 text-sm text-slate-400">Kelola data kelas paralel (Terhubung ke Database)</p>
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
            Tambah Kelas Paralel
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
        <GradeFilter selectedGrade={selectedGrade} onChange={setSelectedGrade} />

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Cari nama kelas..."
            className="w-full rounded-xl border border-white/10 bg-slate-900/50 py-3 pl-12 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <ClassesTable rows={filteredData} loading={loading} onEdit={openEditModal} onDelete={handleDelete} />
      </div>

      <ClassFormModal
        isOpen={isModalOpen}
        mode={modalMode}
        formData={formData}
        setFormData={setFormData}
        isSubmitting={isSubmitting}
        selectedGrade={selectedGrade}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </>
  );
}
