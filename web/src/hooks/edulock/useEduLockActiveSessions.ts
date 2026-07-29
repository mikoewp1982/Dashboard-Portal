"use client";

import { useEffect, useState } from "react";
import { ref, onValue, off } from "firebase/database";
import { rtdb } from "@/lib/firebase/client";
import { callAdminApi } from "@/lib/callAdminApi";

export type EduLockActiveSession = {
  nisn: string;
  name?: string;
  class?: string;
  activationSource?: string;
  activationLabel?: string;
  sessionStart?: string;
  sessionEnd?: string;
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
    const sessionsRef = ref(rtdb, `active_sessions_by_school/${schoolId}`);

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
      await callAdminApi("/api/admin/edulock", "POST", {
        action: "revoke-student-permission",
        schoolId,
        nisn,
      });
    } finally {
      setRevoking(false);
    }
  };

  const revokeAllSessions = async () => {
    setRevoking(true);
    try {
      await callAdminApi("/api/admin/edulock", "POST", {
        action: "revoke-all-permissions",
        schoolId,
      });
    } finally {
      setRevoking(false);
    }
  };

  return { sessions, loading, revoking, revokeSession, revokeAllSessions };
}
