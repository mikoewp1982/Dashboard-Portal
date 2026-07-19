"use client";

import { useDatabaseRecords } from "./useDatabaseRecords";

export function useStaffRealtime(schoolId?: string) {
  return useDatabaseRecords("Petugas OSIS", schoolId);
}
