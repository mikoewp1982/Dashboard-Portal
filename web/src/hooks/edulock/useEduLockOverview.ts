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
  hasFcmToken: boolean;
  lastMasterSwitchCommandId: string;
  lastMasterSwitchAppliedAt: number | null;
  lastMasterSwitchAppliedState: boolean | null;
  lastMasterSwitchAckSource: string;
  isAccessibilityEnabled: boolean | null;
  isDeviceAdminEnabled: boolean | null;
  isProtectionActive: boolean | null;
  protectionHealth: string;
  complianceStatus: string;
  lastProtectionCheckAt: number | null;
  appVersionCode: number | null;
}

export interface EduLockLatestMasterSwitchCommand {
  commandId: string;
  requestedState: boolean;
  requestedAt: number | null;
  targetedDeviceCount: number;
  targetedTokenCount: number;
  fcmSuccessCount: number;
  fcmFailureCount: number;
  ackedDeviceCount: number;
  pendingDeviceCount: number;
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
  latestMasterSwitchCommand: EduLockLatestMasterSwitchCommand | null;
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
  latestMasterSwitchCommand: null,
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

    const run = async (showLoading: boolean) => {
      if (showLoading) setLoading(true);
      const nextOverview = await fetchOverview();
      if (!cancelled) {
        setOverview(nextOverview);
        if (showLoading) setLoading(false);
      }
    };

    void run(true);
    // Status proteksi harus cepat berubah merah tanpa menunggu refresh manual.
    const timer = window.setInterval(() => {
      void run(false);
    }, 15_000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
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

  const toggleUninstall = async (studentId: string, nisn: string, isAuthorized: boolean) => {
    await callAdminApi("/api/admin/edulock", "POST", {
      action: "toggle-uninstall",
      schoolId,
      studentId,
      nisn,
      isAuthorized,
    });
    await refresh();
  };

  const toggleUninstallMass = async (students: { studentId: string; nisn: string }[], isAuthorized: boolean) => {
    await callAdminApi("/api/admin/edulock", "POST", {
      action: "toggle-uninstall-mass",
      schoolId,
      students,
      isAuthorized,
    });
    await refresh();
  };

  return {
    overview,
    loading,
    refresh,
    resetStudentDevice,
    toggleUninstall,
    toggleUninstallMass,
  };
}
