"use client";

import { useEduLockSuperAdmin } from "@/hooks/super/useEduLockSuperAdmin";
import { Lock, School, Activity, Users, Settings, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EduLockSuperAdminPanel() {
  const { stats, schoolAdminRows } = useEduLockSuperAdmin("super_admin");

  const overviewStats = [
    { label: "Total Tenant", value: stats.tenantsTotal.toString(), icon: School, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Tenant Dibuka", value: stats.tenantsEnabled.toString(), icon: Lock, color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Tenant Live", value: stats.tenantsLive.toString(), icon: Activity, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Login Dibuka", value: stats.adminOpen.toString(), icon: Users, color: "text-cyan-400", bg: "bg-cyan-500/10" },
  ];

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto space-y-6">
      {/* Real-time Banner */}
      <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-6 backdrop-blur">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/20">
            <Lock className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-indigo-400">EduLock Control Plane (Super Admin)</h3>
            <p className="mt-1 text-sm text-indigo-400/80">
              Semua tenant dan akses admin EduLock dikendalikan dari satu panel secara langsung.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {overviewStats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition-all hover:border-white/20 hover:bg-white/10"
            >
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs font-medium text-slate-400">{stat.label}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Daftar Admin */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-white">Status Registrasi EduLock Tenant</h2>
        <div className="rounded-2xl border border-white/10 bg-white/5 shadow-xl backdrop-blur overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-sm">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-300">Sekolah</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-300">Login Admin</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-300">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {schoolAdminRows.slice(0, 10).map((a) => (
                  <tr key={a.schoolId} className="hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div className="text-slate-200">{a.schoolName || "-"}</div>
                      <div className="text-xs text-slate-400">{a.schoolId || ""}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{a.loginIdentifier || "-"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        a.schoolActive && a.accessActive
                          ? "bg-emerald-500/10 text-emerald-100 ring-1 ring-inset ring-emerald-400/20"
                          : "bg-red-500/10 text-red-100 ring-1 ring-inset ring-red-400/20"
                      }`}>
                        {a.schoolActive && a.accessActive ? "Login Dibuka" : "Login Ditutup"}
                      </span>
                    </td>
                  </tr>
                ))}
                {schoolAdminRows.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                      Memuat data tenant...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
