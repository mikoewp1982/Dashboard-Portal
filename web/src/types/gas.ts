export type AttendanceStatus = "PRESENT" | "LATE" | "ALPHA" | "IZIN" | "SAKIT";
export type AttendanceSource =
  | "SELF"
  | "TEACHER_MANUAL"
  | "CLASS_SECRETARY"
  | "ADMIN_MANUAL"
  | "SYSTEM"
  | "MANUAL";

export interface AttendanceRecord {
  id?: string;
  studentId: string;
  studentName: string;
  classId?: string;
  className: string;
  date: string;
  status: AttendanceStatus;
  source: AttendanceSource;
  sourceLabel?: string;
  note?: string;
  checkInTime?: string | number | null;
  checkOutTime?: string | number | null;
  checkInMethod?: string | null;
  recordedBy?: string | null;
  verificationStatus?: string | null;
  verifiedBy?: string | null;
  verifiedAt?: number | null;
  proposedBy?: string | null;
  proposedAt?: number | null;
  proposedStatus?: string | null;
  distanceMeters?: number;
  mockLocationFlag?: boolean;
  serverTimestamp?: string;
  createdAt?: number;
  updatedAt?: number;
}
