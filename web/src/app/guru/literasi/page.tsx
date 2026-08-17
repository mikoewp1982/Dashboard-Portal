"use client";

import { GuruPortalGate } from "@/components/guru/GuruPages";
import { GuruLiterasiView } from "@/components/guru/GuruFeatureViews";
import { TeacherPagesErrorBoundary } from "@/components/guru/TeacherPagesErrorBoundary";

export default function GuruLiterasiPage() {
  return (
    <GuruPortalGate>
      <TeacherPagesErrorBoundary featureLabel="Literasi & Tugas">
        <GuruLiterasiView />
      </TeacherPagesErrorBoundary>
    </GuruPortalGate>
  );
}
