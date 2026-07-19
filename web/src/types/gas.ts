export type AttendanceStatus = "PRESENT" | "LATE" | "ALPHA" | "IZIN" | "SAKIT";
export type AttendanceSource = "SELF" | "MANUAL";

export interface AttendanceRecord {
  id?: string;
  studentId: string;
  studentName: string;
  classId?: string;
  className: string;
  date: string;
  status: AttendanceStatus;
  source: AttendanceSource;
  note?: string;
  checkInTime?: string | number | null;
  checkOutTime?: string | number | null;
  distanceMeters?: number;
  mockLocationFlag?: boolean;
  serverTimestamp?: string;
  createdAt?: number;
  updatedAt?: number;
}
