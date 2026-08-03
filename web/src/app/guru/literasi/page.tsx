"use client";

import { GuruPortalGate } from "@/components/guru/GuruPages";
import { GuruLiterasiView } from "@/components/guru/GuruFeatureViews";

export default function GuruLiterasiPage() {
  return (
    <GuruPortalGate>
      <GuruLiterasiView />
    </GuruPortalGate>
  );
}
