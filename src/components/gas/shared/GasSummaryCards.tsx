"use client";

type SummaryItem = {
  label: string;
  value: string | number;
  hint: string;
};

type GasSummaryCardsProps = {
  items: SummaryItem[];
};

export function GasSummaryCards({ items }: GasSummaryCardsProps) {
  return (
    <div className="mb-6 grid gap-4 md:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{item.label}</div>
          <div className="mt-2 text-3xl font-bold text-white">{item.value}</div>
          <div className="mt-1 text-sm text-slate-400">{item.hint}</div>
        </div>
      ))}
    </div>
  );
}
