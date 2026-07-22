import { useState, useEffect, useCallback } from "react";
import { callAdminApi } from "@/lib/callAdminApi";
import { isSessionInactiveError } from "@/lib/firebase/waitForClientUser";

export interface PetStats {
  level: number;
  exp: number;
  maxExp: number;
  health: number;
  energy: number;
  happiness: number;
  intelligence: number;
  social: number;
  creativity: number;
  coins: number;
  hunger: number;
}

export interface PetData {
  id: string;
  studentId: string;
  schoolId?: string;
  studentName: string;
  petName: string;
  type: string;
  status: string;
  manualReviveUntil?: number;
  stats: PetStats;
  lastSync: number;
  lastFed?: number;
  lastPlayed?: number;
  lastQuestReset?: number;
  achievements: string[];
}

export interface ReviveHistoryItem {
  id: string;
  at: number;
  schoolId: string;
  petId: string;
  actorEmail: string;
  actorRole: string;
  health: number | null;
  happiness: number | null;
  energy: number | null;
  hunger: number | null;
  studentName?: string;
  studentClass?: string;
  petName?: string;
}

export function useGasVirtualPet(schoolId: string | undefined) {
  const [pets, setPets] = useState<PetData[]>([]);
  const [reviveHistory, setReviveHistory] = useState<ReviveHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!schoolId) {
      setPets([]);
      setReviveHistory([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const result = await callAdminApi(`/api/admin/virtual-pet?schoolId=${schoolId}`, "GET");
      setPets(Array.isArray(result?.pets) ? result.pets as PetData[] : []);
      setReviveHistory(Array.isArray(result?.reviveHistory) ? result.reviveHistory as ReviveHistoryItem[] : []);
    } catch (error) {
      if (!isSessionInactiveError(error)) {
        console.error("Error fetching virtual pet snapshot:", error);
      }
      setPets([]);
      setReviveHistory([]);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const revivePet = async (petId: string) => {
    try {
      await callAdminApi("/api/admin/virtual-pet", "POST", {
        action: "revive",
        petId,
      });
      await refresh();
    } catch (error) {
      if (!isSessionInactiveError(error)) {
        console.error("Error reviving pet:", error);
      }
      throw error;
    }
  };

  const resetPetLevel = async (petId: string) => {
    try {
      await callAdminApi("/api/admin/virtual-pet", "POST", {
        action: "reset-level",
        petId,
      });
      await refresh();
    } catch (error) {
      if (!isSessionInactiveError(error)) {
        console.error("Error resetting pet level:", error);
      }
      throw error;
    }
  };

  const giveReward = async (petIds: string[], type: "coins" | "exp" | "intelligence" | "social", amount: number) => {
    try {
      await callAdminApi("/api/admin/virtual-pet", "POST", {
        action: "give-reward",
        petIds,
        rewardType: type,
        amount,
      });
      await refresh();
    } catch (error) {
      if (!isSessionInactiveError(error)) {
        console.error("Error giving rewards:", error);
      }
      throw error;
    }
  };

  return {
    pets,
    reviveHistory,
    loading,
    refresh,
    revivePet,
    resetPetLevel,
    giveReward,
  };
}
