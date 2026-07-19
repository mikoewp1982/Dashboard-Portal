import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

type SeedSchool = {
  id: string;
  schoolId: string;
  name: string;
  district: string;
  npsn: string;
  authEmail: string;
};

const SCHOOLS: Record<string, SeedSchool> = {
  "smpn_1_jatirejo": { id: "smpn_1_jatirejo", schoolId: "smpn_1_jatirejo", name: "SMPN 1 JATIREJO", district: "Jatirejo", npsn: "20502647", authEmail: "20502647@edulock.local" },
  "smpn_2_jatirejo": { id: "smpn_2_jatirejo", schoolId: "smpn_2_jatirejo", name: "SMPN 2 JATIREJO", district: "Jatirejo", npsn: "20502625", authEmail: "20502625@edulock.local" },
  "smpn_3_jatirejo": { id: "smpn_3_jatirejo", schoolId: "smpn_3_jatirejo", name: "SMPN SATU ATAP MANTING", district: "Jatirejo", npsn: "20555815", authEmail: "20555815@edulock.local" },
  "smpn_1_gondang": { id: "smpn_1_gondang", schoolId: "smpn_1_gondang", name: "SMPN 1 GONDANG", district: "Gondang", npsn: "20502646", authEmail: "20502646@edulock.local" },
  "smpn_2_gondang": { id: "smpn_2_gondang", schoolId: "smpn_2_gondang", name: "SMPN 2 GONDANG", district: "Gondang", npsn: "20502624", authEmail: "20502624@edulock.local" },
  "smpn_3_gondang": { id: "smpn_3_gondang", schoolId: "smpn_3_gondang", name: "SMPN 3 GONDANG", district: "Gondang", npsn: "20551769", authEmail: "20551769@edulock.local" },
  "smpn_1_pacet": { id: "smpn_1_pacet", schoolId: "smpn_1_pacet", name: "SMPN 1 PACET", district: "Pacet", npsn: "20502654", authEmail: "20502654@edulock.local" },
  "smpn_2_pacet": { id: "smpn_2_pacet", schoolId: "smpn_2_pacet", name: "SMPN 2 PACET", district: "Pacet", npsn: "20502631", authEmail: "20502631@edulock.local" },
  "smpn_3_pacet": { id: "smpn_3_pacet", schoolId: "smpn_3_pacet", name: "SMPN 3 PACET", district: "Pacet", npsn: "20555784", authEmail: "20555784@edulock.local" },
  "smpn_1_trawas": { id: "smpn_1_trawas", schoolId: "smpn_1_trawas", name: "SMPN 1 TRAWAS", district: "Trawas", npsn: "20502636", authEmail: "20502636@edulock.local" },
  "smpn_2_trawas": { id: "smpn_2_trawas", schoolId: "smpn_2_trawas", name: "SMPN 2 TRAWAS", district: "Trawas", npsn: "20502634", authEmail: "20502634@edulock.local" },
  "smpn_1_ngoro": { id: "smpn_1_ngoro", schoolId: "smpn_1_ngoro", name: "SMPN 1 NGORO", district: "Ngoro", npsn: "20502653", authEmail: "20502653@edulock.local" },
  "smpn_2_ngoro": { id: "smpn_2_ngoro", schoolId: "smpn_2_ngoro", name: "SMPN 2 NGORO", district: "Ngoro", npsn: "20502630", authEmail: "20502630@edulock.local" },
  "smpn_3_ngoro": { id: "smpn_3_ngoro", schoolId: "smpn_3_ngoro", name: "SMPN 3 SATU ATAP NGORO", district: "Ngoro", npsn: "69872302", authEmail: "69872302@edulock.local" },
  "smpn_1_pungging": { id: "smpn_1_pungging", schoolId: "smpn_1_pungging", name: "SMPN 1 PUNGGING", district: "Pungging", npsn: "20502655", authEmail: "20502655@edulock.local" },
  "smpn_2_pungging": { id: "smpn_2_pungging", schoolId: "smpn_2_pungging", name: "SMPN 2 PUNGGING", district: "Pungging", npsn: "20502632", authEmail: "20502632@edulock.local" },
  "smpn_1_kutorejo": { id: "smpn_1_kutorejo", schoolId: "smpn_1_kutorejo", name: "SMPN 1 KUTOREJO", district: "Kutorejo", npsn: "20502650", authEmail: "20502650@edulock.local" },
  "smpn_2_kutorejo": { id: "smpn_2_kutorejo", schoolId: "smpn_2_kutorejo", name: "SMPN 2 KUTOREJO", district: "Kutorejo", npsn: "20502627", authEmail: "20502627@edulock.local" },
  "smpn_3_kutorejo": { id: "smpn_3_kutorejo", schoolId: "smpn_3_kutorejo", name: "SMPN 3 KUTOREJO", district: "Kutorejo", npsn: "20502656", authEmail: "20502656@edulock.local" },
  "smpn_1_mojosari": { id: "smpn_1_mojosari", schoolId: "smpn_1_mojosari", name: "SMPN 1 MOJOSARI", district: "Mojosari", npsn: "20502652", authEmail: "20502652@edulock.local" },
  "smpn_2_mojosari": { id: "smpn_2_mojosari", schoolId: "smpn_2_mojosari", name: "SMPN 2 MOJOSARI", district: "Mojosari", npsn: "20502629", authEmail: "20502629@edulock.local" },
  "smpn_1_bangsal": { id: "smpn_1_bangsal", schoolId: "smpn_1_bangsal", name: "SMPN 1 BANGSAL", district: "Bangsal", npsn: "20502642", authEmail: "20502642@edulock.local" },
  "smpn_2_bangsal": { id: "smpn_2_bangsal", schoolId: "smpn_2_bangsal", name: "SMPN 2 BANGSAL", district: "Bangsal", npsn: "20502620", authEmail: "20502620@edulock.local" },
  "smpn_1_dlanggu": { id: "smpn_1_dlanggu", schoolId: "smpn_1_dlanggu", name: "SMPN 1 DLANGGU", district: "Dlanggu", npsn: "20502644", authEmail: "20502644@edulock.local" },
  "smpn_2_dlanggu": { id: "smpn_2_dlanggu", schoolId: "smpn_2_dlanggu", name: "SMPN 2 DLANGGU", district: "Dlanggu", npsn: "20502622", authEmail: "20502622@edulock.local" },
  "smpn_1_puri": { id: "smpn_1_puri", schoolId: "smpn_1_puri", name: "SMPN 1 PURI", district: "Puri", npsn: "20502638", authEmail: "20502638@edulock.local" },
  "smpn_2_puri": { id: "smpn_2_puri", schoolId: "smpn_2_puri", name: "SMPN 2 PURI", district: "Puri", npsn: "70002096", authEmail: "70002096@edulock.local" },
  "smpn_1_trowulan": { id: "smpn_1_trowulan", schoolId: "smpn_1_trowulan", name: "SMPN 1 TROWULAN", district: "Trowulan", npsn: "20502619", authEmail: "20502619@edulock.local" },
  "smpn_2_trowulan": { id: "smpn_2_trowulan", schoolId: "smpn_2_trowulan", name: "SMPN 2 TROWULAN", district: "Trowulan", npsn: "20502635", authEmail: "20502635@edulock.local" },
  "smpn_1_sooko": { id: "smpn_1_sooko", schoolId: "smpn_1_sooko", name: "SMPN 1 SOOKO", district: "Sooko", npsn: "20502637", authEmail: "20502637@edulock.local" },
  "smpn_2_sooko": { id: "smpn_2_sooko", schoolId: "smpn_2_sooko", name: "SMPN 2 SOOKO", district: "Sooko", npsn: "20502633", authEmail: "20502633@edulock.local" },
  "smpn_1_gedeg": { id: "smpn_1_gedeg", schoolId: "smpn_1_gedeg", name: "SMPN 1 GEDEG", district: "Gedeg", npsn: "20502645", authEmail: "20502645@edulock.local" },
  "smpn_2_gedeg": { id: "smpn_2_gedeg", schoolId: "smpn_2_gedeg", name: "SMPN 2 GEDEG", district: "Gedeg", npsn: "20502623", authEmail: "20502623@edulock.local" },
  "smpn_3_gedeg": { id: "smpn_3_gedeg", schoolId: "smpn_3_gedeg", name: "SMP GEDEG SWASTA", district: "Gedeg", npsn: "20502603", authEmail: "20502603@edulock.local" },
  "smpn_1_kemlagi": { id: "smpn_1_kemlagi", schoolId: "smpn_1_kemlagi", name: "SMPN 1 KEMLAGI", district: "Kemlagi", npsn: "20502649", authEmail: "20502649@edulock.local" },
  "smpn_2_kemlagi": { id: "smpn_2_kemlagi", schoolId: "smpn_2_kemlagi", name: "SMPN 2 KEMLAGI", district: "Kemlagi", npsn: "70011144", authEmail: "70011144@edulock.local" },
  "smpn_1_jetis": { id: "smpn_1_jetis", schoolId: "smpn_1_jetis", name: "SMPN 1 JETIS", district: "Jetis", npsn: "20502648", authEmail: "20502648@edulock.local" },
  "smpn_2_jetis": { id: "smpn_2_jetis", schoolId: "smpn_2_jetis", name: "SMPN 2 JETIS", district: "Jetis", npsn: "20502626", authEmail: "20502626@edulock.local" },
  "smpn_1_dawar_blandong": { id: "smpn_1_dawar_blandong", schoolId: "smpn_1_dawar_blandong", name: "SMPN 1 DAWARBLANDONG", district: "Dawar Blandong", npsn: "20502643", authEmail: "20502643@edulock.local" },
  "smpn_2_dawar_blandong": { id: "smpn_2_dawar_blandong", schoolId: "smpn_2_dawar_blandong", name: "SMPN 2 DAWARBLANDONG", district: "Dawar Blandong", npsn: "20502621", authEmail: "20502621@edulock.local" },
  "smpn_1_mojoanyar": { id: "smpn_1_mojoanyar", schoolId: "smpn_1_mojoanyar", name: "SMPN 1 MOJOANYAR", district: "Mojoanyar", npsn: "20502651", authEmail: "20502651@edulock.local" },
  "smpn_2_mojoanyar": { id: "smpn_2_mojoanyar", schoolId: "smpn_2_mojoanyar", name: "SMPN 2 MOJOANYAR", district: "Mojoanyar", npsn: "20502628", authEmail: "20502628@edulock.local" },
};

export async function GET() {
  try {
    const now = Date.now();
    // Fetch existing schools to avoid overwriting them
    const existingSnap = await adminDb.ref("schools").once("value");
    const existingSchools = existingSnap.val() || {};

    const payload: Record<string, any> = {};
    let addedCount = 0;

    for (const key in SCHOOLS) {
      if (!existingSchools[key]) {
        const s = SCHOOLS[key];
        payload[key] = {
          ...s,
          adminAccessActive: false,
          isActive: true,
          adminEmail: s.authEmail,
          backupEmail: "",
          createdAt: now,
          updatedAt: now,
        };
        addedCount++;
      }
    }

    if (addedCount > 0) {
      await adminDb.ref("schools").update(payload);
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil menginjeksi ${addedCount} sekolah baru (melewati yang sudah ada)`,
      count: addedCount,
    });
  } catch (error: unknown) {
    console.error("Seed error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Terjadi kesalahan seed schools",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
