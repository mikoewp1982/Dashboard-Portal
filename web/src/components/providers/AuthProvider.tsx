'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onIdTokenChanged, signOut } from 'firebase/auth';
import { auth, rtdb } from '@/lib/firebase/client';
import { ref, onValue } from 'firebase/database';
import { useAuthStore, PortalUser, PortalUserRole } from '@/store/useAuthStore';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading, loading, user, logoutState } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [tenantGateChecked, setTenantGateChecked] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fallbackTimer = setTimeout(() => {
      if (mounted) {
        setLoading(false);
      }
    }, 3000);

    const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
      if (!currentUser) {
        if (mounted) {
          setUser(null);
          setTenantGateChecked(true);
          setLoading(false);
        }
        return;
      }

      try {
        const token: any = await Promise.race([
          currentUser.getIdTokenResult(),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Auth Token Timeout")), 2500))
        ]).catch(() => null);

        const claims = token?.claims || {};
        const roleClaim = typeof claims.role === "string" ? claims.role : "";
        if (!["super_admin", "admin", "teacher", "student"].includes(roleClaim)) {
          throw new Error(`Invalid or missing role claim: ${roleClaim}`);
        }
        const role = roleClaim as PortalUserRole;
        const schoolId = claims.schoolId as string | undefined;
        const npsn = claims.npsn as string | undefined;
        const schoolName = claims.schoolName as string | undefined;
        const mustChangePassword = claims.mustChangePassword === true;
        const nuptk = typeof claims.nuptk === "string" ? claims.nuptk : undefined;
        const teacherClass =
          typeof claims.class === "string"
            ? claims.class
            : typeof claims.homeroomClass === "string"
              ? claims.homeroomClass
              : undefined;

        const portalUser: PortalUser = {
          id: currentUser.uid,
          name: currentUser.displayName || currentUser.email || 'User',
          email: currentUser.email || '',
          role: role,
          schoolId: schoolId,
          npsn,
          schoolName,
          mustChangePassword,
          nuptk,
          class: teacherClass,
        };

        if (mounted) {
          setUser(portalUser);
          // #region debug-point D:auth-user-resolved
          fetch("http://127.0.0.1:7777/event", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: "admin-kick-gate", runId: "pre-fix", hypothesisId: "D", location: "AuthProvider.tsx:setUser", msg: "[DEBUG] auth user resolved", data: { role, schoolId, pathname: typeof window !== "undefined" ? window.location.pathname : null }, ts: Date.now() }) }).catch(() => {});
          // #endregion
        }
      } catch (err) {
        console.error("Auth error:", err);
        if (mounted) {
          setUser(null);
          setTenantGateChecked(true);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          clearTimeout(fallbackTimer);
        }
      }
    });

    return () => {
      mounted = false;
      clearTimeout(fallbackTimer);
      unsubscribe();
    };
  }, [setUser, setLoading]);

  useEffect(() => {
    setTenantGateChecked(false);
    if (!user) {
      setTenantGateChecked(true);
      return;
    }
    if (user.role === "super_admin" || !user.schoolId) {
      setTenantGateChecked(true);
      return;
    }

    let attached = false;
    const schoolRef = ref(rtdb, `schools/${user.schoolId}`);
    // #region debug-point A:tenant-listener-attach
    fetch("http://127.0.0.1:7777/event", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: "admin-kick-gate", runId: "pre-fix", hypothesisId: "A", location: "AuthProvider.tsx:tenantEffect", msg: "[DEBUG] attaching tenant listener", data: { role: user.role, schoolId: user.schoolId, pathname: typeof window !== "undefined" ? window.location.pathname : null }, ts: Date.now() }) }).catch(() => {});
    // #endregion
    const unsubscribe = onValue(schoolRef, (snapshot) => {
      let needSignOut = false;
      let reason = "";

      if (snapshot.exists()) {
        const data = snapshot.val() || {};
        const inactive = data.isActive === false || data.isActive === null || data.isActive === undefined;
        const adminAccessBlocked = data.adminAccessActive === false || data.adminAccessActive === null || data.adminAccessActive === undefined;
        // #region debug-point B:tenant-snapshot
        fetch("http://127.0.0.1:7777/event", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: "admin-kick-gate", runId: "pre-fix", hypothesisId: "B", location: "AuthProvider.tsx:onValue", msg: "[DEBUG] tenant snapshot received", data: { schoolId: user.schoolId, inactive, adminAccessBlocked, rawIsActive: data.isActive ?? null, rawAdminAccessActive: data.adminAccessActive ?? null, pathname: typeof window !== "undefined" ? window.location.pathname : null }, ts: Date.now() }) }).catch(() => {});
        // #endregion
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
        // #region debug-point C:tenant-signout-branch
        fetch("http://127.0.0.1:7777/event", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: "admin-kick-gate", runId: "pre-fix", hypothesisId: "C", location: "AuthProvider.tsx:signOutBranch", msg: "[DEBUG] tenant signOut branch hit", data: { schoolId: user.schoolId, reason, pathname: typeof window !== "undefined" ? window.location.pathname : null }, ts: Date.now() }) }).catch(() => {});
        // #endregion
        console.warn("[AuthProvider] Tenant gate failed:", reason);
        logoutState.setMessage(reason);
        signOut(auth).catch(console.error);
        return;
      }

      if (!attached) {
        attached = true;
        setTenantGateChecked(true);
      }
    }, (err) => {
      console.error("[AuthProvider] Tenant gate RTDB error:", err);
      if (!attached) {
        attached = true;
        setTenantGateChecked(true);
      }
    });

    const safetyTimer = setTimeout(() => {
      if (!attached) {
        console.warn("[AuthProvider] Tenant gate safety timeout fired — allow render.");
        attached = true;
        setTenantGateChecked(true);
      }
    }, 2000);

    return () => {
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, [user, logoutState]);

  useEffect(() => {
    if (loading) return;
    if (!tenantGateChecked) return;

    const needsAuth = pathname.startsWith('/dashboard') || pathname.startsWith('/super-admin');
    const isGuruPortal = pathname.startsWith('/guru');
    const passwordChangeBlocked = user?.role === 'admin' && user.mustChangePassword === true;
    // #region debug-point E:redirect-guard
    fetch("http://127.0.0.1:7777/event", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: "admin-kick-gate", runId: "pre-fix", hypothesisId: "E", location: "AuthProvider.tsx:redirectEffect", msg: "[DEBUG] redirect guard evaluated", data: { pathname, hasUser: !!user, role: user?.role ?? null, needsAuth, tenantGateChecked, loading }, ts: Date.now() }) }).catch(() => {});
    // #endregion

    if (!user && needsAuth) {
      router.push('/login');
      return;
    }

    if (user && passwordChangeBlocked && pathname !== '/login') {
      router.push('/login');
      return;
    }

    if (user?.role === 'teacher' && needsAuth) {
      router.push('/guru');
      return;
    }

    if (user && !passwordChangeBlocked && (pathname === '/login' || pathname === '/')) {
      if (user.role === 'teacher') {
        router.push('/guru');
      } else if (user.role === 'super_admin') {
        router.push('/super-admin/dashboard');
      } else {
        router.push('/dashboard');
      }
      return;
    }

    if (user && user.role !== 'teacher' && isGuruPortal && pathname !== '/guru') {
      // biarkan halaman install/info; sub-route guru untuk sesi guru saja digate di layout
    }
  }, [user, loading, pathname, router, tenantGateChecked]);

  if (loading || !tenantGateChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <>{children}</>;
}
