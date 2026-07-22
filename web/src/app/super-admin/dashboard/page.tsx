"use client";

import Sidebar from "@/components/layout/Sidebar";
import { useAuthStore } from "@/store/useAuthStore";
import { useSuperAdminLiveData } from "@/hooks/super-admin/useSuperAdminLiveData";

export default function SuperAdminDashboardPage() {
  const { user } = useAuthStore();
  const { metrics, schools, principals, securityLogs, supportRequests, syncJobs } = useSuperAdminLiveData();

  const totalAdminLogins = schools.filter((s) => s.adminEmail || s.authEmail).length;
  const latestLogs = securityLogs.slice(0, 5);
  const latestSupport = supportRequests.slice(0, 5);
  const latestJobs = syncJobs.slice(0, 5);
  const schoolsWithoutAdmin = schools.filter((row) => !row.authEmail && !row.adminEmail);
  const schoolsWithoutPrincipal = schools.filter((row) => !principals.some((principal) => principal.schoolId === row.schoolId));

  if (!user || user.role !== "super_admin") {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center p-6 text-slate-400"
        style={{
          background: "linear-gradient(135deg, #0b1228 0%, #121a43 50%, #081121 100%)",
        }}
      >
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
          Akses Ditolak. Anda bukan Super Admin.
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen px-4 py-6 text-slate-100 sm:px-6"
      style={{
        background: "linear-gradient(135deg, #0b1228 0%, #121a43 50%, #081121 100%)",
      }}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-start">
        <Sidebar className="lg:w-64" />

        <main className="min-w-0 flex-1 space-y-6">
          <header className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-xs font-semibold tracking-[0.24em] text-blue-400">SUPER ADMIN DASHBOARD</div>
                <h1 className="mt-2 text-2xl font-bold text-white">Pusat Kendali Sistem</h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-300">
                  Halaman ini difokuskan sebagai ringkasan kondisi sistem saat ini. Gunakan menu sidebar untuk masuk ke area kerja `Database Induk`, `Status Layanan`, dan `Monitoring`.
                </p>
              </div>

              <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm font-semibold text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                SUPER ADMIN
              </div>
            </div>
          </header>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Total Sekolah</div>
              <div className="mt-3 text-3xl font-bold text-white">{metrics.totalSchools}</div>
              <div className="mt-1 text-xs text-emerald-400">{metrics.activeSchools} Aktif</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Akun Terdaftar</div>
              <div className="mt-3 text-3xl font-bold text-blue-300">{totalAdminLogins}</div>
              <div className="mt-1 text-xs text-blue-400">{principals.length} Kepala Sekolah</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Sync Jobs</div>
              <div className="mt-3 text-3xl font-bold text-cyan-300">{metrics.syncQueued}</div>
              <div className="mt-1 text-xs text-red-400">{metrics.syncFailed} Failed</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Support / Issues</div>
              <div className="mt-3 text-3xl font-bold text-amber-300">{metrics.supportOpen}</div>
              <div className="mt-1 text-xs text-amber-500">{metrics.tenantIssues} Tenant Issues</div>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <article className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
              <div className="text-sm font-semibold text-white">Ringkasan Induk</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs font-semibold tracking-widest text-slate-400">TENANT DIBUKA</div>
                  <div className="mt-2 text-2xl font-bold text-white">{metrics.activeSchools}</div>
                  <div className="mt-1 text-xs text-slate-400">Tenant aktif saat ini</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs font-semibold tracking-widest text-slate-400">ADMIN TERPROVISI</div>
                  <div className="mt-2 text-2xl font-bold text-white">{totalAdminLogins}</div>
                  <div className="mt-1 text-xs text-slate-400">Sekolah sudah punya login admin</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs font-semibold tracking-widest text-slate-400">TANPA ADMIN</div>
                  <div className="mt-2 text-2xl font-bold text-amber-300">{schoolsWithoutAdmin.length}</div>
                  <div className="mt-1 text-xs text-slate-400">Perlu provisioning login admin</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs font-semibold tracking-widest text-slate-400">TANPA KEPSEK</div>
                  <div className="mt-2 text-2xl font-bold text-amber-300">{schoolsWithoutPrincipal.length}</div>
                  <div className="mt-1 text-xs text-slate-400">Perlu akun kepala sekolah</div>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
              <div className="text-sm font-semibold text-white">Kondisi Operasional</div>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-300">Support terbuka</span>
                    <span className="text-lg font-bold text-amber-300">{metrics.supportOpen}</span>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-300">Sync queued</span>
                    <span className="text-lg font-bold text-cyan-300">{metrics.syncQueued}</span>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-300">Sync failed</span>
                    <span className="text-lg font-bold text-rose-300">{metrics.syncFailed}</span>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-300">Tenant perlu atensi</span>
                    <span className="text-lg font-bold text-amber-300">{metrics.tenantIssues}</span>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-300">Log keamanan</span>
                    <span className="text-lg font-bold text-white">{metrics.auditLogs}</span>
                  </div>
                </div>
              </div>
            </article>
          </section>

          <section className="grid gap-4 xl:grid-cols-3">
            <article className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
              <div className="text-sm font-semibold text-white">Support Terbaru</div>
              <div className="mt-4 space-y-3">
                {latestSupport.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                    Belum ada support request terbaru.
                  </div>
                ) : (
                  latestSupport.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-sm font-semibold text-white">{item.title || "Permintaan Bantuan"}</div>
                      <div className="mt-1 text-xs text-slate-400">{item.schoolId || "-"}</div>
                      <div className="mt-2 text-xs text-slate-300">Status: {item.status || "-"}</div>
                    </div>
                  ))
                )}
              </div>
            </article>

            <article className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
              <div className="text-sm font-semibold text-white">Sync Jobs Terbaru</div>
              <div className="mt-4 space-y-3">
                {latestJobs.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                    Belum ada job sinkronisasi terbaru.
                  </div>
                ) : (
                  latestJobs.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-sm font-semibold text-white">{item.jobType || "Sync Job"}</div>
                      <div className="mt-1 text-xs text-slate-400">{item.schoolId || "-"}</div>
                      <div className="mt-2 text-xs text-slate-300">Status: {item.status || "-"}</div>
                    </div>
                  ))
                )}
              </div>
            </article>

            <article className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
              <div className="text-sm font-semibold text-white">Aktivitas Keamanan Terbaru</div>
              <div className="mt-4 space-y-3">
                {latestLogs.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                    Belum ada log keamanan terbaru.
                  </div>
                ) : (
                  latestLogs.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-sm font-semibold text-white">{item.username || "-"}</div>
                      <div className="mt-1 text-xs text-slate-400">{item.accountType || "-"}</div>
                      <div className="mt-2 text-xs text-slate-300">{item.activity || "-"}</div>
                    </div>
                  ))
                )}
              </div>
            </article>
          </section>
        </main>
      </div>
    </div>
  );
}
