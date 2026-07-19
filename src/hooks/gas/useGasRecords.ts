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
    if (!schoolId) return;

    const path = getGasPath(activeTab, schoolId);
    if (!path) return;

    setLoading(true);
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
    setLoading(false);
  }, [activeTab, schoolId]);

  useEffect(() => {
    if (!schoolId) return;

    const path = getGasPath(activeTab, schoolId);
    if (!path) return;

    const dataRef = ref(rtdb, path);
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
