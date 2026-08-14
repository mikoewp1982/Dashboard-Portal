"use client";

import { useRef, useState } from "react";
import { Download, FileSpreadsheet, Plus, RefreshCw, Trash2, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { callAdminDatabaseApi } from "@/lib/callAdminDatabaseApi";

type StudentToolbarProps = {
  loading: boolean;
  canDeleteAll: boolean;
  isDeletingAll: boolean;
  onRefresh: () => void;
  onDeleteAll: () => void;
  onOpenAdd: () => void;
};

export function StudentToolbar({
  loading,
  canDeleteAll,
  isDeletingAll,
  onRefresh,
  onDeleteAll,
  onOpenAdd,
}: StudentToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleDownloadTemplate = () => {
    const data = [
      {
        "NISN": "1234567890",
        "Nama Lengkap": "Contoh Nama Siswa",
        "Kelas": "VII-A",
        "Jenis Kelamin (L/P)": "L",
        "Agama": "ISLAM",
        "Status (Aktif/Nonaktif)": "Aktif",
      },
    ];
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "TemplateSiswa");
    XLSX.writeFile(workbook, "Template_Data_Siswa.xlsx");
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const worksheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[worksheetName];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

      if (jsonData.length === 0) {
        throw new Error("File excel kosong atau format tidak sesuai.");
      }

      const bulkData = jsonData.map((row) => {
        // Map excel columns to database fields
        const nisn = String(row["NISN"] || row["nisn"] || row["Nisn"] || "").trim();
        const name = String(row["Nama Lengkap"] || row["Nama"] || row["name"] || "").trim();
        const className = String(row["Kelas"] || row["class"] || "").trim();
        const genderRaw = String(row["Jenis Kelamin (L/P)"] || row["L/P"] || row["gender"] || "L").trim().toUpperCase();
        const gender = genderRaw.startsWith("P") ? "P" : "L";
        const religionRaw = String(row["Agama"] || row["religion"] || "ISLAM").trim().toUpperCase();
        const statusRaw = String(row["Status (Aktif/Nonaktif)"] || row["Status"] || "Aktif").trim();

        return {
          nisn,
          name,
          class: className,
          className: className,
          gender,
          religion: religionRaw,
          status: statusRaw,
        };
      }).filter(item => item.nisn && item.name); // Hanya insert yang punya NISN dan Nama

      if (bulkData.length === 0) {
        throw new Error("Tidak ada baris valid yang ditemukan. Pastikan kolom NISN dan Nama Lengkap terisi.");
      }

      await callAdminDatabaseApi({
        action: "import-excel",
        tab: "Siswa",
        bulkData,
      });

      alert(`Berhasil mengimpor ${bulkData.length} data siswa.`);
      onRefresh(); // Refresh table
    } catch (error) {
      console.error("Gagal import excel:", error);
      alert(error instanceof Error ? error.message : "Terjadi kesalahan saat membaca file excel.");
    } finally {
      setIsImporting(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={onRefresh}
        className="flex items-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-600/20 px-4 py-2 text-sm font-semibold text-indigo-400 transition hover:bg-indigo-600/30"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        Muat Ulang Data
      </button>
      <button
        onClick={onDeleteAll}
        disabled={isDeletingAll || !canDeleteAll}
        className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
        {isDeletingAll ? "Menghapus..." : "Hapus Semua"}
      </button>

      {/* Hidden file input for Excel import */}
      <input
        type="file"
        accept=".xlsx, .xls"
        ref={fileInputRef}
        onChange={handleImportExcel}
        className="hidden"
      />
      <button 
        onClick={() => fileInputRef.current?.click()}
        disabled={isImporting}
        className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/30 disabled:opacity-50"
      >
        {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
        {isImporting ? "Mengimpor..." : "Import Excel"}
      </button>

      <button 
        onClick={handleDownloadTemplate}
        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
      >
        <Download className="h-4 w-4" />
        Download Template
      </button>
      <button
        onClick={onOpenAdd}
        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
      >
        <Plus className="h-4 w-4" />
        Tambah Siswa
      </button>
    </div>
  );
}
