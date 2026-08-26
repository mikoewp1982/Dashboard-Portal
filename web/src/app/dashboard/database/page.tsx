"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import MasterDataWorkspace from "@/components/database/MasterDataWorkspace";

export default function AdminDatabasePage() {
  const { user } = useAuthStore();

  useEffect(() => {
    // #region debug-point A:database-page-render
    fetch("http://127.0.0.1:7777/event", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: "admin-kick-gate", runId: "pre-fix", hypothesisId: "A", location: "app/dashboard/database/page.tsx", msg: "[DEBUG] database page effect", data: { hasUser: !!user, role: user?.role ?? null, schoolId: user?.schoolId ?? null, pathname: typeof window !== "undefined" ? window.location.pathname : null }, ts: Date.now() }) }).catch(() => {});
    // #endregion
  }, [user]);

  if (!user || user.role !== "admin") {
    return (
      <div className="flex h-screen items-center justify-center p-6 text-slate-400 bg-[#0b1228]">
        Memuat data atau akses ditolak...
      </div>
    );
  }

  return <MasterDataWorkspace />;
}
