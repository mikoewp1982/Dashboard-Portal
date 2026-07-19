"use client";

import { useState } from "react";

import { SuperAdminPageLayout } from "@/components/super-admin/SuperAdminPageLayout";
import { useSuperAdminLiveData } from "@/hooks/super-admin/useSuperAdminLiveData";

function formatDateTime(timestamp: number | null) {
  if (!timestamp) return "-";
  return new Date(timestamp).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function SuperAdminAuditPage() {
  const { loading, securityLogs, metrics } = useSuperAdminLiveData();
  const [searchTerm, setSearchTerm] = useState("");
  const [accountTypeFilter, setAccountTypeFilter] = useState("ALL");

  const filteredLogs = securityLogs.filter((log) => {
    const matchesSearch = log.username?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.activity?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = accountTypeFilter === "ALL" || log.accountType === accountTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <SuperAdminPageLayout
      title="Audit & Compliance"
      description="Jejak aksi penting Super Admin sesuai struktur final modul pusat."
      actions={[
        { href: "/super-admin/dashboard", label: "Kembali ke Overview" },
        { href: "/super-admin/database", label: "Buka Database Super Admin" },
      ]}
    >
      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">AUDIT LOG</div>
          <div className="mt-3 text-3xl font-bold text-blue-300">{metrics.auditLogs}</div>
        </article>
        <article className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">TENANT ISSUE</div>
          <div className="mt-3 text-3xl font-bold text-amber-300">{metrics.tenantIssues}</div>
        </article>
        <article className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">SYNC FAILED</div>
          <div className="mt-3 text-3xl font-bold text-red-300">{metrics.syncFailed}</div>
        </article>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-900/60 shadow-xl backdrop-blur">
        <div className="border-b border-white/10 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-sm font-semibold text-white">Log Akses & Aksi Penting</div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Cari username atau aktivitas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-xl border border-white/10 bg-slate-950/50 p-2 text-sm text-white focus:border-blue-500 focus:outline-none w-full sm:w-64"
            />
            <select
              value={accountTypeFilter}
              onChange={(e) => setAccountTypeFilter(e.target.value)}
              className="rounded-xl border border-white/10 bg-slate-950/50 p-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">Semua Tipe Akun</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin_sekolah">Admin Sekolah</option>
              <option value="kepala_sekolah">Kepala Sekolah</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/5 text-sm">
            <thead className="bg-white/5">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">WAKTU</th>
                <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">USERNAME</th>
                <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">TIPE AKUN</th>
                <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">AKTIVITAS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-slate-950/20">
              {loading ? (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-400">Memuat audit log...</td></tr>
              ) : filteredLogs.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-400">Belum ada audit log yang sesuai.</td></tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5">
                    <td className="px-5 py-4 text-slate-300">{formatDateTime(log.timestamp)}</td>
                    <td className="px-5 py-4 font-semibold text-white">{log.username || "-"}</td>
                    <td className="px-5 py-4 text-slate-300">{log.accountType || "-"}</td>
                    <td className="px-5 py-4 text-slate-300">{log.activity || "-"}</td>
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
