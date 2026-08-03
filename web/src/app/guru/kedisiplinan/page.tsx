"use client";

import { GuruPortalGate } from "@/components/guru/GuruPages";
import { GuruKedisiplinanView } from "@/components/guru/GuruFeatureViews";

export default function GuruKedisiplinanPage() {
  return (
    <GuruPortalGate>
      <GuruKedisiplinanView />
    </GuruPortalGate>
  );
}
