import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

type StudentRow = {
  nisn?: string;
  username?: string;
  name?: string;
  nama?: string;
  nama_lengkap?: string;
  class?: string;
  kelas?: string;
  className?: string;
};

function clampStat(value: number) {
  return Math.min(100, Math.max(0, value));
}

function normalizeSchoolId(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function normalizeIdentity(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function getStudentName(row: StudentRow) {
  return String(row.name || row.nama || row.nama_lengkap || "Siswa").trim();
}

function getStudentClass(row: StudentRow) {
  return String(row.kelas || row.className || row.class || "Unknown").trim() || "Unknown";
}

function buildStudentAliasIndex(rawStudents: Record<string, StudentRow>) {
  const aliasSet = new Set<string>();
  const aliasMap = new Map<string, { studentName: string; className: string }>();

  for (const [studentKey, row] of Object.entries(rawStudents)) {
    const studentName = getStudentName(row);
    const className = getStudentClass(row);
    const aliases = [studentKey, row.nisn, row.username].map(normalizeIdentity).filter(Boolean);

    for (const alias of aliases) {
      aliasSet.add(alias);
      if (!aliasMap.has(alias)) {
        aliasMap.set(alias, { studentName, className });
      }
    }
  }

  return { aliasSet, aliasMap };
}

function resolveStudentMeta(
  petKey: string,
  rawPet: any,
  aliasMap: Map<string, { studentName: string; className: string }>
) {
  const aliases = [
    rawPet?.studentId,
    rawPet?.nisn,
    rawPet?.studentNisn,
    rawPet?.username,
    petKey,
  ]
    .map(normalizeIdentity)
    .filter(Boolean);

  for (const alias of aliases) {
    const match = aliasMap.get(alias);
    if (match) return match;
  }

  return null;
}

function matchesStudentAlias(petKey: string, rawPet: any, aliasSet: Set<string>) {
  return [rawPet?.studentId, rawPet?.nisn, rawPet?.studentNisn, rawPet?.username, petKey]
    .map(normalizeIdentity)
    .filter(Boolean)
    .some((alias) => aliasSet.has(alias));
}

function applyExpReward(rawPet: any, amount: number) {
  let level = Math.max(1, Number(rawPet?.level || 1));
  let experiencePoints = Math.max(0, Number(rawPet?.experiencePoints || 0)) + amount;
  let intelligence = clampStat(Number(rawPet?.intelligence || 0));

  while (experiencePoints >= level * 100) {
    experiencePoints -= level * 100;
    level += 1;
    intelligence = clampStat(intelligence + 2);
  }

  return { level, experiencePoints, intelligence };
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const { role, schoolId: userSchoolId } = decodedToken;

    if (role !== "super_admin" && role !== "admin") {
      return NextResponse.json({ error: "Permission Denied" }, { status: 403 });
    }

    const url = new URL(req.url);
    const schoolId = url.searchParams.get("schoolId");
    const targetSchoolId = normalizeSchoolId(role === "super_admin" ? schoolId : userSchoolId);
    if (!targetSchoolId) {
      return NextResponse.json({ error: "School ID is required" }, { status: 400 });
    }

    const studentsSnap = await adminDb.ref(`gas/schools/${targetSchoolId}/students`).get();
    const rawStudents = studentsSnap.exists() ? (studentsSnap.val() as Record<string, StudentRow>) : {};
    const { aliasSet, aliasMap } = buildStudentAliasIndex(rawStudents);

    const petsSnap = await adminDb.ref("virtual_pets").orderByChild("schoolId").equalTo(targetSchoolId).once("value");
    let rawPets = petsSnap.val() || {};

    // Fallback for legacy pet rows whose schoolId was not stored consistently.
    if (!Object.keys(rawPets).length && aliasSet.size > 0) {
      const legacyPetsSnap = await adminDb.ref("virtual_pets").get();
      const legacyEntries = Object.entries<any>(legacyPetsSnap.val() || {}).filter(([petKey, rawPet]) => {
        const petSchoolId = normalizeSchoolId(rawPet?.schoolId);
        if (petSchoolId && petSchoolId !== targetSchoolId) return false;
        return matchesStudentAlias(petKey, rawPet, aliasSet);
      });
      rawPets = Object.fromEntries(legacyEntries);
    }

    const pets = Object.entries<any>(rawPets).map(([petKey, rawPet]) => ({
      ...(resolveStudentMeta(petKey, rawPet, aliasMap) || {}),
      id: String(rawPet?.id || petKey || ""),
      studentId: String(rawPet?.studentId || "").trim(),
      schoolId: String(rawPet?.schoolId || "").trim().toLowerCase(),
      studentName: String(
        resolveStudentMeta(petKey, rawPet, aliasMap)?.studentName ||
          rawPet?.studentName ||
          rawPet?.petName ||
          "Unknown Student"
      ),
      petName: String(rawPet?.petName || "Buddy"),
      type: String(rawPet?.petType || "CAT"),
      status: String(rawPet?.status || "HAPPY"),
      manualReviveUntil: Number(rawPet?.manualReviveUntil || 0) || 0,
      stats: {
        level: Number(rawPet?.level ?? 1) || 1,
        exp: Number(rawPet?.experiencePoints ?? 0) || 0,
        maxExp: (Number(rawPet?.level ?? 1) || 1) * 100,
        health: Number(rawPet?.health ?? 100),
        energy: Number(rawPet?.energy ?? 100),
        happiness: Number(rawPet?.happiness ?? 100),
        intelligence: Number(rawPet?.intelligence ?? 0) || 0,
        social: Number(rawPet?.social ?? 0) || 0,
        creativity: 0,
        coins: Number(rawPet?.coins ?? 0) || 0,
        hunger: Number(rawPet?.hunger ?? 0) || 0,
      },
      lastSync: Number(rawPet?.updatedAt ?? 0) || 0,
      lastFed: Number(rawPet?.lastFed || 0) || 0,
      lastPlayed: Number(rawPet?.lastPlayed || 0) || 0,
      lastQuestReset: Number(rawPet?.lastQuestReset || 0) || 0,
      achievements: Array.isArray(rawPet?.achievements) ? rawPet.achievements : [],
    }));

    const eventsSnap = await adminDb.ref("platform_events").orderByChild("schoolId").equalTo(targetSchoolId).once("value");
    const rawEvents = eventsSnap.val() || {};
    const reviveHistory = Object.values<any>(rawEvents)
      .filter((item) => item?.type === "VIRTUAL_PET_REVIVE")
      .map((item) => {
        const metadata = item?.metadata || {};
        return {
          id: String(item?.id || ""),
          at: Number(item?.at || 0) || 0,
          schoolId: normalizeSchoolId(item?.schoolId),
          petId: String(item?.targetId || ""),
          actorEmail: String(item?.actorEmail || ""),
          actorRole: String(item?.actorRole || ""),
          health: metadata?.health !== undefined ? Number(metadata.health) : null,
          happiness: metadata?.happiness !== undefined ? Number(metadata.happiness) : null,
          energy: metadata?.energy !== undefined ? Number(metadata.energy) : null,
          hunger: metadata?.hunger !== undefined ? Number(metadata.hunger) : null,
        };
      })
      .sort((a, b) => b.at - a.at)
      .slice(0, 12);

    return NextResponse.json({
      success: true,
      pets,
      reviveHistory,
      studentCount: Object.keys(rawStudents).length,
    });
  } catch (error: any) {
    console.error("Virtual Pet API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const { role, schoolId: userSchoolId } = decodedToken;

    if (role !== "super_admin" && role !== "admin") {
      return NextResponse.json({ error: "Permission Denied" }, { status: 403 });
    }

    const body = await req.json();
    const { action, petId, petIds, rewardType, amount } = body;

    if (action === "revive") {
      if (!petId) return NextResponse.json({ error: "petId missing" }, { status: 400 });

      const petRef = adminDb.ref(`virtual_pets/${petId}`);
      const petSnap = await petRef.get();
      if (!petSnap.exists()) return NextResponse.json({ error: "Pet not found" }, { status: 404 });

      const revivedStats = {
        health: 50,
        happiness: 50,
        energy: 50,
        hunger: 50,
      };
      
      const now = Date.now();
      await petRef.update({
        status: "HAPPY",
        ...revivedStats,
        manualReviveUntil: now + 12 * 60 * 60 * 1000,
        updatedAt: now,
      });

      const eventRef = adminDb.ref('platform_events').push();
      await eventRef.set({
        id: eventRef.key,
        type: 'VIRTUAL_PET_REVIVE',
        schoolId: normalizeSchoolId(userSchoolId || petSnap.val().schoolId),
        targetId: petId,
        actorEmail: decodedToken.email || '',
        actorRole: role,
        at: now,
        metadata: revivedStats
      });

      return NextResponse.json({ success: true, message: "Pet revived successfully" });
    }

    if (action === "reset-level") {
      if (!petId) return NextResponse.json({ error: "petId missing" }, { status: 400 });

      const petRef = adminDb.ref(`virtual_pets/${petId}`);
      const petSnap = await petRef.get();
      if (!petSnap.exists()) return NextResponse.json({ error: "Pet not found" }, { status: 404 });

      await petRef.update({
        level: 1,
        experiencePoints: 0,
        updatedAt: Date.now(),
      });

      return NextResponse.json({ success: true, message: "Pet level reset successfully" });
    }

    if (action === "give-reward") {
      if (!petIds || !Array.isArray(petIds) || !rewardType || !amount) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
      }

      const updates: Record<string, any> = {};
      const now = Date.now();

      for (const id of petIds) {
        const petSnap = await adminDb.ref(`virtual_pets/${id}`).get();
        if (petSnap.exists()) {
          const pet = petSnap.val();
          if (rewardType === "coins") {
            updates[`virtual_pets/${id}/coins`] = Number(pet.coins || 0) + Number(amount);
          } else if (rewardType === "exp") {
            const next = applyExpReward(pet, Number(amount));
            updates[`virtual_pets/${id}/experiencePoints`] = next.experiencePoints;
            updates[`virtual_pets/${id}/level`] = next.level;
            updates[`virtual_pets/${id}/intelligence`] = next.intelligence;
          } else if (rewardType === "intelligence") {
            updates[`virtual_pets/${id}/intelligence`] = clampStat(Number(pet.intelligence || 0) + Number(amount));
          } else if (rewardType === "social") {
            updates[`virtual_pets/${id}/social`] = clampStat(Number(pet.social || 0) + Number(amount));
          }
          updates[`virtual_pets/${id}/updatedAt`] = now;
        }
      }

      if (Object.keys(updates).length > 0) {
        await adminDb.ref().update(updates);
      }

      return NextResponse.json({ success: true, message: "Rewards given successfully" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error: any) {
    console.error("Virtual Pet API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
