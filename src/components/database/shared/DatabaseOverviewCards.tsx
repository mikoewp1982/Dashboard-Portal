"use client";

type DatabaseOverviewCardsProps = {
  overviewCounts: {
    studentsActive: number;
    teachersActive: number;
    staffActive: number;
  };
};

export function DatabaseOverviewCards({ overviewCounts }: DatabaseOverviewCardsProps) {
  return (
    <div className="mb-8 grid gap-4 md:grid-cols-3">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6">
        <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">Siswa Aktif</div>
        <div className="mt-2 text-3xl font-bold text-white">{overviewCounts.studentsActive}</div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6">
        <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">Guru/Wali Aktif</div>
        <div className="mt-2 text-3xl font-bold text-white">{overviewCounts.teachersActive}</div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6">
        <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">Petugas OSIS Aktif</div>
        <div className="mt-2 text-3xl font-bold text-white">{overviewCounts.staffActive}</div>
      </div>
    </div>
  );
}
