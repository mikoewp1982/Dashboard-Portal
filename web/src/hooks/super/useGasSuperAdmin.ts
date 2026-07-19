import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { rtdb as edulockDb } from "@/lib/firebase/client";

export function useGasSuperAdmin(isEduLockAuthLoading: boolean) {
  const [tenantsTotal, setTenantsTotal] = useState(0);
  const [tenantsActive, setTenantsActive] = useState(0);
  const [supportOpen, setSupportOpen] = useState(0);
  const [jobsQueued, setJobsQueued] = useState(0);

  useEffect(() => {
    if (isEduLockAuthLoading) return;
    
    const unsubSchools = onValue(ref(edulockDb, "schools"), (snap) => {
      const data = snap.val();
      if (!data || typeof data !== "object") {
        setTenantsTotal(0);
        setTenantsActive(0);
        return;
      }
      const list = Object.values(data) as any[];
      setTenantsTotal(list.length);
      setTenantsActive(list.filter((v) => (v as any)?.isActive !== false).length);
    });

    const unsubSupport = onValue(ref(edulockDb, "gas/support_requests"), (snap) => {
      const data = snap.val();
      if (!data || typeof data !== "object") {
        setSupportOpen(0);
        return;
      }
      const list = Object.values(data) as any[];
      setSupportOpen(list.filter((v) => String((v as any)?.status || "OPEN") === "OPEN").length);
    });

    const unsubJobs = onValue(ref(edulockDb, "gas/sync_jobs"), (snap) => {
      const data = snap.val();
      if (!data || typeof data !== "object") {
        setJobsQueued(0);
        return;
      }
      const list = Object.values(data) as any[];
      setJobsQueued(list.filter((v) => String((v as any)?.status || "QUEUED") === "QUEUED").length);
    });

    return () => {
      unsubSchools();
      unsubSupport();
      unsubJobs();
    };
  }, [isEduLockAuthLoading]);

  return {
    tenantsTotal,
    tenantsActive,
    supportOpen,
    jobsQueued,
  };
}
