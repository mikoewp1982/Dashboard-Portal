"use client";

import { useCallback, useEffect, useState } from "react";
import { get, onValue, ref } from "firebase/database";
import { rtdb } from "@/lib/firebase/client";
import { GasRecord, GasTab, getGasPath } from "@/components/gas/shared/gasConfig";

export function useGasRecords(activeTab: GasTab, schoolId?: string) {
  const [data, setData] = useState<GasRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  const refresh = useCallback(async () => {
    if (!schoolId) {
      setData([]);
      setLoading(false);
      return;
    }

    const path = getGasPath(activeTab, schoolId);
    if (!path) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const snapshot = await get(ref(rtdb, path));
      if (snapshot.exists()) {
        const value = snapshot.val();
        const parsed = Object.keys(value).map((key) => ({
          id: key,
          ...value[key],
        }));
        setData(parsed);
      } else {
        setData([]);
      }
      setLastSyncTime(new Date());
    } catch (error) {
      console.error(`Gagal memuat data GAS untuk tab ${activeTab}:`, error);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, schoolId]);

  useEffect(() => {
    if (!schoolId) {
      setData([]);
      setLoading(false);
      return;
    }

    const path = getGasPath(activeTab, schoolId);
    if (!path) {
      setData([]);
      setLoading(false);
      return;
    }

    const dataRef = ref(rtdb, path);
    setLoading(true);
    const unsub = onValue(dataRef, (snapshot) => {
      if (snapshot.exists()) {
        const value = snapshot.val();
        const parsed = Object.keys(value).map((key) => ({
          id: key,
          ...value[key],
        }));
        setData(parsed);
      } else {
        setData([]);
      }
      setLastSyncTime(new Date());
      setLoading(false);
    }, (error) => {
      console.error(`Gagal subscribe data GAS untuk tab ${activeTab}:`, error);
      setData([]);
      setLoading(false);
    });

    return () => unsub();
  }, [activeTab, schoolId]);

  return {
    data,
    loading,
    lastSyncTime,
    refresh,
  };
}
