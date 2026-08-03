"use client";

import { GuruPortalGate, GuruNotifikasiView } from "@/components/guru/GuruPages";

export default function GuruNotifikasiPage() {
  return (
    <GuruPortalGate>
      <GuruNotifikasiView />
    </GuruPortalGate>
  );
}
