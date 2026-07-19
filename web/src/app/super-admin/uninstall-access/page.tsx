"use client";

import { useMemo, useState } from "react";
import QRCode from "react-qr-code";
import { SuperAdminPageLayout } from "@/components/super-admin/SuperAdminPageLayout";
import { useSuperAdminLiveData } from "@/hooks/super-admin/useSuperAdminLiveData";
import { useEduLockUninstallAccess } from "@/hooks/edulock/useEduLockUninstallAccess";
import { callSuperAdminApi } from "@/lib/callSuperAdminApi";

function formatDateTime(ts: number | null | undefined): string {
  if (!ts) return "-";
  return new Date(ts).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function hasActiveUninstallCode(access: { code: string; expiresAt: number | null } | null) {
  return Boolean(access?.code && access.expiresAt && access.expiresAt > Date.now());
}

export default function UninstallAccessPage() {
  const { loading, schools, metrics } = useSuperAdminLiveData();
  const [search, setSearch] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("10");
  const [commandSaving, setCommandSaving] = useState(false);
  const [commandMessage, setCommandMessage] = useState("");

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return schools;

    return schools.filter((row) =>
      [row.name, row.schoolId, row.npsn, row.district, row.authEmail, row.adminEmail]
        .some((value) => String(value || "").toLowerCase().includes(keyword))
    );
  }, [schools, search]);

  const effectiveSelectedSchoolId = useMemo(() => {
    if (filteredRows.length === 0) return "";
    const stillExists = filteredRows.some((row) => row.schoolId === selectedSchoolId);
    return stillExists ? selectedSchoolId : filteredRows[0].schoolId;
  }, [filteredRows, selectedSchoolId]);

  const selectedSchool = useMemo(
    () => schools.find((row) => row.schoolId === effectiveSelectedSchoolId) || null,
    [effectiveSelectedSchoolId, schools]
  );

  const activeLoginCount = useMemo(
    () => schools.filter((row) => Boolean(row.authEmail || row.adminEmail)).length,
    [schools]
  );

  const { access: uninstallAccess, loading: uninstallLoading } = useEduLockUninstallAccess(effectiveSelectedSchoolId);
  const uninstallQrValue = useMemo(() => {
    if (!selectedSchool || !uninstallAccess?.code) return "";

    return JSON.stringify({
      type: "EDULOCK_UNINSTALL_ACCESS",
      schoolId: selectedSchool.schoolId,
      schoolName: selectedSchool.name || "",
      code: uninstallAccess.code,
      expiresAt: uninstallAccess.expiresAt || null,
      updatedAt: uninstallAccess.updatedAt || null,
    });
  }, [selectedSchool, uninstallAccess]);

  const handleCreateUninstallCode = async () => {
    if (!effectiveSelectedSchoolId) {
      setCommandMessage("Pilih tenant terlebih dahulu.");
      return;
    }

    setCommandSaving(true);
    setCommandMessage("");
    try {
      await callSuperAdminApi("POST", {
        action: "create-edulock-uninstall-code",
        schoolId: effectiveSelectedSchoolId,
        durationMinutes: Number(durationMinutes || 10),
      });
      setCommandMessage("Kode uninstall EduLock berhasil dibuat dan langsung disinkronkan ke panel Admin Web.");
    } catch (error: unknown) {
      setCommandMessage(error instanceof Error ? error.message : "Gagal membuat kode uninstall EduLock.");
    } finally {
      setCommandSaving(false);
    }
  };

  const handleClearUninstallCode = async () => {
    if (!effectiveSelectedSchoolId) {
      setCommandMessage("Pilih tenant terlebih dahulu.");
      return;
    }

    setCommandSaving(true);
    setCommandMessage("");
    try {
      await callSuperAdminApi("POST", {
        action: "clear-edulock-uninstall-code",
        schoolId: effectiveSelectedSchoolId,
      });
      setCommandMessage("Kode uninstall EduLock berhasil dihapus.");
    } catch (error: unknown) {
      setCommandMessage(error instanceof Error ? error.message : "Gagal menghapus kode uninstall EduLock.");
    } finally {
      setCommandSaving(false);
    }
  };

  return (
    <SuperAdminPageLayout
      title="EduLock Uninstall Access"
      description="Halaman primer untuk membuat, memantau, dan menghapus kode uninstall EduLock per tenant secara realtime."
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">TOTAL TENANT</div>
          <div className="mt-3 text-3xl font-bold text-white">{metrics.totalSchools}</div>
          <div className="mt-1 text-xs text-slate-400">Semua sekolah</div>
        </article>
        <article className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">LAYANAN AKTIF</div>
          <div className="mt-3 text-3xl font-bold text-emerald-300">{metrics.activeSchools}</div>
          <div className="mt-1 text-xs text-slate-400">Tenant aktif</div>
        </article>
        <article className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">LOGIN DIBUKA</div>
          <div className="mt-3 text-3xl font-bold text-cyan-300">{activeLoginCount}</div>
          <div className="mt-1 text-xs text-slate-400">Admin siap login</div>
        </article>
        <article className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">TENANT TERPILIH</div>
          <div className="mt-3 text-lg font-bold text-white">{selectedSchool?.name || "-"}</div>
          <div className="mt-1 text-xs text-slate-400">{selectedSchool?.schoolId || "Belum pilih tenant"}</div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.95fr)]">
        <article className="rounded-3xl border border-white/10 bg-slate-900/60 shadow-xl backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-5">
            <div>
              <div className="text-sm font-semibold text-white">Pilih Tenant EduLock</div>
              <div className="mt-1 text-sm text-slate-400">
                Pilih sekolah target untuk mengelola uninstall access pada node `school_settings/[schoolId]/system/edulock/uninstall_access`.
              </div>
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari schoolId / nama sekolah / NPSN..."
              className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-500 sm:w-80"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/5 text-sm">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">SEKOLAH</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">NPSN / KECAMATAN</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">LOGIN ADMIN</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">LAYANAN</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-slate-950/20">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-slate-400">Memuat...</td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-slate-400">Tidak ada tenant yang cocok.</td>
                  </tr>
                ) : (
                  filteredRows.map((row) => {
                    const isSelected = row.schoolId === effectiveSelectedSchoolId;
                    return (
                      <tr key={row.schoolId} className={isSelected ? "bg-cyan-500/5" : "hover:bg-white/5"}>
                        <td className="px-5 py-4">
                          <div className="font-semibold text-white">{row.name || "-"}</div>
                          <div className="mt-1 text-xs text-slate-400">{row.schoolId}</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-slate-200">{row.npsn || "-"}</div>
                          <div className="mt-1 text-xs text-slate-400">{row.district || "-"}</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-slate-200">{row.npsn || row.authEmail || row.adminEmail || "-"}</div>
                          <div className="mt-1 text-xs text-slate-400">
                            {row.adminAccessActive ? "Login dibuka" : "Login ditutup"}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                            row.isActive ? "bg-emerald-500/10 text-emerald-200" : "bg-rose-500/10 text-rose-200"
                          }`}>
                            {row.isActive ? "Layanan Aktif" : "Layanan Nonaktif"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() => setSelectedSchoolId(row.schoolId)}
                            className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                              isSelected
                                ? "border border-cyan-500/30 bg-cyan-500/10 text-cyan-100"
                                : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                            }`}
                          >
                            {isSelected ? "Tenant Aktif Dipilih" : "Pilih Tenant"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-3xl border border-cyan-500/20 bg-slate-900/70 p-6 shadow-xl backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-white">Panel Uninstall Access</div>
              <div className="mt-1 text-sm text-slate-400">
                Kontrol kritikal kode uninstall EduLock untuk tenant yang sedang dipilih.
              </div>
            </div>
            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-100">
              {selectedSchool ? (selectedSchool.name || selectedSchool.schoolId) : "Belum pilih tenant"}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/30 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">STATUS KODE UNINSTALL</div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                hasActiveUninstallCode(uninstallAccess)
                  ? "bg-emerald-500/10 text-emerald-200"
                  : "bg-slate-700/60 text-slate-200"
              }`}>
                {uninstallLoading ? "Memuat..." : hasActiveUninstallCode(uninstallAccess) ? "Kode Aktif" : "Belum Ada Kode Aktif"}
              </span>
              <span className="text-xs text-slate-400">
                Kedaluwarsa: {formatDateTime(uninstallAccess?.expiresAt)}
              </span>
            </div>
            <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 font-mono text-sm text-cyan-100">
              {uninstallLoading ? "Memuat kode..." : uninstallAccess?.code || "-"}
            </div>
            <div className="mt-3 text-xs text-slate-400">
              Updated: {formatDateTime(uninstallAccess?.updatedAt)} | Created by: {uninstallAccess?.createdByUid || "-"}
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/30 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">BARCODE SCAN</div>
            {!hasActiveUninstallCode(uninstallAccess) || !uninstallQrValue ? (
              <div className="mt-3 rounded-xl border border-dashed border-white/10 bg-slate-950/40 px-4 py-6 text-center text-sm text-slate-400">
                Barcode akan muncul setelah kode uninstall aktif tersedia.
              </div>
            ) : (
              <div className="mt-4 flex flex-col items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-5">
                <div className="rounded-2xl bg-white p-3 shadow-lg shadow-cyan-950/20">
                  <QRCode value={uninstallQrValue} size={168} />
                </div>
                <div className="text-center text-xs text-slate-400">
                  Scan barcode ini untuk mengambil payload kode uninstall tenant terpilih.
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/30 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">DETAIL TENANT</div>
            <div className="mt-3 space-y-2 text-sm text-slate-200">
              <div>Nama: {selectedSchool?.name || "-"}</div>
              <div>School ID: {selectedSchool?.schoolId || "-"}</div>
              <div>NPSN: {selectedSchool?.npsn || "-"}</div>
              <div>Login admin: {selectedSchool ? (selectedSchool.npsn || selectedSchool.authEmail || selectedSchool.adminEmail || "-") : "-"}</div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/30 p-4">
            <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              DURASI KODE (MENIT)
            </label>
            <input
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-500"
              inputMode="numeric"
              placeholder="10"
            />
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={commandSaving || !effectiveSelectedSchoolId}
                onClick={handleCreateUninstallCode}
                className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {commandSaving ? "Memproses..." : "Buat Kode"}
              </button>
              <button
                type="button"
                disabled={commandSaving || !effectiveSelectedSchoolId}
                onClick={handleClearUninstallCode}
                className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Hapus Kode
              </button>
            </div>
            {commandMessage && (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                {commandMessage}
              </div>
            )}
          </div>
        </article>
      </section>
    </SuperAdminPageLayout>
  );
}
