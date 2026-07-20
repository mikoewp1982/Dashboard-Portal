import { useState, useEffect } from "react";
import { rtdb } from "@/lib/firebase/client";
import { ref, onValue, query, orderByChild, limitToLast } from "firebase/database";

export interface EduLockViolationLog {
  id: string;
  timestamp: number;
  nisn: string;
  studentName: string;
  studentClass: string;
  latitude: number | null;
  longitude: number | null;
  type: "OUT_OF_ZONE" | "EMERGENCY_UNLOCK" | "UNINSTALL_BYPASS" | string;
  description: string;
}

export function useEduLockViolations(schoolId: string) {
  const [logs, setLogs] = useState<EduLockViolationLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) return;
    const logsRef = query(
      ref(rtdb, `edulock_violations_log/${schoolId}`),
      orderByChild("timestamp"),
      limitToLast(100)
    );

    const unsub = onValue(logsRef, (snap) => {
      const data = snap.val();
      if (!data) {
        setLogs([]);
      } else {
        const parsed = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        // Sort descending
        parsed.sort((a, b) => b.timestamp - a.timestamp);
        setLogs(parsed as EduLockViolationLog[]);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [schoolId]);

  return {
    logs,
    loading,
  };
}
