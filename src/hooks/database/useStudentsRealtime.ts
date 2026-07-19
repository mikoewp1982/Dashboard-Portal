"use client";

import { useDatabaseRecords } from "./useDatabaseRecords";

export function useStudentsRealtime(schoolId?: string) {
  return useDatabaseRecords("Siswa", schoolId);
}
