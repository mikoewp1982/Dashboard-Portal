'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onIdTokenChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useAuthStore, PortalUser, PortalUserRole } from '@/store/useAuthStore';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading, loading, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const token = await currentUser.getIdTokenResult();
          const roleClaim = typeof token.claims.role === "string" ? token.claims.role : "admin";
          const role: PortalUserRole =
            roleClaim === "super_admin" || roleClaim === "teacher" || roleClaim === "student" ? roleClaim : "admin";
          const schoolId = token.claims.schoolId as string | undefined;
          const npsn = token.claims.npsn as string | undefined;
          const schoolName = token.claims.schoolName as string | undefined;
          const mustChangePassword = token.claims.mustChangePassword === true;
          
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
          setUser(portalUser);
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <>{children}</>;
}
