"use client";

import { useMemo, useState } from "react";
import { SuperAdminPageLayout } from "@/components/super-admin/SuperAdminPageLayout";
import { useSuperAdminLiveData } from "@/hooks/super-admin/useSuperAdminLiveData";

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

function formatRelativeLogin(ts: number | null | undefined): string {
  if (!ts) return "Belum pernah login";

  const diffMs = Date.now() - ts;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Aktif < 1 jam";
  if (diffHours < 24) return `Aktif ${diffHours} jam lalu`;
  return `Aktif ${diffDays} hari lalu`;
}

export default function SuperAdminMonitoringPage() {
  const { loading, schools, principals, securityLogs, metrics } = useSuperAdminLiveData();
  const [search, setSearch] = useState("");

  const activeUserRows = useMemo(() => {
    const adminRows = schools
      .filter((row) => Boolean(row.authEmail || row.adminEmail))
      .map((row) => ({
        id: `admin-${row.schoolId}`,
        name: row.name || row.schoolId,
        schoolId: row.schoolId,
        role: "Admin Sekolah",
        identifier: row.npsn || row.authEmail || row.adminEmail || "-",
        status: row.isActive && row.adminAccessActive ? "LOGIN DIBUKA" : "LOGIN DITUTUP",
        lastLoginAt: row.lastLoginAt,
      }));

    const principalRows = principals.map((row) => ({
      id: `principal-${row.username}`,
      name: row.name || row.username || "-",
      schoolId: row.schoolId,
      role: "Kepala Sekolah",
      identifier: row.username || row.npsn || "-",
      status: row.isActive ? "AKUN AKTIF" : "AKUN NONAKTIF",
      lastLoginAt: row.lastLoginAt,
    }));

    const keyword = search.trim().toLowerCase();
    const merged = [...adminRows, ...principalRows].sort((a, b) => (b.lastLoginAt || 0) - (a.lastLoginAt || 0));

    if (!keyword) return merged;

    return merged.filter((row) =>
      [row.name, row.schoolId, row.role, row.identifier, row.status]
        .some((value) => String(value || "").toLowerCase().includes(keyword))
    );
  }, [principals, schools, search]);

  const filteredSecurityLogs = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return securityLogs;

    return securityLogs.filter((row) =>
      [row.username, row.accountType, row.activity]
        .some((value) => String(value || "").toLowerCase().includes(keyword))
    );
  }, [search, securityLogs]);

  return (
    <SuperAdminPageLayout
      title="Monitoring"
      description="Pusat pemantauan aktivitas user lintas sekolah, status login akun inti, dan jejak keamanan super admin."
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">ADMIN TERPROVISI</div>
          <div className="mt-3 text-3xl font-bold text-cyan-300">{metrics.totalAdminSchools}</div>
          <div className="mt-1 text-xs text-slate-400">Akun admin sekolah tersedia</div>
        </article>
        <article className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">KEPSEK AKTIF</div>
          <div className="mt-3 text-3xl font-bold text-emerald-300">{metrics.totalPrincipalAccounts}</div>
          <div className="mt-1 text-xs text-slate-400">Akun kepala sekolah aktif</div>
        </article>
        <article className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">TENANT PERLU ATENSI</div>
          <div className="mt-3 text-3xl font-bold text-amber-300">{metrics.tenantIssues}</div>
          <div className="mt-1 text-xs text-slate-400">Gap akun atau layanan</div>
        </article>
        <article className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">SECURITY LOGS</div>
          <div className="mt-3 text-3xl font-bold text-white">{metrics.auditLogs}</div>
          <div className="mt-1 text-xs text-slate-400">Log keamanan terekam</div>
        </article>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-900/60 shadow-xl backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div>
            <div className="text-sm font-semibold text-white">Monitoring Aktivitas User</div>
            <div className="mt-1 text-sm text-slate-400">
              Memantau admin sekolah dan kepala sekolah berdasarkan aktivitas login terakhir yang tercatat.
            </div>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari pengguna / schoolId / role / aktivitas..."
            className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-blue-500 sm:w-80"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/5 text-sm">
            <thead className="bg-white/5">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">PENGGUNA</th>
                <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">ROLE</th>
                <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">IDENTITAS</th>
                <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">SEKOLAH</th>
                <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">AKTIVITAS TERAKHIR</th>
                <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-slate-950/20">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">Memuat...</td>
                </tr>
              ) : activeUserRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">Belum ada data aktivitas pengguna.</td>
                </tr>
              ) : (
                activeUserRows.map((row) => (
                  <tr key={row.id} className="hover:bg-white/5">
                    <td className="px-5 py-4 font-semibold text-white">{row.name}</td>
                    <td className="px-5 py-4 text-slate-200">{row.role}</td>
                    <td className="px-5 py-4 text-slate-200">{row.identifier}</td>
                    <td className="px-5 py-4 text-slate-200">{row.schoolId || "-"}</td>
                    <td className="px-5 py-4">
                      <div className="text-slate-200">{formatDateTime(row.lastLoginAt)}</div>
                      <div className="mt-1 text-xs text-slate-400">{formatRelativeLogin(row.lastLoginAt)}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                        row.status.includes("DIBUKA") || row.status.includes("AKTIF")
                          ? "bg-emerald-500/10 text-emerald-200"
                          : "bg-rose-500/10 text-rose-200"
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-900/60 shadow-xl backdrop-blur">
        <div className="border-b border-white/10 px-6 py-5">
          <div className="text-sm font-semibold text-white">Log Akses & Keamanan</div>
          <div className="mt-1 text-sm text-slate-400">
            Jejak eksekutif lintas tenant dari node `super/security_logs`.
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/5 text-sm">
            <thead className="bg-white/5">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">WAKTU</th>
                <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">USERNAME / IDENTITAS</th>
                <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">TIPE AKUN</th>
                <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">AKTIVITAS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-slate-950/20">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-slate-400">Memuat...</td>
                </tr>
              ) : filteredSecurityLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-slate-400">Belum ada log keamanan yang cocok.</td>
                </tr>
              ) : (
                filteredSecurityLogs.map((row) => (
                  <tr key={row.id} className="hover:bg-white/5">
                    <td className="px-5 py-4 text-slate-200">{formatDateTime(row.timestamp)}</td>
                    <td className="px-5 py-4 font-semibold text-white">{row.username || "-"}</td>
                    <td className="px-5 py-4 text-slate-200">{row.accountType || "-"}</td>
                    <td className="px-5 py-4 text-slate-200">{row.activity || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </SuperAdminPageLayout>
  );
}
