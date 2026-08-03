"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useSupervisedStudents } from "@/hooks/guru/useSupervisedStudents";
import { useTeacherNotificationInbox } from "@/hooks/guru/useTeacherNotificationInbox";
import { GuruShell } from "./GuruShell";
import { GuruPortalGate } from "./GuruPortalApp";
import { GuruSiswaInteractive } from "./GuruSiswaInteractive";
import { GuruAduanInteractive } from "./GuruAduanInteractive";

export { GuruPortalGate };

export function GuruShellWithInbox({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const { students, loading } = useSupervisedStudents(user?.schoolId, user?.class);
  const { unreadCount } = useTeacherNotificationInbox({
    schoolId: user?.schoolId,
    students,
    rosterReady: !loading,
    enableBrowserNotify: true,
  });

  return <GuruShell unreadCount={unreadCount}>{children}</GuruShell>;
}

export function GuruSiswaView() {
  return (
    <GuruShellWithInbox>
      <GuruSiswaInteractive />
    </GuruShellWithInbox>
  );
}

const typeLabel: Record<string, string> = {
  literacy_incomplete: "Literasi",
  literacy_pending: "Penilaian",
  pet_dead: "Virtual Pet",
  aduan_baru: "Aduan",
};

export function GuruNotifikasiView() {
  const user = useAuthStore((state) => state.user);
  const { students, loading } = useSupervisedStudents(user?.schoolId, user?.class);
  const { items, unreadCount, markAllRead, markRead } = useTeacherNotificationInbox({
    schoolId: user?.schoolId,
    students,
    rosterReady: !loading,
  });

  return (
    <GuruShell unreadCount={unreadCount}>
      <div className="space-y-4">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">Notifikasi</h2>
              <p className="mt-1 text-sm text-slate-300">
                {unreadCount > 0 ? `${unreadCount} belum dibaca` : "Semua sudah dibaca"}
              </p>
            </div>
            {items.length > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200"
              >
                Tandai dibaca
              </button>
            )}
          </div>
        </section>

        <section className="space-y-2">
          {items.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
              Belum ada notifikasi untuk kelas Anda.
            </div>
          )}
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => markRead(item.id)}
              className={`w-full rounded-2xl border px-4 py-3 text-left ${
                item.unread
                  ? "border-teal-400/30 bg-teal-500/10"
                  : "border-white/10 bg-slate-950/40"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-teal-300">
                  {typeLabel[item.type] || item.type}
                </span>
                <span className="text-[10px] text-slate-500">
                  {new Date(item.createdAt).toLocaleString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="mt-1 text-sm font-semibold text-white">{item.title}</div>
              <div className="mt-1 text-xs leading-relaxed text-slate-300">{item.body}</div>
            </button>
          ))}
        </section>
      </div>
    </GuruShell>
  );
}

export function GuruAduanView() {
  const user = useAuthStore((state) => state.user);
  const { students, loading: loadingStudents } = useSupervisedStudents(user?.schoolId, user?.class);
  const { unreadCount } = useTeacherNotificationInbox({
    schoolId: user?.schoolId,
    students,
    rosterReady: !loadingStudents,
    enableBrowserNotify: false,
  });

  return (
    <GuruShell unreadCount={unreadCount}>
      <GuruAduanInteractive />
    </GuruShell>
  );
}
