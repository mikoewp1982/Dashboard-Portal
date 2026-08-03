"use client";

import { GuruPortalGate } from "@/components/guru/GuruPages";
import { GuruSholatView } from "@/components/guru/GuruFeatureViews";

export default function GuruSholatPage() {
  return (
    <GuruPortalGate>
      <GuruSholatView />
    </GuruPortalGate>
  );
}
