"use client";

import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { rtdb } from "@/lib/firebase/client";
import { DatabaseRecord, DatabaseTab, getDatabasePath } from "@/components/database/shared/databaseConfig";

export function useDatabaseRecords(activeTab: DatabaseTab, schoolId?: string) {
  const [data, setData] = useState<DatabaseRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  useEffect(() => {
    if (!schoolId || activeTab === "Dashboard Overview") return;

    const path = getDatabasePath(activeTab, schoolId);
    if (!path) return;

    const dataRef = ref(rtdb, path);
    const unsub = onValue(dataRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const parsed = Object.keys(val).map((key) => ({
          id: key,
          ...val[key],
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
    setLoading,
  };
}
