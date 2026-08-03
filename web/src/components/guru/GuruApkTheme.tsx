"use client";

import { Check } from "lucide-react";

export const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function formatIndonesianDate(ms: number) {
  return new Date(ms).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function ApkPageFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="-mx-4 -mt-4 min-h-[70dvh] bg-gradient-to-b from-[#12D6C6] via-[#0F7BFF] to-[#0F2A43] px-4 pb-8 pt-4">
      <header className="mb-3 rounded-2xl bg-gradient-to-r from-[#0F2A43] to-[#0F7BFF] px-4 py-3 shadow-lg">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <p className="text-xs text-white/80">{subtitle}</p>
      </header>
      {children}
    </div>
  );
}

export function ApkTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: string[];
  active: number;
  onChange: (index: number) => void;
}) {
  return (
    <div className="mb-3 grid grid-cols-2 gap-1 rounded-xl bg-black/15 p-1">
      {tabs.map((tab, index) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(index)}
          className={`rounded-lg px-2 py-2.5 text-xs font-semibold transition ${
            active === index
              ? "bg-white/20 text-white shadow"
              : "text-white/70 hover:text-white"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

export function ApkGlassCard({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`w-full rounded-2xl border border-white/20 bg-[#0B1F33]/35 text-left text-white shadow-sm backdrop-blur-sm ${className}`}
      >
        {children}
      </button>
    );
  }
  return (
    <div
      className={`w-full rounded-2xl border border-white/20 bg-[#0B1F33]/35 text-left text-white shadow-sm backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function ApkStatCard({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex h-[70px] flex-1 flex-col items-center justify-center rounded-2xl border border-white/20 bg-white/15">
      <div className="text-xl font-bold text-white">{count}</div>
      <div className="text-[10px] text-white/75">{label}</div>
    </div>
  );
}

export function ApkActionButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-2xl bg-white/15 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function StatusCheckCell({
  selected,
  color,
  onClick,
  disabled,
}: {
  selected: boolean;
  color: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex h-12 flex-1 items-center justify-center border-r border-white/40 last:border-r-0 disabled:opacity-40"
    >
      {selected ? <Check className="h-4 w-4" style={{ color }} strokeWidth={3} /> : null}
    </button>
  );
}

export function CountCell({ value }: { value: number | string }) {
  return (
    <div className="flex h-12 flex-1 items-center justify-center border-r border-white/40 text-xs text-white last:border-r-0">
      {value}
    </div>
  );
}

export function TableShell({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <ApkGlassCard className="overflow-hidden">
      <div className="flex items-center bg-white/10 text-[11px] font-bold text-white">
        <div className="flex h-12 w-10 shrink-0 items-center justify-center border-r border-white/40">
          {headers[0]}
        </div>
        <div className="flex h-12 min-w-0 flex-1 items-center border-r border-white/40 px-2">
          {headers[1]}
        </div>
        <div className="flex w-[148px] shrink-0">
          {headers.slice(2).map((h) => (
            <div
              key={h}
              className="flex h-12 flex-1 items-center justify-center border-r border-white/40 last:border-r-0"
            >
              {h}
            </div>
          ))}
        </div>
      </div>
      <div className="divide-y divide-white/40">{children}</div>
    </ApkGlassCard>
  );
}

export function TableRow({
  index,
  name,
  children,
}: {
  index: number;
  name: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[52px] items-stretch">
      <div className="flex w-10 shrink-0 items-center justify-center border-r border-white/40 text-xs text-white">
        {index}
      </div>
      <div className="flex min-w-0 flex-1 items-center border-r border-white/40 px-2 py-1.5">
        <span className="line-clamp-2 text-xs font-semibold leading-snug text-white">{name}</span>
      </div>
      <div className="flex w-[148px] shrink-0">{children}</div>
    </div>
  );
}
