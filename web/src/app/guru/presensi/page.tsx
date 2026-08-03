"use client";

import { GuruPortalGate } from "@/components/guru/GuruPages";
import { GuruPresensiView } from "@/components/guru/GuruFeatureViews";

export default function GuruPresensiPage() {
  return (
    <GuruPortalGate>
      <GuruPresensiView />
    </GuruPortalGate>
  );
}
