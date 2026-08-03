import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { resolveCanonicalSchoolContext } from "@/lib/admin/resolveCanonicalSchoolContext";
import { normalizeSchoolId } from "@/lib/gas/schoolId";
import { readHomeroomClass } from "@/lib/guru/normalizeClass";
import { teacherAuthEmail } from "@/lib/guru/teacherAuthEmail";

export const dynamic = "force-dynamic";

type TeacherRow = Record<string, unknown>;

function readString(source: TeacherRow | null | undefined, ...keys: string[]) {
  if (!source) return "";
  for (const key of keys) {
    const value = String(source[key] ?? "").trim();
    if (value) return value;
  }
  return "";
}

function toUserFacingMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Gagal login guru.";
  // Avoid leaking App Hosting / IAM internals to end users.
  if (/signBlob|iam\.serviceAccounts|create-custom-tokens/i.test(message)) {
    return "Konfigurasi autentikasi server belum siap. Hubungi admin teknis.";
  }
  return message;
}

async function findTeacher(schoolId: string, nuptk: string): Promise<{ id: string; row: TeacherRow } | null> {
  const teachersRef = adminDb.ref(`gas/schools/${schoolId}/teachers`);
  const directSnap = await teachersRef.child(nuptk).get();
  if (directSnap.exists()) {
    return { id: directSnap.key || nuptk, row: (directSnap.val() || {}) as TeacherRow };
  }

  const byNuptk = await teachersRef.orderByChild("nuptk").equalTo(nuptk).limitToFirst(1).get();
  if (byNuptk.exists()) {
    const entry = Object.entries(byNuptk.val() as Record<string, TeacherRow>)[0];
    if (entry) return { id: entry[0], row: entry[1] || {} };
  }

  const byUsername = await teachersRef.orderByChild("username").equalTo(nuptk).limitToFirst(1).get();
  if (byUsername.exists()) {
    const entry = Object.entries(byUsername.val() as Record<string, TeacherRow>)[0];
    if (entry) return { id: entry[0], row: entry[1] || {} };
  }

  return null;
}

/**
 * Teacher login for GAS Guru PWA.
 *
 * Intentionally uses email/password Auth (same pattern as admin bootstrap/login)
 * instead of adminAuth.createCustomToken(). On Firebase App Hosting, ADC often
 * lacks iam.serviceAccounts.signBlob, which breaks createCustomToken.
 *
 * Optional IAM alternative (not required after this change):
 * Grant the App Hosting runtime service account
 * roles/iam.serviceAccountTokenCreator on itself, or set FIREBASE_SERVICE_ACCOUNT_KEY
 * / FIREBASE_CLIENT_EMAIL+FIREBASE_PRIVATE_KEY via App Hosting secrets.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      npsn?: string;
      nuptk?: string;
    };

    const npsn = String(body.npsn || "").trim();
    const nuptk = String(body.nuptk || "").trim();

    if (!npsn || !nuptk) {
      return NextResponse.json(
        { success: false, message: "NPSN dan NUPTK wajib diisi." },
        { status: 400 }
      );
    }

    if (nuptk.length < 6) {
      return NextResponse.json(
        { success: false, message: "NUPTK tidak valid." },
        { status: 400 }
      );
    }

    const schoolContext = await resolveCanonicalSchoolContext({
      schoolId: npsn,
      npsn,
    });

    if (!schoolContext?.schoolId) {
      return NextResponse.json(
        { success: false, message: "Sekolah dengan NPSN tersebut tidak ditemukan." },
        { status: 404 }
      );
    }

    const schoolId = normalizeSchoolId(schoolContext.schoolId);
    const teacher = await findTeacher(schoolId, nuptk);
    if (!teacher) {
      return NextResponse.json(
        { success: false, message: "Guru dengan NUPTK tersebut tidak ditemukan." },
        { status: 404 }
      );
    }

    const teacherName = readString(teacher.row, "name", "nama") || "Guru";
    const homeroomClass = readHomeroomClass(teacher.row);
    const resolvedNuptk = readString(teacher.row, "nuptk") || nuptk;
    const email = teacherAuthEmail(schoolId, resolvedNuptk);
    // NUPTK is the teacher credential (same role as admin password / student NISN).
    const password = nuptk;

    let uid = "";
    try {
      const existing = await adminAuth.getUserByEmail(email);
      uid = existing.uid;
      await adminAuth.updateUser(uid, {
        displayName: teacherName,
        disabled: false,
        password,
      });
    } catch {
      const created = await adminAuth.createUser({
        email,
        password,
        displayName: teacherName,
        emailVerified: true,
        disabled: false,
      });
      uid = created.uid;
    }

    await adminAuth.setCustomUserClaims(uid, {
      role: "teacher",
      schoolId,
      npsn: schoolContext.npsn || npsn,
      schoolName: schoolContext.name || "",
      nuptk: resolvedNuptk,
      class: homeroomClass,
      teacherId: teacher.id,
    });

    return NextResponse.json({
      success: true,
      email,
      teacher: {
        id: teacher.id,
        name: teacherName,
        nuptk: resolvedNuptk,
        schoolId,
        npsn: schoolContext.npsn || npsn,
        schoolName: schoolContext.name || "",
        class: homeroomClass,
      },
    });
  } catch (error: unknown) {
    console.error("Teacher login error:", error);
    return NextResponse.json(
      {
        success: false,
        message: toUserFacingMessage(error),
      },
      { status: 500 }
    );
  }
}
