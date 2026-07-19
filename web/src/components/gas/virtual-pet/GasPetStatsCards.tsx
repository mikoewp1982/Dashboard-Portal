"use client";

import { AlertTriangle, Trophy, Zap } from "lucide-react";

interface GasPetStatsCardsProps {
  stats: {
    totalPets: number;
    avgLevel: string;
    atRisk: number;
  };
}

const cards = [
  {
    key: "totalPets",
    label: "Total Pets Aktif",
    valueClassName: "text-slate-100",
    iconClassName: "text-blue-600",
    icon: Zap,
  },
  {
    key: "avgLevel",
    label: "Rata-rata Level",
    valueClassName: "text-slate-100",
    iconClassName: "text-green-600",
    icon: Trophy,
  },
  {
    key: "atRisk",
    label: "Perlu Perhatian",
    valueClassName: "text-red-500",
    iconClassName: "text-red-600",
    icon: AlertTriangle,
  },
] as const;

export function GasPetStatsCards({ stats }: GasPetStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        const value = stats[card.key];

        return (
          <div
            key={card.key}
            className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#111827]/80 p-6"
          >
            <div>
              <p className="mb-1 text-sm font-medium text-slate-400">{card.label}</p>
              <h2 className={`text-3xl font-bold ${card.valueClassName}`}>{value}</h2>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-white ${card.iconClassName}`}>
              <Icon className="h-5 w-5 fill-current" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
