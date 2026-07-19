"use client";

import { useDatabaseRecords } from "./useDatabaseRecords";

export function useTeachersRealtime(schoolId?: string) {
  return useDatabaseRecords("Guru/Wali Kelas", schoolId);
}
