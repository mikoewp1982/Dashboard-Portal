import { useState, useCallback } from "react";
import { waitForClientUser } from "@/lib/firebase/waitForClientUser";

export type ReportStatus = "PENDING" | "INVESTIGATING" | "RESOLVED" | "CLOSED";
export type IncidentCategory = "BULLYING" | "INCIDENT";
export type IncidentType = "VERBAL" | "PHYSICAL" | "CYBER" | "SOCIAL" | "SEXUAL" | "TAWURAN" | "KECELAKAAN" | "KEHILANGAN" | "KERUSAKAN_FASILITAS" | "OTHER" | "LAINNYA";

export interface HaloSpentgapaReport {
  id: string;
  reporterId?: string;
  reporterName?: string;
  isAnonymous: boolean;
  victimId?: string;
  victimName?: string;
  perpetratorId?: string;
  perpetratorName?: string;
  incidentDate: number;
  incidentLocation: string;
  incidentType: IncidentType;
  category: IncidentCategory;
  description: string;
  status: ReportStatus;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  assignedTo?: string;
  resolutionNotes?: string;
  resolvedAt?: number;
  class?: string;
  className?: string;
  createdAt: number;
  updatedAt: number;
}

export const useGasHaloSpentgapa = (schoolId: string) => {
  const [reports, setReports] = useState<HaloSpentgapaReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    if (!schoolId) return;
    setIsLoading(true);
    setError(null);

    try {
      const currentUser = await waitForClientUser(5000);
      if (!currentUser) throw new Error("Sesi tidak aktif. Silakan login ulang.");
      
      const token = await currentUser.getIdToken();
      const res = await fetch(`/api/admin/halo-spentgapa?schoolId=${schoolId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Gagal mengambil laporan.");
      }

      const data = result.data || {};
      const parsedReports: HaloSpentgapaReport[] = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      })).sort((a, b) => b.createdAt - a.createdAt); // Newest first

      setReports(parsedReports);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Gagal memuat aduan.");
    } finally {
      setIsLoading(false);
    }
  }, [schoolId]);

  const updateReportStatus = useCallback(async (reportId: string, status: ReportStatus, resolutionNotes?: string) => {
    if (!schoolId) return false;
    
    try {
      const currentUser = await waitForClientUser(5000);
      if (!currentUser) throw new Error("Sesi tidak aktif. Silakan login ulang.");
      
      const token = await currentUser.getIdToken();
      const payload: any = { schoolId, reportId, status };
      if (resolutionNotes !== undefined) {
        payload.resolutionNotes = resolutionNotes;
      }

      const res = await fetch(`/api/admin/halo-spentgapa`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Gagal memperbarui status.");
      }

      const updatedReport = result.data as Partial<HaloSpentgapaReport> | undefined;
      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? {
              ...report,
              ...updatedReport,
              status,
              resolutionNotes: resolutionNotes !== undefined ? resolutionNotes : report.resolutionNotes,
              updatedAt: updatedReport?.updatedAt || Date.now(),
            }
          : report
      ));

      return true;
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Gagal memperbarui status.");
      return false;
    }
  }, [schoolId]);

  return {
    reports,
    isLoading,
    error,
    fetchReports,
    updateReportStatus
  };
};
