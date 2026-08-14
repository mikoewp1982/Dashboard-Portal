"use client";

import { GuruPortalGate, GuruNotifikasiView } from "@/components/guru/GuruPages";
import { TeacherPagesErrorBoundary } from "@/components/guru/TeacherPagesErrorBoundary";

export default function GuruNotifikasiPage() {
  return (
    <GuruPortalGate>
      <TeacherPagesErrorBoundary featureLabel="Notifikasi">
        <GuruNotifikasiView />
      </TeacherPagesErrorBoundary>
    </GuruPortalGate>
  );
}
