"use client";

import { useEffect, useState } from "react";
import { getDatabase, ref, onValue, off } from "firebase/database";
import { app } from "@/lib/firebase";

export type EduLockActiveSession = {
  nisn: string;
  name?: string;
  class?: string;
  startTime?: number;
  endTime?: number;
  duration?: number;
  deviceModel?: string;
};

export function useEduLockActiveSessions(schoolId: string) {
  const [sessions, setSessions] = useState<EduLockActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    if (!schoolId) {
      setSessions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const db = getDatabase(app);
    const sessionsRef = ref(db, `active_sessions_by_school/${schoolId}`);

    const handleSnapshot = (snapshot: any) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list: EduLockActiveSession[] = Object.keys(data).map((key) => ({
          nisn: key,
          ...data[key],
        }));
        setSessions(list);
      } else {
        setSessions([]);
      }
      setLoading(false);
    };

    onValue(sessionsRef, handleSnapshot);

    return () => {
      off(sessionsRef, "value", handleSnapshot);
    };
  }, [schoolId]);

  const revokeSession = async (nisn: string) => {
    setRevoking(true);
    try {
      const res = await fetch("/api/admin/edulock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke-student-permission", schoolId, nisn }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Gagal mencabut izin.");
      }
    } finally {
      setRevoking(false);
    }
  };

  const revokeAllSessions = async () => {
    setRevoking(true);
    try {
      const res = await fetch("/api/admin/edulock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke-all-permissions", schoolId }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Gagal mencabut seluruh izin.");
      }
    } finally {
      setRevoking(false);
    }
  };

  return { sessions, loading, revoking, revokeSession, revokeAllSessions };
}
