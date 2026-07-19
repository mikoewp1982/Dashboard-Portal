"use client";

import Link from "next/link";
import { useState } from "react";
import { useSuperAdminDatabase } from "@/hooks/super/useSuperAdminDatabase";
import { useAuthStore } from "@/store/useAuthStore";
import { Search, Lock, Download } from "lucide-react";

type SuperDbSection = "schools" | "admins" | "principals";

const SUPER_ADMIN_DATABASE_MENU = [
  ["schools", "Sekolah & Tenant"],
  ["admins", "Admin Sekolah"],
  ["principals", "Akun Kepala Sekolah"],
] as const;



export default function StandaloneDatabasePage() {
  const { user, loading: isAuthLoading } = useAuthStore();
  const [superSection, setSuperSection] = useState<SuperDbSection>("schools");
  
  const {
    superSchools,
    loading,
    superSaving,
    statusMsg,
    setStatusMsg,
    superSchoolForm,
    setSuperSchoolForm,
    superPrincipals,
    principalQuery,
    setPrincipalQuery,
    principalEditing,
    setPrincipalEditing,
    principalSaving,
    principalForm,
    setPrincipalForm,
    securityLogs,
    adminSchoolForm,
    setAdminSchoolForm,
    superSchoolAdmins,
    openAdminSchoolEditor,
    saveAdminSchoolRegistry,
    filteredSuperPrincipals,
    formatDateTime,
    upsertPrincipalAccount,
    startEditPrincipal,
    resetPrincipalDevice,
    resetPrincipalPassword,
    schoolsWithoutAdmin,
    schoolsWithoutPrincipal,
    superStats,
    saveSuperSchool,
    handleInject42Schools,
    toggleActive,
    bootstrapAdminLogin,
    resetAdminPassword
  } = useSuperAdminDatabase(isAuthLoading);









  if (isAuthLoading) {
    return <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">Memuat...</div>;
  }

  if (!user || user.role !== "super_admin") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
          <div className="text-sm font-semibold text-slate-300">Akses ditolak. Anda bukan Super Admin.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 lg:h-screen lg:overflow-hidden relative flex flex-col">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_circle_at_15%_10%,rgba(99,102,241,0.15),transparent_55%),radial-gradient(900px_circle_at_85%_15%,rgba(34,211,238,0.1),transparent_50%),radial-gradient(800px_circle_at_50%_90%,rgba(168,85,247,0.1),transparent_55%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950 to-black/80" />
      </div>

      <div className="relative z-10 h-full w-full px-4 py-5 sm:px-6 lg:flex lg:flex-col lg:overflow-hidden flex-1">
        <div className="grid items-start gap-5 lg:h-full lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-6 flex-1">
          {/* Inner Sidebar */}
          <aside className="min-w-0 lg:self-start lg:overflow-hidden lg:max-h-[calc(100vh-2.5rem)] lg:overflow-y-auto">
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 shadow-xl backdrop-blur-2xl">
              <div className="border-b border-white/10 px-5 py-5">
                <div className="text-sm font-semibold text-slate-200">Database Induk</div>
                <div className="mt-1 text-xs text-slate-400">Mode Super Admin (lintas sekolah)</div>
              </div>
              <div className="p-3 space-y-1">
                {SUPER_ADMIN_DATABASE_MENU.map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSuperSection(id)}
                    className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                      superSection === id
                        ? "bg-indigo-600/90 text-white shadow-lg shadow-indigo-900/20"
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="min-w-0 space-y-5 lg:space-y-6 lg:h-full lg:overflow-y-auto lg:pr-2 pb-10">
            {/* Header Section */}
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur-2xl sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Database Induk</div>
                  <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">Data Induk — Super Admin</h1>
                  <p className="mt-1 text-sm text-slate-300">
                    Pusat registrasi sekolah, admin sekolah, kepala sekolah, dan monitoring layanan lintas sekolah.
                  </p>
                </div>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                >
                  Kembali ke Dashboard Satu Pintu
                </Link>
              </div>
            </div>

            {/* Workflow Super Admin */}
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur-2xl sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">Workflow Super Admin</div>
                  <div className="mt-1 text-sm text-slate-300">
                    Alur kerja standar: (1) daftarkan sekolah → (2) buka akun admin sekolah → (3) buat akun kepala sekolah → (4) monitor layanan.
                  </div>
                </div>
                <div className="text-xs text-slate-400">
                  Step aktif:{" "}
                  <span className="font-semibold text-white">
                    {superSection === "schools" ? "1" : superSection === "admins" ? "2" : superSection === "principals" ? "3" : "-"}
                  </span>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setSuperSection("schools")}
                  className={`flex items-start gap-4 rounded-2xl border px-4 py-4 text-left transition ${
                    superSection === "schools"
                      ? "border-indigo-500/40 bg-indigo-500/10 shadow-lg shadow-indigo-500/5"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-sm font-extrabold text-slate-100 ring-1 ring-white/10">1</div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white">Sekolah & Tenant</div>
                    <div className="mt-1 text-xs text-slate-300">Daftarkan tenant, NPSN, identitas sekolah, dan status operasional sekolah.</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setSuperSection("admins")}
                  className={`flex items-start gap-4 rounded-2xl border px-4 py-4 text-left transition ${
                    superSection === "admins"
                      ? "border-indigo-500/40 bg-indigo-500/10 shadow-lg shadow-indigo-500/5"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-sm font-extrabold text-slate-100 ring-1 ring-white/10">2</div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white">Admin Sekolah</div>
                    <div className="mt-1 text-xs text-slate-300">Atur login admin sekolah, buka/tutup akses, dan reset password admin.</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setSuperSection("principals")}
                  className={`flex items-start gap-4 rounded-2xl border px-4 py-4 text-left transition ${
                    superSection === "principals"
                      ? "border-indigo-500/40 bg-indigo-500/10 shadow-lg shadow-indigo-500/5"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-sm font-extrabold text-slate-100 ring-1 ring-white/10">3</div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white">Kepala Sekolah</div>
                    <div className="mt-1 text-xs text-slate-300">Buat, ubah, reset, dan nonaktifkan akun kepala sekolah per sekolah.</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur-2xl">
                <div className="text-xs font-semibold tracking-widest text-slate-400">TENANTS</div>
                <div className="mt-2 text-3xl font-bold text-white">{superStats.tenantsTotal}</div>
                <div className="mt-1 text-sm text-slate-300">Total sekolah</div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur-2xl">
                <div className="text-xs font-semibold tracking-widest text-slate-400">ADMIN SEKOLAH</div>
                <div className="mt-2 text-3xl font-bold text-white">{superStats.adminsActive}</div>
                <div className="mt-1 text-sm text-slate-300">Akses admin sekolah aktif</div>
                <div className="mt-1 text-xs text-slate-400">Belum ada admin: {superStats.tenantsMissingAdmin}</div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur-2xl">
                <div className="text-xs font-semibold tracking-widest text-slate-400">KEPALA SEKOLAH</div>
                <div className="mt-2 text-3xl font-bold text-white">{superStats.principalsActive}</div>
                <div className="mt-1 text-sm text-slate-300">Akun kepala sekolah aktif</div>
                <div className="mt-2 text-xs text-slate-400">Belum ada kepala sekolah: {superStats.schoolsMissingPrincipalCount}</div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur-2xl">
                <div className="text-xs font-semibold tracking-widest text-slate-400">MONITORING</div>
                <div className="mt-2 text-3xl font-bold text-white">{superStats.tenantsLive}</div>
                <div className="mt-1 text-sm text-slate-300">Tenant sudah live</div>
                <div className="mt-1 text-xs text-slate-400">Log keamanan terbaru: {superStats.securityLogsCount}</div>
              </div>
            </div>

            {statusMsg.type && (
              <div className={`rounded-2xl border p-4 text-sm ${statusMsg.type === "success" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100" : "border-red-500/30 bg-red-500/10 text-red-100"}`}>
                {statusMsg.text}
              </div>
            )}

            {/* Content based on section */}
            {superSection === "schools" && (
              <div className="space-y-6">
                {/* Form Tambah/Update */}
                <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur-2xl sm:p-6">
                  <div className="text-sm font-semibold text-white">Tambah / Update Sekolah</div>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold tracking-widest text-slate-400">SCHOOL ID</label>
                      <input
                        value={superSchoolForm.schoolId}
                        onChange={(e) => setSuperSchoolForm((s) => ({ ...s, schoolId: e.target.value }))}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="contoh: smpn_3_pacet"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold tracking-widest text-slate-400">NAMA</label>
                      <input
                        value={superSchoolForm.name}
                        onChange={(e) => setSuperSchoolForm((s) => ({ ...s, name: e.target.value }))}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="SMPN 3 PACET"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold tracking-widest text-slate-400">KECAMATAN</label>
                      <input
                        value={superSchoolForm.district}
                        onChange={(e) => setSuperSchoolForm((s) => ({ ...s, district: e.target.value }))}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="Pacet"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold tracking-widest text-slate-400">NPSN</label>
                      <input
                        value={superSchoolForm.npsn}
                        onChange={(e) => setSuperSchoolForm((s) => ({ ...s, npsn: e.target.value }))}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="20555784"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold tracking-widest text-slate-400">EMAIL KONTAK LOGIN</label>
                      <input
                        value={superSchoolForm.authEmail}
                        onChange={(e) => setSuperSchoolForm((s) => ({ ...s, authEmail: e.target.value }))}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="email kontak login sekolah"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold tracking-widest text-slate-400">EMAIL KONTAK ADMIN</label>
                      <input
                        value={superSchoolForm.adminEmail}
                        onChange={(e) => setSuperSchoolForm((s) => ({ ...s, adminEmail: e.target.value }))}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="admin@sekolah.id"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold tracking-widest text-slate-400">EMAIL BACKUP</label>
                      <input
                        value={superSchoolForm.backupEmail}
                        onChange={(e) => setSuperSchoolForm((s) => ({ ...s, backupEmail: e.target.value }))}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="email backup"
                      />
                    </div>
                    <div className="flex items-center gap-3 sm:mt-8">
                      <input
                        id="schoolActiveSuper"
                        type="checkbox"
                        checked={superSchoolForm.isActive}
                        onChange={(e) => setSuperSchoolForm((s) => ({ ...s, isActive: e.target.checked }))}
                        className="h-4 w-4 rounded border-slate-700 bg-slate-950/50 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900"
                      />
                      <label htmlFor="schoolActiveSuper" className="text-sm font-semibold text-slate-200 cursor-pointer">
                        Tenant dibuka
                      </label>
                    </div>
                  </div>
                  <div className="mt-6">
                    <button
                      type="button"
                      disabled={superSaving}
                      onClick={saveSuperSchool}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600/90 px-6 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-white/10 transition hover:bg-indigo-500 disabled:opacity-60"
                    >
                      Simpan
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className="rounded-3xl border border-white/10 bg-slate-900/60 shadow-xl backdrop-blur-2xl overflow-hidden">
                  <div className="border-b border-white/10 px-5 py-4 sm:px-6">
                    <div className="text-sm font-semibold text-white">Daftar Sekolah ({superSchools.length})</div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/5 text-sm">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">SEKOLAH</th>
                          <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">NPSN</th>
                          <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">REGISTRY</th>
                          <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">OPERASIONAL</th>
                          <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">RELASI AKUN</th>
                          <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">UPDATED</th>
                          <th className="px-5 py-4 text-right text-xs font-semibold tracking-widest text-slate-400">AKSI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 bg-slate-950/20">
                        {loading ? (
                          <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-400">Memuat data...</td></tr>
                        ) : superSchools.length === 0 ? (
                          <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-400">Belum ada data sekolah.</td></tr>
                        ) : (
                          superSchools.map((s) => (
                            <tr key={s.schoolId} className="hover:bg-white/5 transition">
                              <td className="px-5 py-4">
                                <div className="font-bold text-slate-100">{s.name || "-"}</div>
                                <div className="mt-1 text-xs text-slate-400">{s.schoolId}</div>
                              </td>
                              <td className="px-5 py-4 text-slate-300">{s.npsn || "-"}</td>
                              <td className="px-5 py-4">
                                <span className="inline-flex items-center rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-200 ring-1 ring-slate-600">
                                  Terdaftar
                                </span>
                                <span className={`ml-2 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${s.isActive ? "bg-cyan-500/10 text-cyan-200 ring-cyan-500/30" : "bg-amber-500/10 text-amber-200 ring-amber-500/30"}`}>
                                  {s.isActive ? "Tenant Dibuka" : "Tenant Ditutup"}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                {s.authEmail && s.adminAccessActive ? (
                                  <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
                                    Login Siap
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded-full bg-yellow-500/10 px-2.5 py-1 text-xs font-semibold text-yellow-200 ring-1 ring-yellow-500/30">
                                    Login Belum Siap
                                  </span>
                                )}
                                <span className={`ml-2 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${s.isActive && s.authEmail ? "bg-cyan-500/10 text-cyan-200 ring-cyan-500/30" : "bg-slate-800 text-slate-300 ring-slate-600"}`}>
                                  {s.isActive && s.authEmail ? "Live" : "Belum Live"}
                                </span>
                              </td>
                              <td className="px-5 py-4 space-y-1.5">
                                <div className="text-xs text-slate-300">
                                  <span className="font-semibold text-slate-100">Tenant:</span> {s.isActive ? "dibuka" : "ditutup"}
                                </div>
                                <div className="text-xs text-slate-300">
                                  <span className="font-semibold text-slate-100">Akun:</span> {s.adminAccessActive ? "login admin dibuka" : "login admin ditutup"}
                                </div>
                              </td>
                              <td className="px-5 py-4 text-xs text-slate-400">
                                {s.updatedAt ? new Date(s.updatedAt).toLocaleString("id-ID") : "-"}
                              </td>
                              <td className="px-5 py-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => toggleActive(s.schoolId, !s.isActive)}
                                  className={`inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-xs font-semibold transition ring-1 ${
                                    s.isActive
                                      ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30 hover:bg-emerald-500/20"
                                      : "bg-red-500/10 text-red-300 ring-red-500/30 hover:bg-red-500/20"
                                  }`}
                                >
                                  {s.isActive ? "Nonaktifkan" : "Aktifkan"}
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            
            {superSection === "admins" && (
              <div className="space-y-6">
                <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur-2xl sm:p-6">
                  <div className="text-sm font-semibold text-white">Create / Edit Login Admin Sekolah</div>
                  <div className="mt-1 text-xs text-slate-400">Menu ini mengatur akun login admin seluruh sekolah untuk akses web PortalKita, bukan user internal sekolah.</div>
                  
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold tracking-widest text-slate-400">SEKOLAH</label>
                      <select
                        value={adminSchoolForm.schoolId}
                        onChange={(e) => {
                          const next = e.target.value;
                          const school = superSchools.find((s) => s.schoolId === next);
                          if (school) openAdminSchoolEditor(school);
                        }}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">Pilih sekolah</option>
                        {superSchools.map((s) => (
                          <option key={s.schoolId} value={s.schoolId}>
                            {s.name || s.schoolId}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold tracking-widest text-slate-400">NPSN</label>
                      <input
                        disabled
                        value={adminSchoolForm.npsn}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/30 px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                        placeholder="NPSN sekolah"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold tracking-widest text-slate-400">EMAIL KONTAK LOGIN</label>
                      <input
                        value={adminSchoolForm.authEmail}
                        onChange={(e) => setAdminSchoolForm((s) => ({ ...s, authEmail: e.target.value }))}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="20555784@edulock.local / email valid"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold tracking-widest text-slate-400">EMAIL KONTAK ADMIN</label>
                      <input
                        value={adminSchoolForm.adminEmail}
                        onChange={(e) => setAdminSchoolForm((s) => ({ ...s, adminEmail: e.target.value }))}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="admin@sekolah.id"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold tracking-widest text-slate-400">EMAIL BACKUP</label>
                      <input
                        value={adminSchoolForm.backupEmail}
                        onChange={(e) => setAdminSchoolForm((s) => ({ ...s, backupEmail: e.target.value }))}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="email backup admin sekolah"
                      />
                    </div>
                    <div className="flex items-center gap-3 sm:mt-8">
                      <input
                        id="adminSchoolTenantActive"
                        type="checkbox"
                        checked={adminSchoolForm.schoolActive}
                        onChange={(e) => setAdminSchoolForm((s) => ({ ...s, schoolActive: e.target.checked }))}
                        className="h-4 w-4 rounded border-slate-700 bg-slate-950/50 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900"
                      />
                      <label htmlFor="adminSchoolTenantActive" className="text-sm font-semibold text-slate-200 cursor-pointer">
                        Tenant dibuka
                      </label>
                    </div>
                    <div className="flex items-center gap-3 sm:mt-8">
                      <input
                        id="adminSchoolAccessActive"
                        type="checkbox"
                        checked={adminSchoolForm.adminAccessActive}
                        onChange={(e) => setAdminSchoolForm((s) => ({ ...s, adminAccessActive: e.target.checked }))}
                        className="h-4 w-4 rounded border-slate-700 bg-slate-950/50 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900"
                      />
                      <label htmlFor="adminSchoolAccessActive" className="text-sm font-semibold text-slate-200 cursor-pointer">
                        Login admin dibuka
                      </label>
                    </div>
                  </div>
                  
                  <div className="mt-8 flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={superSaving || !adminSchoolForm.schoolId}
                      onClick={saveAdminSchoolRegistry}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600/90 px-6 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-white/10 transition hover:bg-indigo-500 disabled:opacity-60"
                    >
                      Simpan Login Admin
                    </button>
                    <button
                      type="button"
                      disabled={superSaving || !adminSchoolForm.schoolId}
                      onClick={() => bootstrapAdminLogin(adminSchoolForm.schoolId, adminSchoolForm.npsn)}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/10 disabled:opacity-60"
                    >
                      Bootstrap Login Default
                    </button>
                    <button
                      type="button"
                      disabled={superSaving}
                      onClick={handleInject42Schools}
                      className="inline-flex items-center gap-2 rounded-xl bg-purple-600/90 px-6 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-white/10 transition hover:bg-purple-500 disabled:opacity-60"
                    >
                      Inject 42 Sekolah (Development)
                    </button>
                  </div>
                  {statusMsg.text && (
                    <div className={`mt-4 rounded-xl px-4 py-3 text-sm ${statusMsg.type === "error" ? "bg-red-500/10 text-red-400" : statusMsg.type === "success" ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"}`}>
                      {statusMsg.text}
                    </div>
                  )}
                  <div className="mt-3 text-xs text-slate-400">
                    'Simpan Login Admin' memperbarui registry sekolah sekaligus menyelaraskan status buka/tutup login admin. 'Bootstrap Login Default' membuat atau menyelaraskan akun runtime admin dengan username 'NPSN' dan password awal 'admin123'.
                  </div>
                </div>

                {/* Daftar Admin Sekolah */}
                <div className="rounded-3xl border border-white/10 bg-slate-900/60 shadow-xl backdrop-blur-2xl overflow-hidden">
                  <div className="border-b border-white/10 px-5 py-4 sm:px-6">
                    <div className="text-sm font-semibold text-white">Daftar Admin Sekolah ({superSchoolAdmins.length})</div>
                    <div className="mt-1 text-xs text-slate-400">Relasi tenant, akun login admin web, dan akun kepala sekolah ditampilkan bersama agar status tiap sekolah lebih eksplisit.</div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/5 text-sm">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">LOGIN ADMIN</th>
                          <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">NPSN</th>
                          <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">SEKOLAH</th>
                          <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">RELASI</th>
                          <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">LOGIN TERAKHIR</th>
                          <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">STATUS</th>
                          <th className="px-5 py-4 text-right text-xs font-semibold tracking-widest text-slate-400">AKSI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 bg-slate-950/20">
                        {superSchoolAdmins.length === 0 ? (
                          <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-400">Belum ada data admin.</td></tr>
                        ) : (
                          superSchoolAdmins.map((a) => (
                            <tr key={a.schoolId} className="hover:bg-white/5 transition">
                              <td className="px-5 py-4">
                                <div className="font-semibold text-white">{a.loginIdentifier || "-"}</div>
                                <div className="mt-1 text-xs text-slate-400">{a.npsn ? `Password default: admin123` : "Lengkapi NPSN sekolah"}</div>
                              </td>
                              <td className="px-5 py-4 text-slate-300 font-medium">
                                {a.npsn || "-"}
                              </td>
                              <td className="px-5 py-4">
                                <div className="text-slate-200">{a.schoolName || "-"}</div>
                                <div className="mt-1 text-xs text-slate-400">{a.schoolId}</div>
                              </td>
                              <td className="px-5 py-4 space-y-1.5">
                                <div className="text-xs text-slate-300">
                                  <span className="font-semibold text-slate-100">Tenant:</span> {a.schoolActive ? "dibuka" : "ditutup"}
                                </div>
                                <div className="text-xs text-slate-300">
                                  <span className="font-semibold text-slate-100">Registry:</span> {a.loginIdentifier || "belum dikonfigurasi"}
                                </div>
                                <div className="text-xs text-slate-300">
                                  <span className="font-semibold text-slate-100">Runtime:</span> {a.runtimeEmail || "belum siap"}
                                </div>
                              </td>
                              <td className="px-5 py-4 text-slate-300">{formatDateTime(a.runtimeLastLoginAt)}</td>
                              <td className="px-5 py-4 space-x-2">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${a.accessActive && a.schoolActive ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30" : "bg-red-500/10 text-red-300 ring-red-500/30"}`}>
                                  {a.accessActive && a.schoolActive ? "Login Dibuka" : "Login Ditutup"}
                                </span>
                                {a.runtimeLastLoginAt ? (
                                  <span className="inline-flex items-center rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-200 ring-1 ring-cyan-500/30">
                                    Live
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300 ring-1 ring-slate-600">
                                    Belum Live
                                  </span>
                                )}
                                {!a.schoolActive && (
                                  <span className="inline-flex items-center rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300 ring-1 ring-slate-600">Tenant Ditutup</span>
                                )}
                              </td>
                              <td className="px-5 py-4 text-right space-x-2">
                                <button
                                  type="button"
                                  onClick={() => openAdminSchoolEditor(superSchools.find(s => s.schoolId === a.schoolId)!)}
                                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:bg-white/10"
                                >
                                  Edit Login
                                </button>
                                <button
                                  type="button"
                                  disabled={superSaving}
                                  onClick={() => bootstrapAdminLogin(a.schoolId, a.npsn)}
                                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:bg-white/10 disabled:opacity-60"
                                >
                                  Bootstrap
                                </button>
                                <button
                                  type="button"
                                  disabled={superSaving}
                                  onClick={() => resetAdminPassword(a.schoolId, a.npsn)}
                                  className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-100 transition hover:bg-amber-500/20 disabled:opacity-60"
                                >
                                  Reset Password
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {superSection === "principals" && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-white">Tambah / Update Akun Kepala Sekolah</div>
                      <div className="mt-1 text-sm text-slate-300">
                        Akun ini dipakai untuk login APK Kepala Sekolah. Scope data terkunci lewat schoolId.
                      </div>
                    </div>
                    {principalEditing && (
                      <button
                        type="button"
                        onClick={() => {
                          setPrincipalEditing("");
                          setPrincipalForm({ username: "", name: "", schoolId: "", schoolName: "", password: "", isActive: true });
                        }}
                        className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/10"
                      >
                        Batal Edit
                      </button>
                    )}
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold tracking-widest text-slate-400">USERNAME</label>
                      <input
                        value={principalForm.username}
                        disabled={!!principalEditing}
                        onChange={(e) => setPrincipalForm((s) => ({ ...s, username: e.target.value }))}
                        className="mt-2 w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-400 disabled:opacity-60"
                        placeholder="contoh: kepsek_smpn3pacet"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold tracking-widest text-slate-400">NAMA</label>
                      <input
                        value={principalForm.name}
                        onChange={(e) => setPrincipalForm((s) => ({ ...s, name: e.target.value }))}
                        className="mt-2 w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-400"
                        placeholder="Nama Kepala Sekolah"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold tracking-widest text-slate-400">SCHOOL ID</label>
                      <select
                        value={principalForm.schoolId}
                        onChange={(e) => {
                          const next = e.target.value;
                          const school = superSchools.find((s) => s.schoolId === next);
                          setPrincipalForm((s) => ({ ...s, schoolId: next, schoolName: s.schoolName || school?.name || "" }));
                        }}
                        className="mt-2 w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white"
                      >
                        <option value="">Pilih sekolah</option>
                        {superSchools.map((s) => (
                          <option key={s.schoolId} value={s.schoolId}>
                            {s.name || s.schoolId}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold tracking-widest text-slate-400">SCHOOL NAME</label>
                      <input
                        value={principalForm.schoolName}
                        onChange={(e) => setPrincipalForm((s) => ({ ...s, schoolName: e.target.value }))}
                        className="mt-2 w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-400"
                        placeholder="Nama sekolah (otomatis dari registry)"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold tracking-widest text-slate-400">PASSWORD / NIP</label>
                      <input
                        value={principalForm.password}
                        onChange={(e) => setPrincipalForm((s) => ({ ...s, password: e.target.value }))}
                        className="mt-2 w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-400"
                        placeholder={principalEditing ? "Kosongkan jika tidak diubah" : "Wajib untuk akun baru"}
                      />
                      <div className="mt-1 text-xs text-slate-400">Tersimpan dengan Firebase Auth hash.</div>
                    </div>
                    <div className="flex items-center gap-2 sm:mt-7">
                      <input
                        id="principalActive"
                        type="checkbox"
                        checked={principalForm.isActive}
                        onChange={(e) => setPrincipalForm((s) => ({ ...s, isActive: e.target.checked }))}
                      />
                      <label htmlFor="principalActive" className="text-sm text-slate-200">
                        Akun aktif
                      </label>
                    </div>
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      disabled={principalSaving}
                      onClick={upsertPrincipalAccount}
                      className="inline-flex items-center gap-2 rounded-lg bg-indigo-600/90 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-white/10 hover:bg-indigo-600 disabled:opacity-60"
                    >
                      {principalSaving ? "Menyimpan..." : "Simpan"}
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-900/60 shadow-xl backdrop-blur overflow-hidden">
                  <div className="border-b border-white/10 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm font-semibold text-white">Akun Kepala Sekolah ({filteredSuperPrincipals.length})</div>
                      <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
                        <div className="relative w-full sm:w-96">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            value={principalQuery}
                            onChange={(e) => setPrincipalQuery(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-slate-800 pl-10 pr-3 py-2 text-sm text-white placeholder:text-slate-400"
                            placeholder="Cari username / nama / sekolah"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/10 text-sm">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold tracking-widest text-slate-300">AKUN</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold tracking-widest text-slate-300">SEKOLAH</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold tracking-widest text-slate-300">LOGIN TERAKHIR</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold tracking-widest text-slate-300">DEVICE</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold tracking-widest text-slate-300">STATUS</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold tracking-widest text-slate-300">AKSI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {filteredSuperPrincipals.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-slate-400">Belum ada akun kepala sekolah.</td>
                          </tr>
                        ) : (
                          filteredSuperPrincipals.map((p) => (
                            <tr key={p.username} className="hover:bg-white/5">
                              <td className="px-4 py-3">
                                <div className="font-semibold text-white">{p.username}</div>
                                <div className="text-xs text-slate-400">{p.name || "-"}</div>
                                <div className="mt-1 text-xs text-slate-500">Reset default: admin123</div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-slate-200">{p.schoolName || "-"}</div>
                                <div className="text-xs text-slate-400">{p.schoolId || ""}</div>
                              </td>
                              <td className="px-4 py-3 text-slate-200">{formatDateTime(p.lastLoginAt)}</td>
                              <td className="px-4 py-3 text-slate-200">{p.deviceId ? "Terikat" : "-"}</td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                    p.isActive ? "bg-emerald-500/10 text-emerald-100 ring-1 ring-emerald-400/20" : "bg-red-500/10 text-red-100 ring-1 ring-red-400/20"
                                  }`}
                                >
                                  {p.isActive ? "Aktif" : "Nonaktif"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right space-x-2">
                                <button
                                  type="button"
                                  onClick={() => startEditPrincipal(p)}
                                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-100 hover:bg-white/10"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => resetPrincipalDevice(p.username)}
                                  disabled={!p.deviceId}
                                  className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-40"
                                >
                                  Reset Device
                                </button>
                                <button
                                  type="button"
                                  onClick={() => resetPrincipalPassword(p.username)}
                                  className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-500/20"
                                >
                                  Reset Password
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {superSection !== "schools" && superSection !== "admins" && superSection !== "principals" && (
              <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-12 text-center shadow-xl backdrop-blur-2xl">
                <div className="text-slate-400">Menu <span className="font-semibold text-white">{SUPER_ADMIN_DATABASE_MENU.find(m => m[0] === superSection)?.[1]}</span> sedang dalam pengembangan.</div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
