"use client";

import { GuruHomeView, GuruPortalGate } from "@/components/guru/GuruPortalApp";

export default function GuruPage() {
  return (
    <GuruPortalGate>
      <GuruHomeView />
    </GuruPortalGate>
  );
}
