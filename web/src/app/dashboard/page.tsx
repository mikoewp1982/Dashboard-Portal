"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { ref, onValue } from "firebase/database";
import { auth, rtdb } from "@/lib/firebase/client";
import Sidebar from "@/components/layout/Sidebar";
import { useAuthStore } from "@/store/useAuthStore";

export default function DashboardHomePage() {
  const { user, logoutState } = useAuthStore();
  const router = useRouter();
  const [schoolActive, setSchoolActive] = useState<boolean | null>(null);
  const [adminAccessActive, setAdminAccessActive] = useState<boolean | null>(null);

  useEffect(() => {
    if (user?.role === "super_admin") {
      router.replace("/super-admin/dashboard");
      return;
    }
    if (user?.role === "teacher") {
      router.replace("/guru");
      return;
    }
    if (!user?.schoolId) return;

    const schoolRef = ref(rtdb, `schools/${user.schoolId}`);
    const unsubscribe = onValue(schoolRef, (snapshot) => {
      let needSignOut = false;
      let reason = "";
      if (snapshot.exists()) {
        const d = snapshot.val() || {};
        const inactive = d.isActive === false || d.isActive === null || d.isActive === undefined;
        const blocked = d.adminAccessActive === false || d.adminAccessActive === null || d.adminAccessActive === undefined;
        setSchoolActive(!inactive);
        setAdminAccessActive(!blocked);
        if (inactive) {
          needSignOut = true;
          reason = d.isActive === false
            ? "Layanan sekolah Anda sedang dinonaktifkan oleh Super Admin."
            : "Status layanan sekolah tidak valid. Silakan hubungi Super Admin.";
        } else if (blocked) {
          needSignOut = true;
          reason = d.adminAccessActive === false
            ? "Akses admin sekolah ditutup sementara oleh Super Admin."
            : "Akses admin sekolah tidak tersedia. Silakan hubungi Super Admin.";
        }
      } else {
        setSchoolActive(false);
        setAdminAccessActive(false);
        needSignOut = true;
        reason = "Data sekolah tidak ditemukan. Silakan hubungi Super Admin.";
      }
      if (needSignOut) {
        console.warn("[Dashboard] Tenant gate failed:", reason);
        logoutState.setMessage(reason);
        signOut(auth).catch(console.error);
      }
    });

    return () => unsubscribe();
  }, [user, router, logoutState]);

  if (!user || user.role === "super_admin" || user.role === "teacher") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1228] p-6 text-slate-400">
        Memuat data...
      </div>
    );
  }

  const isInactive = schoolActive === false;
  const accessBlocked = adminAccessActive === false;
  const systemLabel = isInactive
    ? "Layanan Ditutup"
    : accessBlocked
      ? "Akses Web Ditutup"
      : "Online";
  const systemColor = isInactive || accessBlocked ? "text-rose-400" : "text-emerald-400";
  const systemSubtitle = isInactive
    ? "Layanan sekolah ditutup oleh Super Admin."
    : accessBlocked
      ? "Akses admin web ditutup sementara."
      : "Semua layanan berjalan normal";
  const tenantLabel = isInactive
    ? "Tenant ditutup"
    : accessBlocked
      ? "Login admin ditutup"
      : "Tenant aktif";
  const tenantBadgeColor = isInactive
    ? "bg-rose-500/20 text-rose-200 border border-rose-500/40"
    : accessBlocked
      ? "bg-amber-500/20 text-amber-200 border border-amber-500/40"
      : "";

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
                <div className="text-xs font-semibold tracking-[0.24em] text-slate-400">DASHBOARD UTAMA</div>
                <h1 className="mt-2 text-2xl font-bold text-white uppercase">
                  Selamat Datang, Admin {user.schoolName || "Sekolah"}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-300">
                  Ini adalah pusat kendali operasional sekolah Anda. Silakan gunakan menu di sidebar sebelah kiri untuk mengelola Database, GAS, EduLock, maupun Lentera Digital.
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className={`rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-100 uppercase ${tenantBadgeColor || "bg-white/5"}`}>
                  {user.role.replace("_", " ")}
                </div>
                {user.npsn && (
                  <div className="text-xs font-medium text-slate-400">
                    NPSN: {user.npsn}
                  </div>
                )}
              </div>
            </div>
          </header>

          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur transition hover:bg-slate-900/75">
               <div className="text-xs font-semibold tracking-widest text-slate-400">STATUS SISTEM</div>
               <div className={`mt-2 text-2xl font-bold ${systemColor}`}>{systemLabel}</div>
               <div className="mt-1 text-sm text-slate-300">{systemSubtitle}</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur transition hover:bg-slate-900/75">
               <div className="text-xs font-semibold tracking-widest text-slate-400">SEKOLAH</div>
               <div className="mt-2 text-xl font-bold text-white line-clamp-1">{user.schoolName || "-"}</div>
               <div className={`mt-1 text-sm ${isInactive ? "text-rose-300" : accessBlocked ? "text-amber-300" : "text-slate-300"}`}>{tenantLabel}</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur transition hover:bg-slate-900/75">
               <div className="text-xs font-semibold tracking-widest text-slate-400">AKSES</div>
               <div className={`mt-2 text-xl font-bold ${isInactive || accessBlocked ? "text-rose-300" : "text-blue-300"}`}>
                 {isInactive ? "Layanan Ditutup" : accessBlocked ? "Akses Dibatasi" : "Otorisasi Penuh"}
               </div>
               <div className="mt-1 text-sm text-slate-300">
                 {isInactive
                   ? "Diblokir oleh Super Admin."
                   : accessBlocked
                     ? "Akses web sedang ditutup."
                     : "Hak akses administrator"}
               </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
