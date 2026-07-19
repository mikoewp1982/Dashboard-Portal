"use client";

import { ReactNode } from "react";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import { useAuthStore } from "@/store/useAuthStore";

type SuperAdminPageLayoutProps = {
  title: string;
  description: string;
  actions?: Array<{
    href: string;
    label: string;
  }>;
  children: ReactNode;
};

export function SuperAdminPageLayout({
  title,
  description,
  actions = [],
  children,
}: SuperAdminPageLayoutProps) {
  const { user, loading } = useAuthStore();

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1228] p-6 text-slate-400">
        Memuat data...
      </div>
    );
  }

  if (user.role !== "super_admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1228] p-6 text-slate-300">
        Akses ditolak. Halaman ini khusus super admin.
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
                <div className="text-xs font-semibold tracking-[0.24em] text-slate-400">SUPER ADMIN</div>
                <h1 className="mt-2 text-2xl font-bold text-white">{title}</h1>
                <p className="mt-2 max-w-3xl text-sm text-slate-300">{description}</p>
              </div>

              <div className="flex flex-wrap gap-3">
                {actions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                  >
                    {action.label}
                  </Link>
                ))}
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100">
                  SUPER ADMIN
                </div>
              </div>
            </div>
          </header>

          {children}
        </main>
      </div>
    </div>
  );
}
