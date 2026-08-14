"use client";

import { History, Trophy, Zap } from "lucide-react";

interface GasPetSummaryTabProps {
  topClasses: Array<{ className: string; avgLevel: number }>;
  leaderboardData: any[];
  reviveHistoryRows: any[];
}

export function GasPetSummaryTab({
  topClasses,
  leaderboardData,
  reviveHistoryRows,
}: GasPetSummaryTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#111827]/80 rounded-xl p-6 border border-slate-800">
          <h3 className="font-bold text-slate-100 mb-6 flex items-center gap-2 text-sm">
            <Trophy className="w-4 h-4 text-yellow-500" />
            Kelas Terbaik (Rata-rata Level)
          </h3>
          <div className="space-y-4">
            {topClasses.length === 0 ? <p className="text-slate-500 text-sm">Belum ada data.</p> : topClasses.map((cls, idx) => (
              <div key={cls.className} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    idx === 0 ? "bg-yellow-100 text-yellow-700" :
                    idx === 1 ? "bg-slate-200 text-slate-700" :
                    idx === 2 ? "bg-orange-100 text-orange-700" : "bg-slate-800 text-slate-500"
                  }`}>
                    {idx + 1}
                  </div>
                  <span className="font-medium text-slate-300 text-sm">{cls.className}</span>
                </div>
                <span className="font-bold text-slate-100 text-sm">Lvl {cls.avgLevel}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#111827]/80 rounded-xl p-6 border border-slate-800">
          <h3 className="font-bold text-slate-100 mb-6 flex items-center gap-2 text-sm">
            <Zap className="w-4 h-4 text-blue-500" />
            Siswa Top (Highest Level)
          </h3>
          <div className="space-y-4">
            {leaderboardData.length === 0 ? <p className="text-slate-500 text-sm">Belum ada data.</p> : leaderboardData.slice(0, 5).map((pet, idx) => (
              <div key={pet.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    idx === 0 ? "bg-yellow-100 text-yellow-700" :
                    idx === 1 ? "bg-slate-200 text-slate-700" :
                    idx === 2 ? "bg-orange-100 text-orange-700" : "bg-slate-800 text-slate-500"
                  }`}>
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-medium text-slate-300 text-sm">{pet.studentName}</div>
                    <div className="text-[10px] font-medium text-slate-500">{pet.className}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-100 text-sm">Lvl {pet.stats.level}</div>
                  <div className="text-[10px] font-medium text-slate-500">{pet.stats.exp} XP</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#111827]/80 rounded-xl p-6 border border-slate-800">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-bold text-slate-100 flex items-center gap-2 text-sm">
              <History className="w-4 h-4 text-red-500" />
              Riwayat Revive Pet
            </h3>
            <p className="text-xs text-slate-500 mt-1">Menampilkan revive terbaru yang dilakukan admin untuk sekolah ini.</p>
          </div>
          <div className="text-xs text-slate-400">{reviveHistoryRows.length} data terbaru</div>
        </div>
        {reviveHistoryRows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/40 border-y border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Waktu</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Siswa</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Pet</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Admin</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Reset Stat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {reviveHistoryRows.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-300">
                      {item.at ? new Date(item.at).toLocaleString("id-ID") : "-"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="font-bold text-slate-100">{item.studentName}</div>
                      <div className="text-xs font-semibold text-slate-400">{item.studentClass}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="font-bold text-slate-100 uppercase">{item.petName}</div>
                      <div className="text-xs font-semibold text-slate-400">{item.petId}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="font-medium text-slate-300">{item.actorEmail || "-"}</div>
                      <div className="text-xs font-semibold text-slate-400">{item.actorRole || "-"}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="inline-flex flex-wrap gap-2 text-xs font-bold">
                        <span className="rounded-full bg-red-500/15 px-2 py-1 text-red-400">H {item.health ?? "-"}</span>
                        <span className="rounded-full bg-pink-500/15 px-2 py-1 text-pink-400">Happy {item.happiness ?? "-"}</span>
                        <span className="rounded-full bg-yellow-500/15 px-2 py-1 text-yellow-400">Energy {item.energy ?? "-"}</span>
                        <span className="rounded-full bg-orange-500/15 px-2 py-1 text-orange-400">Hunger {item.hunger ?? "-"}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border border-dashed border-slate-700 rounded-lg p-8 flex justify-center items-center">
            <p className="text-sm text-slate-500">Belum ada riwayat revive pet untuk sekolah ini.</p>
          </div>
        )}
      </div>
    </div>
  );
}
