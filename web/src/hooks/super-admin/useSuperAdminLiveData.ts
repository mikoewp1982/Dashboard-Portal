"use client";

import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";
import { rtdb } from "@/lib/firebase/client";
import { useAuthStore } from "@/store/useAuthStore";

export type SuperAdminSchoolRow = {
  schoolId: string;
  name: string;
  district: string;
  npsn: string;
  authEmail: string;
  adminEmail: string;
  backupEmail: string;
  paymentStatus: "PAID" | "UNPAID";
  lastPaidAt: number | null;
  dueAt: number | null;
  isActive: boolean;
  adminAccessActive: boolean;
  createdAt: number | null;
  updatedAt: number | null;
  lastLoginAt: number | null;
};

export type SuperAdminPrincipalRow = {
  username: string;
  name: string;
  schoolId: string;
  schoolName: string;
  npsn: string;
  isActive: boolean;
  lastLoginAt: number | null;
  deviceId: string;
};

export type SuperAdminSupportRequestRow = {
  id: string;
  title: string;
  status: string;
  schoolId: string;
  updatedAt: number | null;
};

export type SuperAdminSyncJobRow = {
  id: string;
  schoolId: string;
  jobType: string;
  status: string;
  createdAt: number | null;
  updatedAt: number | null;
  createdByUid: string;
};

export type SuperAdminSecurityLogRow = {
  id: string;
  timestamp: number | null;
  username: string;
  accountType: string;
  activity: string;
};

export type SuperAdminGlobalConfig = Record<string, unknown>;

export type SuperAdminStudentUsageRow = {
  schoolId: string;
  totalStudents: number;
  activatedStudents: number;
  unactivatedStudents: number;
  activeOperationalStudents: number;
  latestActivityAt: number | null;
};

type StudentRegistryAggregate = {
  totalStudents: number;
  studentKeys: string[];
  activatedStudentKeys: string[];
};

type ActiveDeviceAggregate = {
  activeStudentKeys: string[];
  latestActivityAt: number | null;
};

const ONLINE_WINDOW_MS = 15 * 60 * 1000;

function readString(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function readNumber(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function normalizeKey(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function resolveStudentKey(record: Record<string, unknown>, fallbackKey = "") {
  return normalizeKey(
    readString(record, "nisn", "studentId", "studentKey", "username", "id") ||
      fallbackKey
  );
}

function parseActiveStudentAggregateBySchool(rawValue: unknown) {
  if (!rawValue || typeof rawValue !== "object") {
    return {} as Record<string, ActiveDeviceAggregate>;
  }

  const now = Date.now();
  return Object.entries(rawValue as Record<string, unknown>).reduce<Record<string, ActiveDeviceAggregate>>(
    (acc, [schoolId, schoolValue]) => {
      if (!schoolValue || typeof schoolValue !== "object") {
        return acc;
      }

      const activeKeys = new Set<string>();
      let latestActivityAt: number | null = null;

      Object.values(schoolValue as Record<string, unknown>).forEach((deviceValue) => {
        const record =
          deviceValue && typeof deviceValue === "object"
            ? (deviceValue as Record<string, unknown>)
            : {};
        const lastSeenAt = readNumber(record, "lastSeenAt", "lastSeen", "updatedAt", "timestamp");
        const rawStatus = readString(record, "status", "state", "connectionStatus");
        const isOnline =
          rawStatus.toUpperCase() === "ONLINE" ||
          lastSeenAt === null ||
          now - lastSeenAt <= ONLINE_WINDOW_MS;
        if (!isOnline) {
          return;
        }

        const studentKey = resolveStudentKey(record);
        if (studentKey) {
          activeKeys.add(studentKey);
        }
        if (lastSeenAt !== null && (latestActivityAt === null || lastSeenAt > latestActivityAt)) {
          latestActivityAt = lastSeenAt;
        }
      });

      acc[normalizeKey(schoolId)] = {
        activeStudentKeys: Array.from(activeKeys),
        latestActivityAt,
      };
      return acc;
    },
    {}
  );
}

export function useSuperAdminLiveData() {
  const { user, loading: authLoading } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState<SuperAdminSchoolRow[]>([]);
  const [principals, setPrincipals] = useState<SuperAdminPrincipalRow[]>([]);
  const [supportRequests, setSupportRequests] = useState<SuperAdminSupportRequestRow[]>([]);
  const [syncJobs, setSyncJobs] = useState<SuperAdminSyncJobRow[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SuperAdminSecurityLogRow[]>([]);
  const [globalConfig, setGlobalConfig] = useState<SuperAdminGlobalConfig | null>(null);
  const [studentRegistryBySchool, setStudentRegistryBySchool] = useState<Record<string, StudentRegistryAggregate>>({});
  const [activeDeviceBySchool, setActiveDeviceBySchool] = useState<Record<string, ActiveDeviceAggregate>>({});
  const canAccess = user?.role === "super_admin";

  useEffect(() => {
    if (authLoading) return;
    if (!canAccess) return;

    const unsubSchools = onValue(ref(rtdb, "schools"), (snapshot) => {
      const data = snapshot.val();
      if (!data || typeof data !== "object") {
        setSchools([]);
        setLoading(false);
        return;
      }

      const rows = Object.entries(data).map(([key, value]) => {
        const record = value as Record<string, unknown>;
        const billing = (record.billing as Record<string, unknown> | undefined) || undefined;
        const paymentStatus = String(billing?.paymentStatus || record.paymentStatus || "UNPAID")
          .trim()
          .toUpperCase();
        return {
          schoolId: String(record.schoolId || key).trim().toLowerCase(),
          name: String(record.name || "").trim(),
          district: String(record.district || "").trim(),
          npsn: String(record.npsn || "").trim(),
          authEmail: String(record.authEmail || "").trim(),
          adminEmail: String(record.adminEmail || "").trim(),
          backupEmail: String(record.backupEmail || "").trim(),
          paymentStatus: paymentStatus === "PAID" ? "PAID" : "UNPAID",
          lastPaidAt:
            typeof billing?.lastPaidAt === "number"
              ? billing.lastPaidAt
              : typeof record.lastPaidAt === "number"
                ? record.lastPaidAt
                : null,
          dueAt:
            typeof billing?.dueAt === "number"
              ? billing.dueAt
              : typeof record.dueAt === "number"
                ? record.dueAt
                : null,
          isActive: record.isActive !== false,
          adminAccessActive: record.adminAccessActive !== false,
          createdAt: typeof record.createdAt === "number" ? record.createdAt : null,
          updatedAt: typeof record.updatedAt === "number" ? record.updatedAt : null,
          lastLoginAt: typeof record.lastLoginAt === "number" ? record.lastLoginAt : null,
        } satisfies SuperAdminSchoolRow;
      });

      rows.sort((a, b) => String(a.name || a.schoolId).localeCompare(String(b.name || b.schoolId)));
      setSchools(rows);
      setLoading(false);
    });

    const unsubPrincipals = onValue(ref(rtdb, "principals"), (snapshot) => {
      const data = snapshot.val();
      if (!data || typeof data !== "object") {
        setPrincipals([]);
        return;
      }

      const rows = Object.values(data).map((value) => {
        const record = value as Record<string, unknown>;
        return {
          username: String(record.username || "").trim(),
          name: String(record.name || "").trim(),
          schoolId: String(record.schoolId || "").trim().toLowerCase(),
          schoolName: String(record.schoolName || "").trim(),
          npsn: String(record.npsn || "").trim(),
          isActive: record.isActive !== false,
          lastLoginAt: typeof record.lastLoginAt === "number" ? record.lastLoginAt : null,
          deviceId: String(record.deviceId || "").trim(),
        } satisfies SuperAdminPrincipalRow;
      });

      rows.sort((a, b) => a.username.localeCompare(b.username));
      setPrincipals(rows);
    });

    const unsubSupport = onValue(ref(rtdb, "gas/support_requests"), (snapshot) => {
      const data = snapshot.val();
      if (!data || typeof data !== "object") {
        setSupportRequests([]);
        return;
      }

      const rows = Object.entries(data).map(([key, value]) => {
        const record = value as Record<string, unknown>;
        const updatedAt =
          typeof record.updatedAt === "number"
            ? record.updatedAt
            : typeof record.createdAt === "number"
              ? record.createdAt
              : null;

        return {
          id: key,
          title: String(record.title || record.subject || "Permintaan Bantuan").trim(),
          status: String(record.status || "OPEN").trim().toUpperCase(),
          schoolId: String(record.schoolId || "").trim().toLowerCase(),
          updatedAt,
        } satisfies SuperAdminSupportRequestRow;
      });

      rows.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      setSupportRequests(rows);
    });

    const unsubSyncJobs = onValue(ref(rtdb, "gas/sync_jobs"), (snapshot) => {
      const data = snapshot.val();
      if (!data || typeof data !== "object") {
        setSyncJobs([]);
        return;
      }

      const rows = Object.entries(data).map(([key, value]) => {
        const record = value as Record<string, unknown>;
        return {
          id: key,
          schoolId: String(record.schoolId || "").trim().toLowerCase(),
          jobType: String(record.jobType || record.name || record.type || "Sync Job").trim(),
          status: String(record.status || "QUEUED").trim().toUpperCase(),
          createdAt: typeof record.createdAt === "number" ? record.createdAt : null,
          updatedAt: typeof record.updatedAt === "number" ? record.updatedAt : null,
          createdByUid: String(record.createdByUid || "").trim(),
        } satisfies SuperAdminSyncJobRow;
      });

      rows.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
      setSyncJobs(rows);
    });

    const unsubSecurityLogs = onValue(ref(rtdb, "super/security_logs"), (snapshot) => {
      const data = snapshot.val();
      if (!data || typeof data !== "object") {
        setSecurityLogs([]);
        return;
      }

      const rows = Object.entries(data).map(([key, value]) => {
        const record = value as Record<string, unknown>;
        return {
          id: key,
          timestamp: typeof record.timestamp === "number" ? record.timestamp : null,
          username: String(record.username || "").trim(),
          accountType: String(record.accountType || "").trim(),
          activity: String(record.activity || "").trim(),
        } satisfies SuperAdminSecurityLogRow;
      });

      rows.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setSecurityLogs(rows);
    });

    const unsubGlobalConfig = onValue(ref(rtdb, "gas/global_config"), (snapshot) => {
      const data = snapshot.val();
      if (!data || typeof data !== "object") {
        setGlobalConfig(null);
        return;
      }

      setGlobalConfig(data as SuperAdminGlobalConfig);
    });

    const unsubStudents = onValue(ref(rtdb, "gas/schools"), (snapshot) => {
      const data = snapshot.val();
      if (!data || typeof data !== "object") {
        setStudentRegistryBySchool({});
        return;
      }

      const aggregates = Object.entries(data as Record<string, unknown>).reduce<Record<string, StudentRegistryAggregate>>(
        (acc, [schoolId, schoolValue]) => {
          const schoolRecord =
            schoolValue && typeof schoolValue === "object"
              ? (schoolValue as Record<string, unknown>)
              : {};
          const studentsValue =
            schoolRecord.students && typeof schoolRecord.students === "object"
              ? (schoolRecord.students as Record<string, unknown>)
              : {};

          const studentKeys = new Set<string>();
          const activatedStudentKeys = new Set<string>();

          Object.entries(studentsValue).forEach(([studentId, studentValue]) => {
            const record =
              studentValue && typeof studentValue === "object"
                ? (studentValue as Record<string, unknown>)
                : {};
            const name = readString(record, "name", "studentName");
            if (!name) {
              return;
            }

            const studentKey = resolveStudentKey(record, studentId);
            if (!studentKey) {
              return;
            }

            studentKeys.add(studentKey);
            if (Boolean(readString(record, "deviceId", "device"))) {
              activatedStudentKeys.add(studentKey);
            }
          });

          acc[normalizeKey(schoolId)] = {
            totalStudents: studentKeys.size,
            studentKeys: Array.from(studentKeys),
            activatedStudentKeys: Array.from(activatedStudentKeys),
          };
          return acc;
        },
        {}
      );

      setStudentRegistryBySchool(aggregates);
    });

    const unsubActiveDevices = onValue(ref(rtdb, "active_devices"), (snapshot) => {
      setActiveDeviceBySchool(parseActiveStudentAggregateBySchool(snapshot.val()));
    });

    return () => {
      unsubSchools();
      unsubPrincipals();
      unsubSupport();
      unsubSyncJobs();
      unsubSecurityLogs();
      unsubGlobalConfig();
      unsubStudents();
      unsubActiveDevices();
    };
  }, [authLoading, canAccess]);

  const visibleSchools = useMemo(() => (canAccess ? schools : []), [canAccess, schools]);
  const visiblePrincipals = useMemo(() => (canAccess ? principals : []), [canAccess, principals]);
  const visibleSupportRequests = useMemo(() => (canAccess ? supportRequests : []), [canAccess, supportRequests]);
  const visibleSyncJobs = useMemo(() => (canAccess ? syncJobs : []), [canAccess, syncJobs]);
  const visibleSecurityLogs = useMemo(() => (canAccess ? securityLogs : []), [canAccess, securityLogs]);
  const studentUsageRows = useMemo(() => {
    if (!canAccess) return [] as SuperAdminStudentUsageRow[];

    return visibleSchools.map((school) => {
      const studentRegistry = studentRegistryBySchool[school.schoolId];
      const activeDeviceSummary = activeDeviceBySchool[school.schoolId];
      const studentKeys = new Set(studentRegistry?.studentKeys || []);
      const activatedKeys = new Set<string>(studentRegistry?.activatedStudentKeys || []);
      const activeKeys = new Set<string>(activeDeviceSummary?.activeStudentKeys || []);

      activeKeys.forEach((key) => {
        if (studentKeys.size === 0 || studentKeys.has(key)) {
          activatedKeys.add(key);
        }
      });

      const totalStudents = studentRegistry?.totalStudents || 0;
      const activatedStudents =
        studentKeys.size > 0
          ? Array.from(activatedKeys).filter((key) => studentKeys.has(key)).length
          : activatedKeys.size;
      const activeOperationalStudents =
        studentKeys.size > 0
          ? Array.from(activeKeys).filter((key) => studentKeys.has(key)).length
          : activeKeys.size;

      return {
        schoolId: school.schoolId,
        totalStudents,
        activatedStudents: Math.min(totalStudents, activatedStudents),
        unactivatedStudents: Math.max(0, totalStudents - Math.min(totalStudents, activatedStudents)),
        activeOperationalStudents: Math.min(totalStudents, activeOperationalStudents),
        latestActivityAt: activeDeviceSummary?.latestActivityAt || null,
      } satisfies SuperAdminStudentUsageRow;
    });
  }, [activeDeviceBySchool, canAccess, studentRegistryBySchool, visibleSchools]);

  const metrics = useMemo(() => {
    const totalSchools = visibleSchools.length;
    const activeSchools = visibleSchools.filter((row) => row.isActive).length;
    const paidSchools = visibleSchools.filter((row) => row.paymentStatus === "PAID").length;
    const unpaidSchools = Math.max(0, totalSchools - paidSchools);
    const totalAdminSchools = visibleSchools.filter((row) => Boolean(row.authEmail || row.adminEmail || row.npsn)).length;
    const totalPrincipalAccounts = visiblePrincipals.filter((row) => row.isActive).length;
    const tenantIssues =
      visibleSchools.filter((row) => row.paymentStatus !== "PAID" || !row.isActive || !row.adminAccessActive || (!row.authEmail && !row.adminEmail && !row.npsn)).length +
      visiblePrincipals.filter((row) => !row.isActive).length;

    return {
      totalSchools,
      paidSchools,
      unpaidSchools,
      activeSchools,
      totalAdminSchools,
      totalPrincipalAccounts,
      tenantIssues,
      supportOpen: visibleSupportRequests.filter((row) => row.status === "OPEN").length,
      syncQueued: visibleSyncJobs.filter((row) => row.status === "QUEUED").length,
      syncFailed: visibleSyncJobs.filter((row) => row.status === "FAILED").length,
      auditLogs: visibleSecurityLogs.length,
    };
  }, [visiblePrincipals, visibleSchools, visibleSecurityLogs, visibleSupportRequests, visibleSyncJobs]);

  return {
    loading: authLoading ? true : canAccess ? loading : false,
    schools: visibleSchools,
    principals: visiblePrincipals,
    supportRequests: visibleSupportRequests,
    syncJobs: visibleSyncJobs,
    securityLogs: visibleSecurityLogs,
    globalConfig: canAccess ? globalConfig : null,
    studentUsageRows,
    metrics,
  };
}
