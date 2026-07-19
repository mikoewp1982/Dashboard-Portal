"use client";

import { useGasRecords } from "./useGasRecords";

export function useGasStudents(schoolId?: string) {
  return useGasRecords("students", schoolId);
}
