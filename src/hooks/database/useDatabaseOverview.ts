"use client";

import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { rtdb } from "@/lib/firebase/client";
import { DatabaseTab, OverviewCounts } from "@/components/database/shared/databaseConfig";

const countActive = (value: unknown) => {
  if (!value || typeof value !== "object") return 0;
  const rows = Object.values(value as Record<string, { status?: string }>);
  return rows.filter((row) => row?.status !== "Nonaktif").length;
};

export function useDatabaseOverview(activeTab: DatabaseTab, schoolId?: string) {
  const [overviewCounts, setOverviewCounts] = useState<OverviewCounts>({
    studentsActive: 0,
    teachersActive: 0,
    staffActive: 0,
  });
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  useEffect(() => {
    if (!schoolId || activeTab !== "Dashboard Overview") return;

    const studentsRef = ref(rtdb, `gas/schools/${schoolId}/students`);
    const teachersRef = ref(rtdb, `gas/schools/${schoolId}/teachers`);
    const staffRef = ref(rtdb, `gas/schools/${schoolId}/staff`);

    const unsubStudents = onValue(studentsRef, (snapshot) => {
      const value = snapshot.exists() ? snapshot.val() : null;
      setOverviewCounts((prev) => ({ ...prev, studentsActive: countActive(value) }));
      setLastSyncTime(new Date());
    });

    const unsubTeachers = onValue(teachersRef, (snapshot) => {
      const value = snapshot.exists() ? snapshot.val() : null;
      setOverviewCounts((prev) => ({ ...prev, teachersActive: countActive(value) }));
      setLastSyncTime(new Date());
    });

    const unsubStaff = onValue(staffRef, (snapshot) => {
      const value = snapshot.exists() ? snapshot.val() : null;
      setOverviewCounts((prev) => ({ ...prev, staffActive: countActive(value) }));
      setLastSyncTime(new Date());
    });

    return () => {
      unsubStudents();
      unsubTeachers();
      unsubStaff();
    };
  }, [activeTab, schoolId]);

  return {
    overviewCounts,
    lastSyncTime,
  };
}
