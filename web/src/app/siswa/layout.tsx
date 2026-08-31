"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { StudentBottomNav } from "@/components/siswa/StudentBottomNav";

export default function SiswaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const router = useRouter();

  useEffect(() => {
    // Basic gate check for student portal (more robust checks are in AuthProvider)
    if (!loading && user && user.role !== "student") {
      if (user.role === "teacher") {
        router.push("/guru");
      } else {
        router.push("/dashboard");
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-dvh bg-slate-50 flex justify-center w-full">
      {/* Container to mock mobile screen size on desktop, full width on real mobile */}
      <div className="w-full max-w-md bg-white min-h-dvh relative shadow-2xl overflow-x-hidden pb-safe">
        {children}
        <StudentBottomNav />
      </div>
    </div>
  );
}
