"use client";

import { RotateCcw, Search, Zap } from "lucide-react";
import { derivePetCondition } from "./petUtils";

interface GasPetRiskTabProps {
  searchTerm: string;
  riskPets: any[];
  onSearchChange: (value: string) => void;
  onRevivePet: (petId: string, studentName: string) => Promise<void>;
  onResetPetLevel: (petId: string, studentName: string) => Promise<void>;
}

export function GasPetRiskTab({
  searchTerm,
  riskPets,
  onSearchChange,
  onRevivePet,
  onResetPetLevel,
}: GasPetRiskTabProps) {
  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
        <input
          type="text"
          placeholder="Cari siswa atau nama pet..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-700 bg-slate-900/50 text-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-900/40 border-y border-slate-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-red-500 uppercase tracking-wider">Siswa</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-red-500 uppercase tracking-wider">Pet</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-red-500 uppercase tracking-wider">Masalah</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-red-500 uppercase tracking-wider">Status Detail</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-red-500 uppercase tracking-wider">Keterangan</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-red-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {riskPets.length > 0 ? (
              riskPets.map((pet) => {
                const condition = derivePetCondition(pet, pet.risk);
                return (
                  <tr key={pet.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-100">{pet.studentName}</div>
                      <div className="text-xs font-semibold text-slate-400">{pet.className}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-100 uppercase">{pet.petName}</div>
                      <div className="text-xs font-semibold text-slate-400">Lvl {pet.stats.level}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        {pet.risk.isDead ? (
                          <div className="inline-flex items-center px-2 py-1 rounded bg-black text-white text-xs font-bold w-full shadow-sm">
                            💀 MATI / DEAD
                          </div>
                        ) : (
                          pet.risk.problems.map((problem: string) => (
                            <div key={`${pet.id}-${problem}`} className="inline-flex items-center px-2 py-1 rounded bg-red-900/30 text-red-400 border border-red-700/30 text-xs font-bold w-full">
                              {problem}
                            </div>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <div className="w-48 space-y-2">
                        {[
                          { label: "Health", value: Math.max(0, pet.stats.health), className: pet.stats.health <= 0 ? "bg-black" : "bg-red-500" },
                          { label: "Happy", value: Math.max(0, pet.stats.happiness), className: "bg-pink-500" },
                          { label: "Lapar", value: Math.max(0, pet.stats.hunger || 0), className: "bg-orange-500" },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center text-xs font-medium text-slate-400 gap-2">
                            <span className="w-12">{item.label}</span>
                            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${item.className}`} style={{ width: `${item.value}%` }} />
                            </div>
                            <span className="w-8 text-right font-bold">{item.value}%</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${condition.className}`}>
                        {condition.label}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-400">
                      {pet.risk.isDead ? (
                        <button
                          onClick={() => onRevivePet(pet.id, pet.studentName)}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors shadow-sm flex items-center gap-1"
                        >
                          <Zap className="w-3 h-3" />
                          Hidupkan
                        </button>
                      ) : pet.risk.isLowStatus ? (
                        <button
                          onClick={() => onResetPetLevel(pet.id, pet.studentName)}
                          className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg text-xs font-bold hover:bg-yellow-700 transition-colors shadow-sm flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Reset Lvl
                        </button>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500 font-medium text-sm">
                  Tidak ada pet yang memerlukan perhatian khusus saat ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
