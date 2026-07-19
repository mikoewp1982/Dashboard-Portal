"use client";

import { useGasRecords } from "./useGasRecords";

export function useGasTeachers(schoolId?: string) {
  return useGasRecords("teachers", schoolId);
}
