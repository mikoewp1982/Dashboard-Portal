/** Pet vital / death rules aligned with APK VirtualPet.isDeadByRule + TeacherStudentsScreen. */

export type PetVitalInput = {
  status?: string;
  health?: number;
  happiness?: number;
  energy?: number;
  hunger?: number;
  manualReviveUntil?: number;
};

export type PetStatusLabel = "-" | "Sehat" | "Sakit" | "Sekarat" | "Mati";

export type PetStatusInfo = {
  label: PetStatusLabel;
  /** Tailwind-ish inline background */
  background: string;
  textColor: string;
};

export function fullnessScore(hunger: number): number {
  return Math.max(0, Math.min(100, 100 - hunger));
}

export function lowestVitalScore(pet: PetVitalInput): number {
  const health = Number(pet.health ?? 100);
  const happiness = Number(pet.happiness ?? 100);
  const energy = Number(pet.energy ?? 100);
  const hunger = Number(pet.hunger ?? 0);
  return Math.min(
    fullnessScore(hunger),
    Math.max(0, Math.min(100, happiness)),
    Math.max(0, Math.min(100, energy)),
    Math.max(0, Math.min(100, health))
  );
}

export function isManualReviveGraceActive(
  pet: PetVitalInput,
  now = Date.now()
): boolean {
  return Number(pet.manualReviveUntil ?? 0) > now;
}

/**
 * Aligned with APK `VirtualPet.isDeadByRule` + `isPermanentlyDead` sticky logic.
 *
 * The APK writes status="DEAD" to RTDB when the pet dies. Because the web admin
 * only reads the RTDB snapshot (it does NOT recalculate vitals from realtime
 * attendance/prayer/habit sources), we honour the sticky "DEAD" status so the
 * web admin stays consistent with what the student sees on their phone.
 */
export function isDeadByRule(pet: PetVitalInput, now = Date.now()): boolean {
  if (isManualReviveGraceActive(pet, now)) return false;

  // Honour sticky DEAD status written by the APK
  if (typeof pet.status === "string" && pet.status.toUpperCase() === "DEAD") return true;

  const health = Number(pet.health ?? 100);
  return health <= 0 || lowestVitalScore(pet) <= 0;
}

/** Labels/colors from TeacherStudentsScreen PET column. */
export function resolvePetStatus(pet: PetVitalInput | null | undefined): PetStatusInfo {
  if (!pet) {
    return {
      label: "-",
      background: "rgba(51, 65, 85, 0.88)",
      textColor: "#ffffff",
    };
  }

  const dead = isDeadByRule(pet);
  const lowestVital = lowestVitalScore(pet);
  const isCritical = !dead && lowestVital < 30;
  const isSick = !dead && !isCritical && lowestVital < 60;

  if (dead) {
    return { label: "Mati", background: "rgba(185, 28, 28, 0.92)", textColor: "#ffffff" };
  }
  if (isCritical) {
    return { label: "Sekarat", background: "rgba(220, 38, 38, 0.92)", textColor: "#ffffff" };
  }
  if (isSick) {
    return { label: "Sakit", background: "rgba(180, 83, 9, 0.92)", textColor: "#ffffff" };
  }
  return { label: "Sehat", background: "rgba(21, 128, 61, 0.92)", textColor: "#ffffff" };
}
