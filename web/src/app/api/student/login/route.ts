import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { resolveCanonicalSchoolContext } from "@/lib/admin/resolveCanonicalSchoolContext";
import { normalizeSchoolId } from "@/lib/gas/schoolId";
import { createHash } from "crypto";
import { signInTeacherWithPassword } from "@/lib/guru/signInTeacherPassword";

export const dynamic = "force-dynamic";

function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

function normalizeLoose(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

async function ensureStudentAuthUser(options: {
  email: string;
  password: string;
  displayName: string;
}) {
  try {
    const existing = await adminAuth.getUserByEmail(options.email);
    await adminAuth.updateUser(existing.uid, {
      displayName: options.displayName,
      disabled: false,
      password: options.password,
      emailVerified: true,
    });
    return existing.uid;
  } catch {
    const created = await adminAuth.createUser({
      email: options.email,
      password: options.password,
      displayName: options.displayName,
      emailVerified: true,
      disabled: false,
    });
    return created.uid;
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      npsn?: string;
      nisn?: string;
      password?: string;
    };

    const npsn = String(body.npsn || "").trim();
    const nisn = String(body.nisn || "").trim();
    const password = String(body.password || "").trim();

    if (!npsn || !nisn || !password) {
      return NextResponse.json(
        { success: false, message: "NPSN, NISN, dan Password wajib diisi." },
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
        studentSnap = querySnap.val() ? Object.values(querySnap.val())[0] as any : null;
        // Mock snapshot to have val()
        if (studentSnap) {
          const data = studentSnap;
          studentSnap = { exists: () => true, val: () => data } as any;
        }
      }
    }

    if (!studentSnap || !studentSnap.exists()) {
      return NextResponse.json(
        { success: false, message: "Siswa dengan NISN tersebut tidak terdaftar di sekolah ini." },
        { status: 404 }
      );
    }

    const studentData = studentSnap.val();
    const hashCandidates = [studentData.passwordHash, studentData.credentialHash].filter(Boolean);
    const plainCandidates = [studentData.password, studentData.credential, nisn].filter(Boolean); // NISN is fallback
    
    let isValid = false;
    
    if (hashCandidates.length > 0) {
      const hashed = sha256Hex(password);
      isValid = hashCandidates.some(h => h.toLowerCase() === hashed.toLowerCase());
    } else {
      isValid = plainCandidates.some(p => normalizeLoose(p) === normalizeLoose(password));
    }

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "Password yang dimasukkan salah." },
        { status: 401 }
      );
    }

    const studentName = studentData.name || studentData.nama || "Siswa";
    const studentClass = studentData.class || studentData.kelas || "";
    const email = `student_${nisn}@${schoolId}.edulock.local`;
    
    const claims = {
      role: "student" as const,
      schoolId,
      npsn: schoolContext.npsn || npsn,
      schoolName: schoolContext.name || "",
      nisn: nisn,
      class: studentClass,
      studentId: nisn,
    };

    const uid = await ensureStudentAuthUser({
      email,
      password: nisn, // Use NISN as underlying Firebase Auth password to avoid tracking plaintext passwords
      displayName: studentName,
    });

    await adminAuth.setCustomUserClaims(uid, claims);
    
    const customToken = await adminAuth.createCustomToken(uid, claims);
    
    // Call Identity Toolkit to get a session (reuse teacher's wrapper since it does exactly this)
    const session = await signInTeacherWithPassword(email, nisn);

    return NextResponse.json({
      success: true,
      email,
      customToken,
      session: {
        localId: session.localId,
        email: session.email,
        displayName: session.displayName || studentName,
        idToken: session.idToken,
        refreshToken: session.refreshToken,
        expiresIn: session.expiresIn,
      },
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
      { success: false, message: "Gagal login siswa. Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
