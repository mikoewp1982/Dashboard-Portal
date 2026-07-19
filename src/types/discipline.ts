export interface DisciplineRule {
  id: number;
  ruleName: string;
  category: "VIOLATION" | "ACHIEVEMENT";
  points: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string | null;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface DisciplineRecord {
  id: string;
  studentId: string;
  studentNameSnapshot?: string;
  classNameSnapshot?: string;
  ruleId: number;
  ruleNameSnapshot?: string;
  category: "VIOLATION" | "ACHIEVEMENT";
  points: number;
  date: number; // timestamp ms
  note: string | null;
  recordedBy: string;
  recordedByName?: string;
  reportedByRole?: "teacher" | "osis" | "admin";
  createdAt: number;
}
