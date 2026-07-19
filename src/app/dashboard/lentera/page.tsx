"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { LenteraSidebar } from "@/components/lentera/LenteraSidebar";
import LenteraWorkspace from "@/components/lentera/LenteraWorkspace";

export type LenteraTab = "dashboard" | "loans" | "tasks" | "members" | "stats" | "settings";

export default function LenteraDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!_hasHydrated) return;

    if (!user) {
      const returnTo = pathname || "/dashboard/lentera";
      router.replace(`/admin/login?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }

  }, [_hasHydrated, pathname, router, user]);

  if (!_hasHydrated || !user) {
    return <div className="min-h-screen bg-[#0f172a]" />;
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <div className="flex min-h-screen">
        <Suspense fallback={<div className="hidden w-72 shrink-0 lg:block bg-[#0f172a]" />}>
          <LenteraSidebar />
        </Suspense>
        <main className="min-w-0 flex-1 p-6 overflow-y-auto max-h-screen custom-scrollbar">
           <LenteraWorkspace />
        </main>
      </div>
    </div>
  );
}
