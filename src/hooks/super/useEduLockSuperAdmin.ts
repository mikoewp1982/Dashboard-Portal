import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";
import { rtdb as edulockDb, auth as edulockAuth } from "@/lib/firebase/client";

function normalize(value: unknown): string {
  return String(value || "").trim();
}

type SchoolRow = {
  schoolId: string;
  name: string;
  district: string;
  npsn: string;
  authEmail: string;
  adminEmail: string;
  backupEmail: string;
  isActive: boolean;
  adminAccessActive: boolean;
  updatedAt?: number | null;
  createdAt?: number | null;
  lastLoginAt?: number | null;
};

type RuntimeAdminRow = {
  uid: string;
  email: string;
  role: "super_admin" | "admin";
  isActive: boolean;
  schoolId: string;
  schoolName: string;
  lastLoginAt?: number | null;
  mustChangePassword: boolean;
};

export type SchoolAdminAccessRow = {
  schoolId: string;
  schoolName: string;
  npsn: string;
  loginIdentifier: string;
  resetEmail: string;
  schoolActive: boolean;
  accessActive: boolean;
  runtimeUid: string;
  runtimeEmail: string;
  runtimeLastLoginAt?: number | null;
  runtimeMustChangePassword: boolean;
};

function getSchoolAdminResetEmail(school: Pick<SchoolRow, "authEmail" | "adminEmail">): string {
  const authEmail = normalize(school.authEmail).toLowerCase();
  const adminEmail = normalize(school.adminEmail).toLowerCase();
  if (authEmail.includes("@") && !authEmail.endsWith("@edulock.local")) return authEmail;
  if (adminEmail.includes("@") && !adminEmail.endsWith("@edulock.local")) return adminEmail;
  return "";
}

function getSchoolAdminLoginIdentifier(school: Pick<SchoolRow, "npsn" | "authEmail" | "adminEmail">): string {
  const npsn = normalize(school.npsn);
  if (npsn) return npsn;
  return "";
}

function schoolHasAdminLoginConfig(school: Pick<SchoolRow, "npsn" | "authEmail" | "adminEmail">): boolean {
  return Boolean(normalize(school.npsn));
}

function getSchoolAdminSystemEmail(npsn: unknown): string {
  const normalized = normalize(npsn);
  return normalized ? `${normalized}@edulock.local` : "";
}

export function hasOperationalRuntime(row?: Pick<SchoolAdminAccessRow, "runtimeUid" | "runtimeLastLoginAt"> | null): boolean {
  if (!row) return false;
  if (normalize(row.runtimeUid)) return true;
  return Number(row.runtimeLastLoginAt || 0) > 0;
}

export function useEduLockSuperAdmin(role?: string) {
  const [runtimeAdmins, setRuntimeAdmins] = useState<RuntimeAdminRow[]>([]);
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeDeviceCounts, setActiveDeviceCounts] = useState<Record<string, number>>({});
  const [tenantRegistryStatus, setTenantRegistryStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (role !== "super_admin") return;

    const unsubAdmins = onValue(ref(edulockDb, "admin_profiles"), (snapshot) => {
      const data = snapshot.val();
      if (!data || typeof data !== "object") {
        setRuntimeAdmins([]);
        return;
      }
      const list: RuntimeAdminRow[] = Object.entries(data).map(([key, v]: any) => ({
        uid: String(v?.uid || key),
        email: String(v?.email || ""),
        role: String(v?.role || "admin") === "super_admin" ? "super_admin" : "admin",
        isActive: v?.isActive !== false,
        schoolId: v?.schoolId ? String(v.schoolId) : "",
        schoolName: v?.schoolName ? String(v.schoolName) : "",
        lastLoginAt: typeof v?.lastLoginAt === "number" ? v.lastLoginAt : null,
        mustChangePassword: v?.mustChangePassword === true,
      }));
      list.sort((a: any, b: any) => (Number(b.lastLoginAt || 0) || 0) - (Number(a.lastLoginAt || 0) || 0));
      setRuntimeAdmins(list);
    });

    const unsubSchools = onValue(ref(edulockDb, "schools"), (snapshot) => {
      const data = snapshot.val();
      if (!data || typeof data !== "object") {
        setSchools([]);
        return;
      }
      const list: SchoolRow[] = Object.entries(data).map(([key, v]: any) => ({
        schoolId: String(v?.schoolId || key),
        name: v?.name ? String(v.name) : "",
        district: v?.district ? String(v.district) : "",
        npsn: v?.npsn ? String(v.npsn) : "",
        authEmail: v?.authEmail ? String(v.authEmail) : "",
        adminEmail: v?.adminEmail ? String(v.adminEmail) : "",
        backupEmail: v?.backupEmail ? String(v.backupEmail) : "",
        isActive: v?.isActive !== false,
        adminAccessActive: v?.adminAccessActive !== false,
        updatedAt: typeof v?.updatedAt === "number" ? v.updatedAt : null,
        createdAt: typeof v?.createdAt === "number" ? v.createdAt : null,
          lastLoginAt: typeof v?.lastLoginAt === "number" ? v.lastLoginAt : null,
      }));
      list.sort((a: any, b: any) => String(a.name || a.schoolId).localeCompare(String(b.name || b.schoolId)));
      setSchools(list);
    });

    const unsubLogs = onValue(ref(edulockDb, "violations"), (snapshot) => {
      const data = snapshot.val();
      if (!data || typeof data !== "object") {
        setLogs([]);
        return;
      }
      const list = Object.entries(data).map(([key, v]: any) => ({
        id: String(key),
        nisn: v?.nisn ? String(v.nisn) : "",
        type: v?.type ? String(v.type) : "",
        description: v?.description ? String(v.description) : "",
        timestamp: typeof v?.timestamp === "number" ? v.timestamp : null,
      }));
      list.sort((a: any, b: any) => (Number(b.timestamp || 0) || 0) - (Number(a.timestamp || 0) || 0));
      setLogs(list.slice(0, 200));
    });

    const unsubSessions = onValue(ref(edulockDb, "active_devices"), (snapshot) => {
      const data = snapshot.val();
      if (!data || typeof data !== "object") {
        setSessions([]);
        setActiveDeviceCounts({});
        return;
      }

      const counts: Record<string, number> = {};
      const list = Object.entries(data).flatMap(([schoolId, schoolValue]: any) => {
        const devices = schoolValue && typeof schoolValue === "object" ? schoolValue : {};
        const rows = Object.entries(devices).map(([deviceId, value]: any) => ({
          id: String(deviceId),
          deviceId: String(deviceId),
          schoolId: String(schoolId),
          ...(value || {}),
        }));
        counts[String(schoolId).toLowerCase()] = rows.length;
        return rows;
      });

      list.sort(
        (a: any, b: any) =>
          (Number(b?.updatedAt || b?.lastUpdated || b?.lastSeen || 0) || 0) - (Number(a?.updatedAt || a?.lastUpdated || a?.lastSeen || 0) || 0)
      );
      setSessions(list);
      setActiveDeviceCounts(counts);
    });

    const unsubTenantRegistry = onValue(ref(edulockDb, "tenant_registry"), (snapshot) => {
      const data = snapshot.val();
      if (!data || typeof data !== "object") {
        setTenantRegistryStatus({});
        return;
      }

      const nextStatus: Record<string, boolean> = {};
      Object.entries(data).forEach(([schoolId, value]: any) => {
        const record = value && typeof value === "object" ? value : {};
        nextStatus[String(schoolId).toLowerCase()] =
          record.isActive !== false &&
          record.enabled !== false &&
          record.strictMode !== false &&
          record.strictModeEnabled !== false;
      });
      setTenantRegistryStatus(nextStatus);
    });

    return () => {
      unsubAdmins();
      unsubSchools();
      unsubLogs();
      unsubSessions();
      unsubTenantRegistry();
    };
  }, [role]);

  const latestRuntimeAdminBySchoolId = useMemo(() => {
    const map = new Map<string, RuntimeAdminRow>();
    for (const admin of runtimeAdmins) {
      if (admin.role !== "admin") continue;
      const sid = normalize(admin.schoolId).toLowerCase();
      if (!sid) continue;
      const existing = map.get(sid);
      const currentTs = Number(admin.lastLoginAt || 0) || 0;
      const previousTs = Number(existing?.lastLoginAt || 0) || 0;
      if (!existing || currentTs >= previousTs) {
        map.set(sid, admin);
      }
    }
    return map;
  }, [runtimeAdmins]);

  const latestRuntimeAdminByEmail = useMemo(() => {
    const map = new Map<string, RuntimeAdminRow>();
    for (const admin of runtimeAdmins) {
      if (admin.role !== "admin") continue;
      const email = normalize(admin.email).toLowerCase();
      if (!email) continue;
      const existing = map.get(email);
      const currentTs = Number(admin.lastLoginAt || 0) || 0;
      const previousTs = Number(existing?.lastLoginAt || 0) || 0;
      if (!existing || currentTs >= previousTs) {
        map.set(email, admin);
      }
    }
    return map;
  }, [runtimeAdmins]);

  const latestRuntimeAdminByNpsn = useMemo(() => {
    const map = new Map<string, RuntimeAdminRow>();
    for (const admin of runtimeAdmins) {
      if (admin.role !== "admin") continue;
      const npsnValue = normalize((admin as any).npsn).toLowerCase();
      if (!npsnValue) continue;
      const existing = map.get(npsnValue);
      const currentTs = Number(admin.lastLoginAt || 0) || 0;
      const previousTs = Number(existing?.lastLoginAt || 0) || 0;
      if (!existing || currentTs >= previousTs) {
        map.set(npsnValue, admin);
      }
    }
    return map;
  }, [runtimeAdmins]);

  const schoolAdminRows = useMemo<SchoolAdminAccessRow[]>(() => {
    return schools.map((school) => {
      const loginIdentifier = getSchoolAdminLoginIdentifier(school);
      const systemEmail = getSchoolAdminSystemEmail(school.npsn);
      const runtime =
        latestRuntimeAdminBySchoolId.get(normalize(school.schoolId).toLowerCase()) ||
        latestRuntimeAdminByEmail.get(normalize(systemEmail).toLowerCase()) ||
        latestRuntimeAdminByNpsn.get(normalize(school.npsn).toLowerCase());
      return {
        schoolId: school.schoolId,
        schoolName: school.name,
        npsn: school.npsn,
        loginIdentifier,
        resetEmail: getSchoolAdminResetEmail(school),
        schoolActive: school.isActive,
        accessActive: school.adminAccessActive !== false,
        runtimeUid: String(runtime?.uid || ""),
        runtimeEmail: String(runtime?.email || ""),
        runtimeLastLoginAt: runtime?.lastLoginAt ?? school.lastLoginAt ?? null,
        runtimeMustChangePassword: runtime?.mustChangePassword === true,
      };
    });
  }, [latestRuntimeAdminByEmail, latestRuntimeAdminByNpsn, latestRuntimeAdminBySchoolId, schools]);

  const stats = useMemo(() => {
    const tenantsTotal = schools.length;
    const tenantsEnabled = schools.filter((school) => school.isActive).length;
    const tenantsLive = schools.filter((school) => {
      const normalizedSchoolId = normalize(school.schoolId).toLowerCase();
      return (
        (activeDeviceCounts[normalizedSchoolId] || 0) > 0 ||
        tenantRegistryStatus[normalizedSchoolId] === true ||
        schoolAdminRows.some((row) => row.schoolId === school.schoolId && hasOperationalRuntime(row))
      );
    }).length;
    const adminReady = schoolAdminRows.filter((row) => schoolHasAdminLoginConfig({ npsn: row.npsn, authEmail: row.loginIdentifier, adminEmail: "" })).length;
    const adminOpen = schoolAdminRows.filter((row) => row.schoolActive && row.accessActive).length;
    return { tenantsTotal, tenantsEnabled, tenantsLive, adminReady, adminOpen };
  }, [activeDeviceCounts, schoolAdminRows, schools, tenantRegistryStatus]);

  return {
    schools,
    schoolAdminRows,
    stats,
    logs,
    sessions,
  };
}
