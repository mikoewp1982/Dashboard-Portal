"use client";

import { useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { useGasVirtualPet, PetData } from "@/hooks/gas/virtual-pet/useGasVirtualPet";
import { useGasStudents } from "@/hooks/gas/useGasStudents";
import { analyzePetRisk } from "./petUtils";
import { GasPetHeader } from "./GasPetHeader";
import { GasPetStatsCards } from "./GasPetStatsCards";
import { GasPetSummaryTab } from "./GasPetSummaryTab";
import { GasPetRiskTab } from "./GasPetRiskTab";
import { GasPetLeaderboardTab } from "./GasPetLeaderboardTab";
import { GasPetStatsTab } from "./GasPetStatsTab";
import { GasPetRewardsTab } from "./GasPetRewardsTab";

const tabs = [
  { id: "summary", label: "Ringkasan" },
  { id: "leaderboard", label: "Global Leaderboard" },
  { id: "risk", label: "Students at Risk" },
  { id: "stats", label: "Statistik" },
  { id: "rewards", label: "Admin Reward" },
] as const;

type GasPetTab = (typeof tabs)[number]["id"];

type GasStudentRecord = {
  id: string;
  name?: string;
  nisn?: string;
  username?: string;
  class?: string;
  kelas?: string;
  className?: string;
};

type EnrichedPet = PetData & {
  className: string;
};

function normalizeIdentity(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function getStudentAliases(student: GasStudentRecord) {
  return [student.id, student.nisn, student.username].map(normalizeIdentity).filter(Boolean);
}

function getStudentClass(student?: GasStudentRecord | null) {
  return String(student?.kelas || student?.className || student?.class || "Unknown").trim() || "Unknown";
}

export function GasPetPanel({ schoolId }: { schoolId: string }) {
  const { pets, reviveHistory, loading, refresh, revivePet, killPet, resetPetLevel, giveReward } = useGasVirtualPet(schoolId);
  const { data: students } = useGasStudents(schoolId);
  const [activeTab, setActiveTab] = useState<GasPetTab>('risk');
  const [searchTerm, setSearchTerm] = useState('');

  // Reward States
  const [rewardTarget, setRewardTarget] = useState<'all' | 'class' | 'student'>('all');
  const [selectedClassReward, setSelectedClassReward] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [rewardType, setRewardType] = useState<'coins' | 'exp' | 'intelligence' | 'social'>('coins');
  const [rewardAmount, setRewardAmount] = useState(10);
  const [isSubmittingReward, setIsSubmittingReward] = useState(false);

  const typedStudents = useMemo(() => students as GasStudentRecord[], [students]);

  const studentLookup = useMemo(() => {
    const map = new Map<string, GasStudentRecord>();
    for (const student of typedStudents) {
      for (const alias of getStudentAliases(student)) {
        if (!map.has(alias)) {
          map.set(alias, student);
        }
      }
    }
    return map;
  }, [typedStudents]);

  // Enrich pets with student data
  const enrichedPets = useMemo<EnrichedPet[]>(() => {
    return pets.map((pet) => {
      const student = studentLookup.get(normalizeIdentity(pet.studentId));
      const existingClassName = String((pet as PetData & { className?: string }).className || "").trim();
      return {
        ...pet,
        studentName: student?.name || pet.studentName,
        className: student ? getStudentClass(student) : existingClassName || 'Unknown',
      };
    });
  }, [pets, studentLookup]);

  const studentsWithoutPetCount = useMemo(() => {
    return typedStudents.filter((student) => {
      const aliases = new Set(getStudentAliases(student));
      return !pets.some((pet) => aliases.has(normalizeIdentity(pet.studentId)));
    }).length;
  }, [pets, typedStudents]);

  const stats = useMemo(() => {
    const activePets = enrichedPets.filter(p => p.stats.health > 0);
    const totalPets = activePets.length;
    const avgLevel = totalPets > 0 
      ? (activePets.reduce((acc, curr) => acc + (curr.stats.level || 1), 0) / totalPets).toFixed(1) 
      : "0";
    
    const atRisk = enrichedPets.filter((pet) => {
      const risk = analyzePetRisk(pet);
      return risk.isDead || risk.isSick || risk.isSad || risk.isStarving || risk.isLowStatus;
    }).length;

    return { totalPets, avgLevel, atRisk };
  }, [enrichedPets]);

  const statGroups = useMemo(() => {
    return (["health", "happiness", "energy"] as const).map((stat) => {
      const values = enrichedPets.map((pet) => Number(pet.stats[stat] || 0));
      const total = values.length || 1;
      const highCount = values.filter((value) => value >= 70).length;
      const mediumCount = values.filter((value) => value >= 30 && value < 70).length;
      const lowCount = values.filter((value) => value < 30).length;

      return {
        key: stat,
        title: `${stat} Distribution`,
        highPercentage: Math.round((highCount / total) * 100),
        mediumPercentage: Math.round((mediumCount / total) * 100),
        lowPercentage: Math.round((lowCount / total) * 100),
      };
    });
  }, [enrichedPets]);

  const topClasses = useMemo(() => {
    const classMap = new Map<string, { totalLevel: number, count: number }>();
    enrichedPets.forEach(p => {
      const className = p.className;
      if (className === 'Unknown') return;
      
      if (!classMap.has(className)) {
        classMap.set(className, { totalLevel: 0, count: 0 });
      }
      const entry = classMap.get(className)!;
      entry.totalLevel += (p.stats.level || 1);
      entry.count += 1;
    });

    return Array.from(classMap.entries())
      .map(([className, data]) => ({
        className,
        avgLevel: parseFloat((data.totalLevel / data.count).toFixed(1))
      }))
      .sort((a, b) => b.avgLevel - a.avgLevel)
      .slice(0, 5);
  }, [enrichedPets]);

  const leaderboardData = useMemo(() => {
    return [...enrichedPets].sort((a, b) => {
      const levelDiff = (b.stats.level || 1) - (a.stats.level || 1);
      if (levelDiff !== 0) return levelDiff;
      return (b.stats.exp || 0) - (a.stats.exp || 0);
    });
  }, [enrichedPets]);

  const riskPets = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const rows = enrichedPets
      .map(p => ({ ...p, risk: analyzePetRisk(p) }))
      .filter(p => p.risk.isDead || p.risk.isSick || p.risk.isSad || p.risk.isStarving || p.risk.isLowStatus)
      .filter((p) => {
        if (!normalizedSearch) return true;
        return p.studentName.toLowerCase().includes(normalizedSearch) || p.petName.toLowerCase().includes(normalizedSearch);
      })
      .sort((a, b) => {
        if (a.risk.isDead !== b.risk.isDead) return a.risk.isDead ? -1 : 1;
        return a.studentName.localeCompare(b.studentName);
      });
    return rows;
  }, [enrichedPets, searchTerm]);

  // Derive unique classes for Reward Tab
  const uniqueClasses = useMemo(() => {
    return Array.from(new Set(typedStudents.map((student) => getStudentClass(student)).filter((value) => value !== "Unknown")));
  }, [typedStudents]);

  const reviveHistoryRows = useMemo(() => {
    return reviveHistory.map((item) => {
      const pet = enrichedPets.find((entry) => entry.id === item.petId);
      return {
        ...item,
        studentName: pet?.studentName || 'Siswa tidak ditemukan',
        studentClass: pet?.className || '-',
        petName: pet?.petName || 'Buddy',
      };
    });
  }, [reviveHistory, enrichedPets]);

  const handleGiveReward = async () => {
    if (rewardAmount <= 0) return;
    setIsSubmittingReward(true);
    try {
        let targetPetIds: string[] = [];
        
        if (rewardTarget === 'all') {
            targetPetIds = enrichedPets.map(p => p.id);
        } else if (rewardTarget === 'class') {
            if (!selectedClassReward) {
                alert('Pilih kelas terlebih dahulu');
                setIsSubmittingReward(false);
                return;
            }
            targetPetIds = enrichedPets.filter(p => p.className === selectedClassReward).map(p => p.id);
        } else if (rewardTarget === 'student') {
            if (!selectedStudentId) {
                alert('Pilih siswa terlebih dahulu');
                setIsSubmittingReward(false);
                return;
            }
            const selectedStudent = typedStudents.find((student) => student.id === selectedStudentId);
            const selectedAliases = new Set(getStudentAliases(selectedStudent || { id: selectedStudentId }));
            targetPetIds = enrichedPets
                .filter((pet) => selectedAliases.has(normalizeIdentity(pet.studentId)))
                .map((pet) => pet.id);
        }

        if (targetPetIds.length > 0) {
            await giveReward(targetPetIds, rewardType, rewardAmount);
            alert(`Berhasil mengirim reward ke ${targetPetIds.length} pets!`);
            setRewardAmount(10);
        } else {
            alert('Tidak ada pet yang ditemukan untuk target ini.');
        }
    } catch (err) {
        console.error(err);
        alert('Gagal mengirim reward');
    } finally {
        setIsSubmittingReward(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#0b1221]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-6 space-y-6 overflow-y-auto bg-[#0b1221]">
      <GasPetHeader loading={loading} onRefresh={() => void refresh()} />
      <GasPetStatsCards stats={stats} />
      {typedStudents.length > 0 && pets.length === 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Data siswa tenant ini terbaca {typedStudents.length} siswa, tetapi belum ada data pet yang cocok untuk monitor ini.
          Ini biasanya berarti node `virtual_pets` belum terbentuk, `studentId` pet belum match ke siswa, atau `schoolId` pet lama belum sinkron.
        </div>
      )}
      {typedStudents.length > 0 && pets.length > 0 && studentsWithoutPetCount > 0 && (
        <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
          Monitor web sudah membaca {typedStudents.length} siswa. Saat ini {studentsWithoutPetCount} siswa belum punya data pet yang terhubung.
        </div>
      )}

      {/* Main Content */}
      <div className="bg-[#111827]/40 rounded-xl border border-slate-800 overflow-hidden mt-2">
        {/* Tabs */}
        <div className="border-b border-slate-800 px-6 pt-4 flex gap-8 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`cursor-pointer pb-4 text-sm font-medium flex items-center gap-2 transition-colors relative ${
                activeTab === tab.id 
                ? 'text-red-500 border-b-2 border-red-500' 
                : 'text-slate-400 hover:text-slate-300 border-transparent border-b-2'
              }`}
            >
              {tab.label}
              {tab.id === 'risk' && stats.atRisk > 0 && (
                <span className="bg-red-200 text-red-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1">
                  {stats.atRisk}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'summary' && (
            <GasPetSummaryTab
              topClasses={topClasses}
              leaderboardData={leaderboardData}
              reviveHistoryRows={reviveHistoryRows}
            />
          )}

          {activeTab === 'risk' && (
            <GasPetRiskTab
              searchTerm={searchTerm}
              riskPets={riskPets}
              onSearchChange={setSearchTerm}
              onRevivePet={async (petId, studentName) => {
                if (confirm(`Revive pet milik ${studentName}?`)) {
                  await revivePet(petId);
                  alert("Berhasil menghidupkan kembali pet.");
                }
              }}
              onResetPetLevel={async (petId, studentName) => {
                if (confirm(`Reset Level pet milik ${studentName}? Level akan kembali ke 1 dan XP ke 0.`)) {
                  await resetPetLevel(petId);
                }
              }}
            />
          )}

          {activeTab === 'leaderboard' && (
            <GasPetLeaderboardTab 
              leaderboardData={leaderboardData} 
            />
          )}
          
          {activeTab === 'stats' && (
            <GasPetStatsTab statGroups={statGroups} />
          )}

          {activeTab === 'rewards' && (
            <GasPetRewardsTab
              rewardTarget={rewardTarget}
              selectedClassReward={selectedClassReward}
              selectedStudentId={selectedStudentId}
              studentSearchTerm={studentSearchTerm}
              rewardType={rewardType}
              rewardAmount={rewardAmount}
              isSubmittingReward={isSubmittingReward}
              uniqueClasses={uniqueClasses}
              students={typedStudents}
              onRewardTargetChange={setRewardTarget}
              onClassRewardChange={setSelectedClassReward}
              onStudentSearchChange={setStudentSearchTerm}
              onStudentSelect={(studentId, studentName) => {
                setSelectedStudentId(studentId);
                setStudentSearchTerm(studentName);
              }}
              onStudentClear={() => {
                setSelectedStudentId("");
                setStudentSearchTerm("");
              }}
              onRewardTypeChange={setRewardType}
              onRewardAmountChange={setRewardAmount}
              onSubmit={handleGiveReward}
            />
          )}

        </div>
      </div>
    </div>
  );
}
