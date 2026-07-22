import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { resolveCanonicalSchoolContext } from "@/lib/admin/resolveCanonicalSchoolContext";

type AdminDatabaseRequestBody = {
  action?: "create" | "update" | "delete" | "delete-all" | "import-excel";
  tab?: string;
  data?: Record<string, unknown>;
  bulkData?: Record<string, unknown>[];
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

    const normalizeItem = (baseData: Record<string, unknown> | undefined) => {
      if (!baseData) return undefined;
      const d = { ...baseData } as Record<string, unknown>;

      if (tab === "Siswa") {
        const classLabel = String(d.className || d.kelas || d.class || "").trim();
        return {
          ...d,
          schoolId,
          npsn: schoolContext.npsn,
          schoolName: schoolContext.name || d.schoolName,
          class: classLabel || d.class,
          className: classLabel || d.className,
          username: String(d.username || d.name || "").trim(),
        };
      }

      if (tab === "Guru/Wali Kelas" || tab === "Petugas OSIS" || tab === "Kelas Paralel") {
        return {
          ...d,
          schoolId,
          npsn: schoolContext.npsn,
          schoolName: schoolContext.name || d.schoolName,
        };
      }

      return d;
    };

    if (action === "create") {
      const normalizedData = normalizeItem(data);
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
      const normalizedData = normalizeItem(data);
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

    else if (action === "import-excel") {
      if (!body.bulkData || !Array.isArray(body.bulkData)) {
        return NextResponse.json({ success: false, message: "Data excel tidak valid" }, { status: 400 });
      }
      const updates: Record<string, unknown> = {};
      const now = Date.now();
      body.bulkData.forEach((item) => {
        const normalizedItem = normalizeItem(item);
        if (normalizedItem) {
          const newRef = ref.push();
          if (newRef.key) {
            updates[newRef.key] = {
              ...normalizedItem,
              createdAt: now,
              updatedAt: now,
            };
          }
        }
      });
      if (Object.keys(updates).length > 0) {
        await ref.update(updates);
      }
      return NextResponse.json({ success: true, message: `Berhasil mengimpor ${Object.keys(updates).length} data` });
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
