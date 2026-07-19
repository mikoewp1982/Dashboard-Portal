"use client";

import { useDatabaseRecords } from "./useDatabaseRecords";

export function useClassesRealtime(schoolId?: string) {
  return useDatabaseRecords("Kelas Paralel", schoolId);
}
