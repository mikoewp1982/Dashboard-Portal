"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Bell, Sparkles, Megaphone, CheckCheck, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import {
  listenStudentNotifications,
  formatTimeAgo,
  type StudentNotification,
} from "@/lib/siswa/studentDataService";

export default function NotifikasiPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [notifications, setNotifications] = useState<StudentNotification[]>([]);
  const [filter, setFilter] = useState<"semua" | "sistem">("semua");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = listenStudentNotifications(user?.schoolId || "", (list) => {
      setNotifications(list);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const filteredNotifs = notifications.filter((n) => {
    if (filter === "sistem") return n.category === "Sistem" || n.category === "Virtual Pet";
    return true;
  });

  return (
    <div className="min-h-dvh bg-slate-50 pb-24 text-slate-800">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-orange-600 px-4 pt-12 pb-4 text-white shadow-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/siswa")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white transition hover:bg-white/30 active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold leading-tight">Notifikasi</h1>
            <p className="text-xs text-orange-100">Pengumuman & Pemberitahuan Siswa</p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 mt-4">
          <button
            type="button"
            onClick={() => setFilter("semua")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
              filter === "semua"
                ? "bg-white text-orange-800 shadow-sm"
                : "bg-white/15 text-orange-100 hover:bg-white/25"
            }`}
          >
            Semua ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("sistem")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
              filter === "sistem"
                ? "bg-white text-orange-800 shadow-sm"
                : "bg-white/15 text-orange-100 hover:bg-white/25"
            }`}
          >
            Sistem & Pet
          </button>
        </div>
      </div>

      <div className="px-4 py-5 max-w-2xl mx-auto space-y-3">
        {filteredNotifs.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 border border-slate-200 text-center space-y-3 shadow-sm">
            <Bell className="h-12 w-12 mx-auto text-slate-300" />
            <h3 className="text-sm font-bold text-slate-800">Belum Ada Notifikasi</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Semua pengumuman resmi dan pemberitahuan aktivitas sekolah akan muncul di sini.
            </p>
          </div>
        ) : (
          filteredNotifs.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl bg-white p-4.5 border border-slate-200 shadow-sm space-y-2 hover:border-orange-200 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
                    <Megaphone className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{item.title}</h3>
                    <span className="text-[10px] font-semibold text-orange-600">
                      {item.category}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                  {formatTimeAgo(item.createdAt)}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed pl-10">{item.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
