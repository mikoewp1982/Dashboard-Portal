"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { onValue, ref } from "firebase/database";
import { useAuthStore } from "@/store/useAuthStore";
import { useSupervisedStudents } from "@/hooks/guru/useSupervisedStudents";
import { rtdb } from "@/lib/firebase/client";
import { normalizeSchoolId } from "@/lib/gas/schoolId";
import { teacherFetch } from "@/lib/guru/teacherFetch";
import { ApkGlassCard, ApkPageFrame, ApkTabs } from "./GuruApkTheme";

type AduanReport = {
  id: string;
  category: string;
  incidentType: string;
  description: string;
  status: string;
  isAnonymous: boolean;
  reporterId: string;
  reporterName: string;
  victimId: string;
  victimName: string;
  perpetratorId: string;
  perpetratorName: string;
  createdAt: number;
};

const TABS = ["Lapor Bullying", "Lapor Peristiwa"];

const INCIDENT_LABELS: Record<string, string> = {
  VERBAL: "Verbal",
  PHYSICAL: "Fisik",
  CYBER: "Siber",
  SOCIAL: "Sosial",
  SEXUAL: "Seksual",
  BRAWL: "Tawuran",
  TAWURAN: "Tawuran",
  ACCIDENT: "Kecelakaan",
  KECELAKAAN: "Kecelakaan",
  LOST: "Kehilangan",
  KEHILANGAN: "Kehilangan",
  DAMAGE: "Kerusakan",
  KERUSAKAN_FASILITAS: "Kerusakan Fasilitas",
  OTHER: "Lainnya",
  LAINNYA: "Lainnya",
};

function formatReportTime(ms: number) {
  return new Date(ms).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isHandledStatus(status: string) {
  const s = status.trim().toUpperCase();
  return s === "RESOLVED" || s === "CLOSED";
}

function resolveName(
  identity: string,
  fallback: string,
  nameByIdentity: Map<string, string>
) {
  if (!identity) return fallback;
  return (
    nameByIdentity.get(identity) ||
    nameByIdentity.get(identity.toLowerCase()) ||
    fallback
  );
}

export function GuruAduanInteractive() {
  const user = useAuthStore((s) => s.user);
  const { students, loading: loadingStudents } = useSupervisedStudents(
    user?.schoolId,
    user?.class
  );
  const [tab, setTab] = useState(0);
  const [reports, setReports] = useState<AduanReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const identitySet = useMemo(() => {
    const set = new Set<string>();
    students.forEach((student) => {
      student.identities.forEach((id) => {
        const trimmed = id.trim();
        if (!trimmed) return;
        set.add(trimmed);
        set.add(trimmed.toLowerCase());
      });
    });
    return set;
  }, [students]);

  const nameByIdentity = useMemo(() => {
    const map = new Map<string, string>();
    students.forEach((student) => {
      student.identities.forEach((id) => {
        const trimmed = id.trim();
        if (!trimmed) return;
        if (!map.has(trimmed)) map.set(trimmed, student.name);
        const lower = trimmed.toLowerCase();
        if (!map.has(lower)) map.set(lower, student.name);
      });
    });
    return map;
  }, [students]);

  useEffect(() => {
    const schoolId = normalizeSchoolId(user?.schoolId);
    if (!schoolId) {
      setReports([]);
      setLoading(false);
      return;
    }
    if (loadingStudents) {
      setLoading(true);
      return;
    }

    const aduanRef = ref(rtdb, `gas/schools/${schoolId}/halo_spentgapa_reports`);
    const unsub = onValue(
      aduanRef,
      (snapshot) => {
        const next: AduanReport[] = [];
        if (snapshot.exists()) {
          snapshot.forEach((child) => {
            const row = (child.val() || {}) as Record<string, unknown>;
            const reporterId = String(row.reporterId || "").trim();
            const victimId = String(row.victimId || "").trim();
            const perpetratorId = String(row.perpetratorId || "").trim();
            const identities = [reporterId, victimId, perpetratorId].filter(Boolean);
            const relevant = identities.some(
              (id) => identitySet.has(id) || identitySet.has(id.toLowerCase())
            );
            if (!relevant) return;

            const isAnonymous = Boolean(row.isAnonymous);
            const resolvedReporter = resolveName(
              reporterId,
              String(row.reporterName || "").trim(),
              nameByIdentity
            );

            next.push({
              id: child.key || "",
              category: String(row.category || "BULLYING").toUpperCase(),
              incidentType: String(row.incidentType || "OTHER"),
              description: String(row.description || row.deskripsi || "Tidak ada deskripsi"),
              status: String(row.status || "PENDING"),
              isAnonymous,
              reporterId,
              reporterName: isAnonymous
                ? "Siswa Anonim"
                : resolvedReporter || "Siswa",
              victimId,
              victimName:
                String(row.victimName || "").trim() ||
                resolveName(victimId, "", nameByIdentity),
              perpetratorId,
              perpetratorName:
                String(row.perpetratorName || "").trim() ||
                resolveName(perpetratorId, "", nameByIdentity),
              createdAt: Number(row.createdAt || row.timestamp || 0),
            });
          });
        }
        next.sort((a, b) => b.createdAt - a.createdAt);
        setReports(next);
        setLoading(false);
      },
      () => {
        setReports([]);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [identitySet, loadingStudents, nameByIdentity, user?.schoolId]);

  const filtered = useMemo(() => {
    return reports.filter((report) => {
      if (tab === 0) {
        return report.category === "BULLYING" || !report.category;
      }
      return report.category === "INCIDENT";
    });
  }, [reports, tab]);

  async function updateStatus(reportId: string, status: "PENDING" | "RESOLVED") {
    setUpdatingId(reportId);
    setError("");
    try {
      await teacherFetch("/api/teacher/aduan", {
        method: "PUT",
        body: JSON.stringify({ reportId, status }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui status");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <ApkPageFrame
      title="Layanan Aduan"
      subtitle={`Wali Kelas ${user?.class || "..."}`}
      backHref="/guru"
    >
      <ApkTabs tabs={TABS} active={tab} onChange={setTab} variant="underline" />

      {error ? (
        <div className="mb-3 rounded-xl border border-rose-400/40 bg-rose-500/15 px-3 py-2 text-xs text-rose-100">
          {error}
        </div>
      ) : null}

      {loading || loadingStudents ? (
        <div className="flex items-center justify-center py-20 text-sm text-white/80">
          Memuat laporan...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Check className="h-12 w-12 text-[#4CAF50]" strokeWidth={2.5} />
          <p className="mt-4 text-sm text-white">Tidak ada laporan masuk</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((report) => {
            const handled = isHandledStatus(report.status);
            const busy = updatingId === report.id;
            return (
              <ApkGlassCard key={report.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold text-white">
                    {INCIDENT_LABELS[report.incidentType] || report.incidentType}
                  </span>
                  <span className="shrink-0 text-[11px] text-white/70">
                    {report.createdAt ? formatReportTime(report.createdAt) : "-"}
                  </span>
                </div>

                <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-white">
                  {report.description}
                </p>

                <div className="my-3 border-t border-white/20" />

                <div className="space-y-1 text-xs">
                  <DetailRow
                    label="Pelapor"
                    value={
                      report.isAnonymous
                        ? `${report.reporterName || "Siswa"} (Anonim)`
                        : report.reporterName || "-"
                    }
                  />
                  {report.victimName ? (
                    <DetailRow label="Korban" value={report.victimName} />
                  ) : null}
                  {report.perpetratorName ? (
                    <DetailRow label="Pelaku" value={report.perpetratorName} />
                  ) : null}
                </div>

                <p className="mt-4 text-[11px] font-bold text-white/75">
                  Status Penanganan:
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void updateStatus(report.id, "PENDING")}
                    className={`inline-flex items-center justify-center gap-1 rounded-xl px-3 py-2.5 text-xs font-bold transition disabled:opacity-50 ${
                      !handled
                        ? "bg-[#F44336] text-white"
                        : "border border-white/30 bg-transparent text-white/50"
                    }`}
                  >
                    {!handled ? <AlertTriangle className="h-3.5 w-3.5" /> : null}
                    Belum
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void updateStatus(report.id, "RESOLVED")}
                    className={`inline-flex items-center justify-center gap-1 rounded-xl px-3 py-2.5 text-xs font-bold transition disabled:opacity-50 ${
                      handled
                        ? "bg-[#4CAF50] text-white"
                        : "border border-white/30 bg-transparent text-white/50"
                    }`}
                  >
                    {handled ? <Check className="h-3.5 w-3.5" /> : null}
                    Sudah
                  </button>
                </div>
              </ApkGlassCard>
            );
          })}
        </div>
      )}
    </ApkPageFrame>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="w-[70px] shrink-0 font-bold text-white/70">{label}:</span>
      <span className="min-w-0 text-white">{value}</span>
    </div>
  );
}
