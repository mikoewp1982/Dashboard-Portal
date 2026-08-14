"use client";

import { useDatabaseOverview } from "./useDatabaseOverview";

export function useDatabaseOverviewRealtime(schoolId?: string) {
  return useDatabaseOverview("Dashboard Overview", schoolId);
}
