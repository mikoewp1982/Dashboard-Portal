import { adminAuth } from "@/lib/firebase-admin";
import { normalizeSchoolId } from "@/lib/gas/schoolId";

export type TeacherClaims = {
  uid: string;
  schoolId: string;
  nuptk: string;
  className: string;
  teacherId: string;
  name: string;
};

export class TeacherAuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export async function verifyTeacherRequest(req: Request): Promise<TeacherClaims> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new TeacherAuthError("Unauthorized", 401);
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    throw new TeacherAuthError("Unauthorized", 401);
  }

  const decoded = await adminAuth.verifyIdToken(token);
  if (decoded.role !== "teacher") {
    throw new TeacherAuthError("Hanya untuk akun guru.", 403);
  }

  const schoolId = normalizeSchoolId(decoded.schoolId);
  const nuptk = String(decoded.nuptk || "").trim();
  const className = String(decoded.class || "").trim();

  if (!schoolId || !nuptk) {
    throw new TeacherAuthError("Claims guru tidak lengkap (schoolId/nuptk).", 400);
  }

  return {
    uid: decoded.uid,
    schoolId,
    nuptk,
    className,
    teacherId: String(decoded.teacherId || "").trim(),
    name: String(decoded.name || "").trim(),
  };
}
