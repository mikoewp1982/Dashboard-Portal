"use client";

import { GuruPortalGate } from "@/components/guru/GuruPages";
import { GuruRekapView } from "@/components/guru/GuruFeatureViews";

export default function GuruRekapPage() {
  return (
    <GuruPortalGate>
      <GuruRekapView />
    </GuruPortalGate>
  );
}
