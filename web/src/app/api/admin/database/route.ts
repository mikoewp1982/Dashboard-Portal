import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { resolveCanonicalSchoolContext } from "@/lib/admin/resolveCanonicalSchoolContext";

type AdminDatabaseRequestBody = {
  action?: "create" | "update" | "delete" | "delete-all";
  tab?: string;
  data?: Record<string, unknown>;
  id?: string;
};

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    if (decodedToken.role !== "admin") {
      return NextResponse.json({ success: false, message: "Akses ditolak" }, { status: 403 });
    }

    const schoolContext = await resolveCanonicalSchoolContext({
      schoolId: decodedToken.schoolId,
      npsn: decodedToken.npsn,
      email: decodedToken.email,
    });
    const schoolId = schoolContext?.schoolId;
    if (!schoolId || !schoolContext) {
      return NextResponse.json({ success: false, message: "School ID tidak ditemukan" }, { status: 400 });
    }

    const body = (await request.json()) as AdminDatabaseRequestBody;
    const { action, tab, data, id } = body;

    let path = "";
    if (tab === "Siswa") path = `gas/schools/${schoolId}/students`;
    else if (tab === "Guru/Wali Kelas") path = `gas/schools/${schoolId}/teachers`;
    else if (tab === "Petugas OSIS") path = `gas/schools/${schoolId}/staff`;
    else if (tab === "Kelas Paralel") path = `gas/schools/${schoolId}/classes`;

    if (!path) {
      return NextResponse.json({ success: false, message: "Tab tidak valid" }, { status: 400 });
    }

    const ref = adminDb.ref(path);

    const normalizedData = (() => {
      if (!data) return undefined;
      const baseData = { ...data } as Record<string, unknown>;

      if (tab === "Siswa") {
        const classLabel = String(baseData.className || baseData.kelas || baseData.class || "").trim();
        return {
          ...baseData,
          schoolId,
          npsn: schoolContext.npsn,
          schoolName: schoolContext.name || baseData.schoolName,
          class: classLabel || baseData.class,
          className: classLabel || baseData.className,
          username: String(baseData.username || baseData.name || "").trim(),
        };
      }

      if (tab === "Guru/Wali Kelas" || tab === "Petugas OSIS" || tab === "Kelas Paralel") {
        return {
          ...baseData,
          schoolId,
          npsn: schoolContext.npsn,
          schoolName: schoolContext.name || baseData.schoolName,
        };
      }

      return baseData;
    })();

    if (action === "create") {
      const newRef = ref.push();
      await newRef.set({
        ...normalizedData,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      return NextResponse.json({ success: true, message: "Data berhasil ditambahkan" });
    } 
    
    else if (action === "update") {
      if (!id) return NextResponse.json({ success: false, message: "ID tidak valid" }, { status: 400 });
      await ref.child(id).update({
        ...normalizedData,
        updatedAt: Date.now()
      });
      return NextResponse.json({ success: true, message: "Data berhasil diperbarui" });
    } 
    
    else if (action === "delete") {
      if (!id) return NextResponse.json({ success: false, message: "ID tidak valid" }, { status: 400 });
      await ref.child(id).remove();
      return NextResponse.json({ success: true, message: "Data berhasil dihapus" });
    }
    
    else if (action === "delete-all") {
      await ref.remove();
      return NextResponse.json({ success: true, message: "Semua data berhasil dihapus" });
    }

    return NextResponse.json({ success: false, message: "Aksi tidak dikenali" }, { status: 400 });

  } catch (error: unknown) {
    console.error("API Admin Database Error:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
