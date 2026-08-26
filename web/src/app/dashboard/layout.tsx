"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { ref, onValue } from "firebase/database";
import { auth, rtdb } from "@/lib/firebase/client";
import { useAuthStore } from "@/store/useAuthStore";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading, logoutState } = useAuthStore();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role === "super_admin") {
      router.replace("/super-admin/dashboard");
      return;
    }

    if (user.role === "teacher") {
      router.replace("/guru");
    }
  }, [loading, router, user]);

  useEffect(() => {
    if (!user?.schoolId) return;
    if (user.role === "super_admin") return;

    const schoolRef = ref(rtdb, `schools/${user.schoolId}`);
    const unsubscribe = onValue(schoolRef, (snapshot) => {
      let needSignOut = false;
      let reason = "";

      if (snapshot.exists()) {
        const data = snapshot.val() || {};
        const inactive = data.isActive === false || data.isActive === null || data.isActive === undefined;
        const adminAccessBlocked = data.adminAccessActive === false || data.adminAccessActive === null || data.adminAccessActive === undefined;

        if (inactive) {
          needSignOut = true;
          reason = data.isActive === false
            ? "Layanan sekolah Anda sedang dinonaktifkan oleh Super Admin."
            : "Status layanan sekolah tidak valid. Silakan hubungi Super Admin.";
        } else if (adminAccessBlocked && (user.role === "admin" || user.role === "teacher")) {
          needSignOut = true;
          reason = data.adminAccessActive === false
            ? "Akses admin sekolah ditutup sementara oleh Super Admin."
            : "Akses admin sekolah tidak tersedia. Silakan hubungi Super Admin.";
        }
      } else {
        needSignOut = true;
        reason = "Data sekolah tidak ditemukan. Silakan hubungi Super Admin.";
      }

      if (needSignOut) {
        console.warn("[DashboardLayout] Tenant gate failed:", reason);
        logoutState.setMessage(reason);
        signOut(auth).catch(console.error);
      }
    });

    return () => unsubscribe();
  }, [logoutState, user]);

  if (loading || !user || user.role === "super_admin" || user.role === "teacher") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1228] p-6 text-slate-400">
        Memuat data...
      </div>
    );
  }

  return <>{children}</>;
}
