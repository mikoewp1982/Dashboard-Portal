"use client";

import Link from "next/link";
import { SuperAdminPageLayout } from "@/components/super-admin/SuperAdminPageLayout";
import { useSuperAdminLiveData } from "@/hooks/super-admin/useSuperAdminLiveData";

export default function SuperAdminTenantsPage() {
  const { loading, schools } = useSuperAdminLiveData();

  return (
    <SuperAdminPageLayout
      title="Sekolah & Tenant"
      description="Pusat registrasi tenant sesuai PRD final. Menu ini fokus pada identitas sekolah, status tenant, dan kesiapan login admin sekolah."
      actions={[
        { href: "/super-admin/database", label: "Buka Database Super Admin" },
        { href: "/super-admin/dashboard", label: "Kembali ke Overview" },
      ]}
    >
      <section className="rounded-3xl border border-white/10 bg-slate-900/60 shadow-xl backdrop-blur">
        <div className="border-b border-white/10 px-6 py-4">
          <div className="text-sm font-semibold text-white">Registry Tenant ({loading ? "..." : schools.length})</div>
          <div className="mt-1 text-xs text-slate-400">Field inti tenant: `schoolId`, `name`, `district`, `npsn`, `authEmail`, `adminEmail`, `backupEmail`, `isActive`, `adminAccessActive`.</div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/5 text-sm">
            <thead className="bg-white/5">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">SEKOLAH</th>
                <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">NPSN</th>
                <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">ADMIN LOGIN</th>
                <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">STATUS</th>
                <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-slate-950/20">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400">Memuat tenant...</td>
                </tr>
              ) : schools.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400">Belum ada tenant terdaftar.</td>
                </tr>
              ) : (
                schools.map((school) => (
                  <tr key={school.schoolId} className="hover:bg-white/5">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-white">{school.name || "-"}</div>
                      <div className="mt-1 text-xs text-slate-400">{school.schoolId}</div>
                    </td>
                    <td className="px-5 py-4 text-slate-300">{school.npsn || "-"}</td>
                    <td className="px-5 py-4 text-slate-300">{school.authEmail || school.adminEmail || "Belum diatur"}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${school.isActive ? "bg-emerald-500/10 text-emerald-200" : "bg-amber-500/10 text-amber-200"}`}>
                          {school.isActive ? "Tenant Dibuka" : "Tenant Ditutup"}
                        </span>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${school.adminAccessActive ? "bg-cyan-500/10 text-cyan-200" : "bg-red-500/10 text-red-200"}`}>
                          {school.adminAccessActive ? "Login Admin Dibuka" : "Login Admin Ditutup"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Link href="/super-admin/database" className="text-xs font-semibold text-blue-300 hover:text-blue-200">
                        Kelola di Database Super Admin
                      </Link>
                    </td>
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
