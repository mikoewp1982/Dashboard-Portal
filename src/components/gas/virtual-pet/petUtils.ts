"use client";

import { PetData } from "@/hooks/gas/virtual-pet/useGasVirtualPet";

export function analyzePetRisk(pet: PetData) {
  const health = Number(pet.stats.health || 0);
  const happiness = Number(pet.stats.happiness || 0);
  const energy = Number(pet.stats.energy || 0);
  const hunger = Number(pet.stats.hunger || 0);
  const fullness = Math.max(0, 100 - hunger);
  const lowestVital = Math.min(health, happiness, energy, fullness);
  const normalizedStatus = String(pet.status || "").trim().toUpperCase();

  const avgStatus = (health + happiness + energy + fullness) / 4;
  const isReviveGraceActive = Number(pet.manualReviveUntil || 0) > Date.now();
  const isDead = !isReviveGraceActive && (
    normalizedStatus === "DEAD" ||
    health <= 0 ||
    lowestVital <= 0
  );

  const isSick = health < 30 && !isDead;
  const isSad = happiness < 30 && !isDead;
  const isStarving = hunger > 70 && !isDead;
  const isLowStatus = avgStatus < 40 && !isDead;

  const problems: string[] = [];
  if (!isDead) {
    if (isSick) problems.push(`Kesehatan rendah (${health}%)`);
    else if (isSad) problems.push(`Kebahagiaan rendah (${happiness}%)`);
    if (isStarving) problems.push(`Kelaparan (${hunger}%)`);
    if (isLowStatus) problems.push(`Rata-rata status buruk (${avgStatus.toFixed(0)}%)`);
  }

  return {
    avgStatus,
    isDead,
    isSick,
    isSad,
    isStarving,
    isLowStatus,
    isReviveGraceActive,
    problems,
  };
}

export function derivePetCondition(pet: PetData, risk: ReturnType<typeof analyzePetRisk>) {
  const health = Number(pet.stats.health || 0);
  const happiness = Number(pet.stats.happiness || 0);
  const energy = Number(pet.stats.energy || 0);
  const hunger = Number(pet.stats.hunger || 0);
  const fullness = Math.max(0, 100 - hunger);
  const lowestVital = Math.min(health, happiness, energy, fullness);

  if (risk.isDead) {
    return {
      label: "Mati",
      className: "bg-black text-white",
      sublabel: risk.isReviveGraceActive ? "Grace aktif" : "",
    };
  }

  if (lowestVital <= 10 || risk.avgStatus < 25) {
    return {
      label: "Sekarat",
      className: "bg-red-600 text-white",
      sublabel: risk.isReviveGraceActive ? "Grace aktif" : "",
    };
  }

  if (risk.isSick || risk.isSad || risk.isStarving || risk.isLowStatus || lowestVital <= 30) {
    return {
      label: "Sakit",
      className: "bg-orange-500 text-white",
      sublabel: risk.isReviveGraceActive ? "Grace aktif" : "",
    };
  }

  return {
    label: "Sehat",
    className: "bg-green-600 text-white",
    sublabel: risk.isReviveGraceActive ? "Grace aktif" : "",
  };
}
