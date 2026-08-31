import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { resolveCanonicalSchoolContext } from "@/lib/admin/resolveCanonicalSchoolContext";
import { normalizeSchoolId } from "@/lib/gas/schoolId";

export const dynamic = "force-dynamic";

function studentAuthEmail(schoolId: string, nisn: string) {
  const safe = `${schoolId}_${nisn}`
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .slice(0, 64);
  return `${safe || "siswa"}@student.gas.local`;
}

function studentAuthEmailCandidates(schoolId: string, nisn: string) {
  const safe = `${schoolId}_${nisn}`
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .slice(0, 64);
  const local = safe || "siswa";
  return [
    `${local}@student.gas.local`,
    `student_${nisn}@${schoolId}.edulock.local`,
    `${local}@siswa.gas.local`,
  ];
}

async function ensureStudentAuthUser(options: {
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
      // try next candidate
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

async function exchangePasswordForSession(email: string, password: string) {
  const apiKey =
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() ||
    process.env.FIREBASE_WEB_API_KEY?.trim() ||
    "AIzaSyDu0-azn8PV7dNEnXC2HHsf2_gxSd7dzcs";

  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    );

    const payload = (await response.json().catch(() => ({}))) as {
      localId?: string;
      email?: string;
      displayName?: string;
      idToken?: string;
      refreshToken?: string;
      expiresIn?: string;
    };

    if (
      response.ok &&
      payload.localId &&
      payload.email &&
      payload.idToken &&
      payload.refreshToken &&
      payload.expiresIn
    ) {
      return {
        localId: payload.localId,
        email: payload.email,
        displayName: payload.displayName,
        idToken: payload.idToken,
        refreshToken: payload.refreshToken,
        expiresIn: payload.expiresIn,
      };
    }
  } catch {
    // ignore network errors, fallback to customToken
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      npsn?: string;
      nisn?: string;
    };

    const npsn = String(body.npsn || "").trim();
    const nisn = String(body.nisn || "").trim();

    if (!npsn || !nisn) {
      return NextResponse.json(
        { success: false, message: "NPSN dan NISN wajib diisi." },
        { status: 400 }
      );
    }

    const schoolContext = await resolveCanonicalSchoolContext({
      schoolId: npsn,
      npsn,
    });

    if (!schoolContext?.schoolId) {
      return NextResponse.json(
        { success: false, message: "Sekolah tidak ditemukan atau tidak aktif." },
        { status: 404 }
      );
    }

    const schoolId = normalizeSchoolId(schoolContext.schoolId);
    const db = adminDb;
    
    // Cari siswa di RTDB: gas/schools/{schoolId}/students/{nisn}
    const studentsRef = db.ref(`gas/schools/${schoolId}/students`);
    let studentSnap = await studentsRef.child(nisn).once("value");
    
    if (!studentSnap.exists()) {
      // Coba lookup by numeric child 'nisn'
      const querySnap = await studentsRef.orderByChild("nisn").equalTo(Number(nisn)).once("value");
      if (querySnap.exists()) {
        const firstChild = Object.values(querySnap.val() || {})[0];
        studentSnap = { exists: () => true, val: () => firstChild } as any;
      }
    }

    if (!studentSnap || !studentSnap.exists()) {
      // Coba lookup by string child 'nisn'
      const querySnapStr = await studentsRef.orderByChild("nisn").equalTo(nisn).once("value");
      if (querySnapStr.exists()) {
        const firstChild = Object.values(querySnapStr.val() || {})[0];
        studentSnap = { exists: () => true, val: () => firstChild } as any;
      }
    }

    if (!studentSnap || !studentSnap.exists()) {
      return NextResponse.json(
        { success: false, message: "Siswa dengan NISN tersebut tidak terdaftar di database sekolah ini." },
        { status: 404 }
      );
    }

    const studentData = studentSnap.val() || {};
    const studentName = studentData.name || studentData.nama || "Siswa";
    const studentClass = studentData.class || studentData.kelas || "";
    const email = studentAuthEmail(schoolId, nisn);
    
    // Firebase Auth requires password length >= 6
    const authPassword = nisn.length < 6 ? `gas_${nisn}_siswa` : nisn;

    const claims = {
      role: "student" as const,
      schoolId,
      npsn: schoolContext.npsn || npsn,
      schoolName: schoolContext.name || "",
      nisn: nisn,
      class: studentClass,
      studentId: nisn,
    };

    let uid: string;
    try {
      uid = await ensureStudentAuthUser({
        email,
        password: authPassword,
        displayName: studentName,
        emailCandidates: studentAuthEmailCandidates(schoolId, nisn),
      });
      await adminAuth.setCustomUserClaims(uid, claims);
    } catch (e) {
      console.error("Failed to ensure student auth user:", e);
      // Fallback uid if admin user creation fails
      uid = `student_${schoolId}_${nisn}`.slice(0, 128);
    }

    let customToken: string | undefined;
    try {
      customToken = await adminAuth.createCustomToken(uid, claims);
    } catch (e) {
      console.error("Failed to create custom token:", e);
    }

    // Call Identity Toolkit to get a direct session
    const session = await exchangePasswordForSession(email, authPassword);

    return NextResponse.json({
      success: true,
      email,
      customToken: customToken || undefined,
      session: session ? {
        localId: session.localId,
        email: session.email,
        displayName: session.displayName || studentName,
        idToken: session.idToken,
        refreshToken: session.refreshToken,
        expiresIn: session.expiresIn,
      } : undefined,
      student: {
        id: nisn,
        name: studentName,
        nisn: nisn,
        schoolId,
        npsn: schoolContext.npsn || npsn,
        schoolName: schoolContext.name || "",
        class: studentClass,
      },
    });
  } catch (error: unknown) {
    console.error("Student login error:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Gagal login siswa. Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
