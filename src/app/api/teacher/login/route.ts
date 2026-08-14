import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { resolveCanonicalSchoolContext } from "@/lib/admin/resolveCanonicalSchoolContext";
import { normalizeSchoolId } from "@/lib/gas/schoolId";
import { readHomeroomClass } from "@/lib/guru/normalizeClass";
import { teacherAuthEmail, teacherAuthEmailCandidates } from "@/lib/guru/teacherAuthEmail";
import {
  findTeacher,
  isTeacherActive,
  readTeacherString,
} from "@/lib/guru/findTeacher";
import { createTeacherCustomToken } from "@/lib/guru/mintTeacherCustomToken";
import { signInTeacherWithPassword } from "@/lib/guru/signInTeacherPassword";

export const dynamic = "force-dynamic";

function toUserFacingMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Gagal login guru.";
  if (/signBlob|iam\.serviceAccounts|create-custom-tokens/i.test(message)) {
    return "Konfigurasi autentikasi server belum siap. Hubungi admin teknis.";
  }
  return message;
}

async function ensureTeacherAuthUser(options: {
  email: string;
  password: string;
  displayName: string;
  emailCandidates?: string[];
}) {
  const candidates = options.emailCandidates?.length
    ? options.emailCandidates
    : [options.email];

  for (const candidate of candidates) {
    try {
      const existing = await adminAuth.getUserByEmail(candidate);
      await adminAuth.updateUser(existing.uid, {
        email: options.email,
        displayName: options.displayName,
        disabled: false,
        password: options.password,
        emailVerified: true,
      });
      return existing.uid;
    } catch {
      // try next candidate / create
    }
  }

  const created = await adminAuth.createUser({
    email: options.email,
    password: options.password,
    displayName: options.displayName,
    emailVerified: true,
    disabled: false,
  });
  return created.uid;
}

/**
 * Teacher login for GAS Guru PWA.
 *
 * Validates against the same RTDB master as admin Database → Guru/Wali Kelas
 * and APK GAS Guru (`gas/schools/{schoolId}/teachers`). Credentials match APK:
 * NPSN + NUPTK (nama is display-only on APK).
 *
 * Auth session strategy (App Hosting safe):
 * 1) Ensure Auth user with password = NUPTK (no arbitrary account inventing)
 * 2) Mint customToken when service-account private key is available
 * 3) Always complete Identity Toolkit password sign-in on the server and return
 *    tokens so the browser can apply a session even if client Auth XHR fails
 *    with auth/network-request-failed (*.hosted.app has no /__/auth handler).
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
        { success: false, message: "NPSN dan NUPTK wajib diisi (sama seperti APK GAS Guru)." },
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
        { success: false, message: "Sekolah dengan NPSN tersebut tidak ditemukan atau tidak aktif." },
        { status: 404 }
      );
    }

    const schoolId = normalizeSchoolId(schoolContext.schoolId);
    const teacher = await findTeacher(schoolId, nuptk);
    if (!teacher) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Guru dengan NUPTK tersebut tidak terdaftar di database admin (Manajemen Guru/Wali Kelas).",
        },
        { status: 404 }
      );
    }

    if (!isTeacherActive(teacher.row)) {
      return NextResponse.json(
        { success: false, message: "Akun guru berstatus Nonaktif. Hubungi admin sekolah." },
        { status: 403 }
      );
    }

    const teacherName = readTeacherString(teacher.row, "name", "nama") || "Guru";
    const homeroomClass = readHomeroomClass(teacher.row);
    const storedNuptk = readTeacherString(teacher.row, "nuptk");
    // APK password credential = NUPTK in master data (fallback: record key / submitted value).
    const resolvedNuptk = storedNuptk || (teacher.id === nuptk ? teacher.id : "") || nuptk;

    if (storedNuptk && normalizeLoose(storedNuptk) !== normalizeLoose(nuptk)) {
      return NextResponse.json(
        { success: false, message: "NUPTK salah. Gunakan NUPTK yang terdaftar di database admin." },
        { status: 401 }
      );
    }

    const email = teacherAuthEmail(schoolId, resolvedNuptk);
    const password = resolvedNuptk;
    const claims = {
      role: "teacher" as const,
      schoolId,
      npsn: schoolContext.npsn || npsn,
      schoolName: schoolContext.name || "",
      nuptk: resolvedNuptk,
      class: homeroomClass,
      teacherId: teacher.id,
    };

    const uid = await ensureTeacherAuthUser({
      email,
      password,
      displayName: teacherName,
      emailCandidates: teacherAuthEmailCandidates(schoolId, resolvedNuptk),
    });

    await adminAuth.setCustomUserClaims(uid, claims);

    const customToken = await createTeacherCustomToken(uid, claims);
    const session = await signInTeacherWithPassword(email, password);

    return NextResponse.json({
      success: true,
      email,
      customToken: customToken || undefined,
      // Browser may fail Identity Toolkit XHR on App Hosting; client applies this session.
      session: {
        localId: session.localId,
        email: session.email,
        displayName: session.displayName || teacherName,
        idToken: session.idToken,
        refreshToken: session.refreshToken,
        expiresIn: session.expiresIn,
      },
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

function normalizeLoose(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}
