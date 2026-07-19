"use client";

import { PetData } from "@/hooks/gas/virtual-pet/useGasVirtualPet";

interface LeaderboardPet extends PetData {
  className: string;
}

interface GasPetLeaderboardTabProps {
  leaderboardData: LeaderboardPet[];
}

export function GasPetLeaderboardTab({ leaderboardData }: GasPetLeaderboardTabProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-y border-slate-700 bg-slate-900/40">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Rank</th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Siswa</th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Kelas</th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Pet</th>
            <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Level & EXP</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/50">
          {leaderboardData.map((pet, index) => (
            <tr key={pet.id} className="transition-colors hover:bg-slate-900/30">
              <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-slate-300">#{index + 1}</td>
              <td className="whitespace-nowrap px-4 py-4 font-bold text-slate-100">{pet.studentName}</td>
              <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-slate-300">{pet.className}</td>
              <td className="whitespace-nowrap px-4 py-4 text-sm uppercase text-slate-300">{pet.petName || "Buddy"}</td>
              <td className="whitespace-nowrap px-4 py-4 text-right">
                <div className="text-sm font-bold text-slate-100">Lvl {pet.stats.level}</div>
                <div className="text-xs font-semibold text-slate-400">{pet.stats.exp} XP</div>
              </td>
            </tr>
          ))}
          {leaderboardData.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-sm font-medium text-slate-500">
                Belum ada data pet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
