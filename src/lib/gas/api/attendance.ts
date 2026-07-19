/* eslint-disable @typescript-eslint/no-explicit-any */
import { getFunctions, httpsCallable } from "firebase/functions";
import app from "@/lib/firebase/client";

const functions = getFunctions(app, "asia-southeast1");

export interface ManualAttendancePayload {
  schoolId: string;
  studentId: string;
  status: string;
  date: string;
  note?: string;
}

export const manualAttendanceInput = async (payload: ManualAttendancePayload) => {
  const manualInputFn = httpsCallable<ManualAttendancePayload, any>(functions, "manualAttendanceInput");
  const result = await manualInputFn(payload);
  return result.data;
};

