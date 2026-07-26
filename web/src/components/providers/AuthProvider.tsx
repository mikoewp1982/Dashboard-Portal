'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onIdTokenChanged, signOut } from 'firebase/auth';
import { auth, rtdb } from '@/lib/firebase/client';
import { ref, onValue } from 'firebase/database';
import { useAuthStore, PortalUser, PortalUserRole } from '@/store/useAuthStore';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading, loading, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

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
          setLoading(false);
        }
        return;
      }

      try {
        // Race token fetch against 2.5s timeout
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
        
        const portalUser: PortalUser = {
          id: currentUser.uid,
          name: currentUser.displayName || currentUser.email || 'User',
          email: currentUser.email || '',
          role: role,
          schoolId: schoolId,
          npsn,
          schoolName,
          mustChangePassword,
        };

        if (mounted) {
          setUser(portalUser);
        }
      } catch (err) {
        console.error("Auth error:", err);
        if (mounted) {
          setUser(null);
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
    if (!loading) {
      const needsAuth = pathname.startsWith('/dashboard') || pathname.startsWith('/super-admin');
      const passwordChangeBlocked = user?.role === 'admin' && user.mustChangePassword === true;

      if (!user && needsAuth) {
        router.push('/login');
      }

      if (user && passwordChangeBlocked && pathname !== '/login') {
        router.push('/login');
      }

      if (user && !passwordChangeBlocked && (pathname === '/login' || pathname === '/')) {
        router.push('/dashboard');
      }
    }
  }, [user, loading, pathname, router]);

  // Realtime Tenant Deactivation Listener
  useEffect(() => {
    if (!user || user.role !== 'admin' || !user.schoolId) return;

    const schoolRef = ref(rtdb, `schools/${user.schoolId}`);
    const unsubscribe = onValue(schoolRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.isActive === false || data.adminAccessActive === false) {
          console.warn("Tenant deactivated by Super Admin. Forcing logout.");
          signOut(auth).catch(console.error);
        }
      }
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <>{children}</>;
}
