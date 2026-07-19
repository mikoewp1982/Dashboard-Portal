import { useCallback, useEffect, useState } from "react";
import { callAdminApi } from "@/lib/callAdminApi";
import { isSessionInactiveError } from "@/lib/firebase/waitForClientUser";

export interface EduLockActiveDevice {
  deviceId: string;
  studentId: string;
  nisn: string;
  username: string;
  name: string;
  lastSeenAt: number | null;
  battery: number | null;
  latitude: number | null;
  longitude: number | null;
  isOutOfZone: boolean;
  trustScore: number | null;
  rawStatus: string;
  isOnline: boolean;
  isEmergencyUnlock: boolean;
  isUninstallBypass: boolean;
  isPermissionActive: boolean;
}

export interface EduLockOverview {
  schoolId: string;
  schoolName: string;
  strictModeEnabled: boolean;
  tenantRegistered: boolean;
  boundStudentsCount: number;
  totalStudentsCount: number;
  activeDevicesCount: number;
  outsideZoneCount: number;
  latestHeartbeatAt: number | null;
  latestMirrorDate: string | null;
  latestMirrorCount: number;
  activeDevices: EduLockActiveDevice[];
}

const emptyOverview: EduLockOverview = {
  schoolId: "",
  schoolName: "",
  strictModeEnabled: false,
  tenantRegistered: false,
  boundStudentsCount: 0,
  totalStudentsCount: 0,
  activeDevicesCount: 0,
  outsideZoneCount: 0,
  latestHeartbeatAt: null,
  latestMirrorDate: null,
  latestMirrorCount: 0,
  activeDevices: [],
};

export function useEduLockOverview(schoolId: string | undefined) {
  const [overview, setOverview] = useState<EduLockOverview>(emptyOverview);
  const [loading, setLoading] = useState(true);

  const fetchOverview = useCallback(async () => {
    if (!schoolId) {
      return emptyOverview;
    }

    try {
      const result = await callAdminApi(`/api/admin/edulock?schoolId=${schoolId}`, "GET");
      return (result?.overview as EduLockOverview) || emptyOverview;
    } catch (error) {
      if (!isSessionInactiveError(error)) {
        console.error("Error fetching EduLock overview:", error);
      }
      return emptyOverview;
    }
  }, [schoolId]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      const nextOverview = await fetchOverview();
      if (!cancelled) {
        setOverview(nextOverview);
        setLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [fetchOverview]);

  const refresh = useCallback(async () => {
    setLoading(true);
    const nextOverview = await fetchOverview();
    setOverview(nextOverview);
    setLoading(false);
  }, [fetchOverview]);

  const resetStudentDevice = async (studentId: string) => {
    await callAdminApi("/api/admin/edulock", "POST", {
      action: "reset-student-device",
      studentId,
      schoolId,
    });
    await refresh();
  };

  return {
    overview,
    loading,
    refresh,
    resetStudentDevice,
  };
}
