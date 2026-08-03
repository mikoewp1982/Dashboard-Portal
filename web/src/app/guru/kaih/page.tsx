"use client";

import { GuruPortalGate } from "@/components/guru/GuruPages";
import { GuruKaihView } from "@/components/guru/GuruFeatureViews";

export default function GuruKaihPage() {
  return (
    <GuruPortalGate>
      <GuruKaihView />
    </GuruPortalGate>
  );
}
