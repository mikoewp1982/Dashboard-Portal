import { useEffect, useMemo, useState } from "react";
import { onValue, ref, query, limitToLast } from "firebase/database";
import { rtdb as db, auth } from "@/lib/firebase/client";
import { callSuperAdminApi } from "@/lib/callSuperAdminApi";
import { SEED_RAW } from "@/app/super-admin/database/seedData";

export type SuperSchoolRow = {
  schoolId: string;
  name: string;
  district: string;
  npsn: string;
  authEmail: string;
  adminEmail: string;
  backupEmail: string;
  isActive: boolean;
  adminAccessActive: boolean;
  createdAt?: number | null;
  updatedAt?: number | null;
  lastLoginAt?: number | null;
};

export type PrincipalRow = {
  username: string;
  name: string;
  schoolId: string;
  schoolName: string;
  npsn?: string;
  isActive: boolean;
  lastLoginAt?: number | null;
  deviceId?: string;
};

export type SecurityLog = {
  id: string;
  timestamp: number | null;
  username: string;
  accountType: string;
  activity: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  return fallback;
}

export function useSuperAdminDatabase(isAuthLoading: boolean) {
  const [superSchools, setSuperSchools] = useState<SuperSchoolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [superSaving, setSuperSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "" | "success" | "error"; text: string }>({ type: "", text: "" });

  const [superSchoolForm, setSuperSchoolForm] = useState({
    schoolId: "",
    name: "",
    district: "",
    npsn: "",
    authEmail: "",
    adminEmail: "",
    backupEmail: "",
    isActive: true,
  });

  const [superPrincipals, setSuperPrincipals] = useState<PrincipalRow[]>([]);
  const [principalQuery, setPrincipalQuery] = useState("");
  const [principalEditing, setPrincipalEditing] = useState("");
  const [principalSaving, setPrincipalSaving] = useState(false);
  const [principalForm, setPrincipalForm] = useState({
    username: "",
    name: "",
    schoolId: "",
    schoolName: "",
    password: "",
    isActive: true,
  });

  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);

  const [adminSchoolForm, setAdminSchoolForm] = useState({
    schoolId: "",
    schoolName: "",
    npsn: "",
    authEmail: "",
    adminEmail: "",
    backupEmail: "",
    schoolActive: true,
    adminAccessActive: true,
  });

  const superSchoolAdmins = useMemo(() => {
    return superSchools.map(s => ({
      schoolId: s.schoolId,
      schoolName: s.name,
      npsn: s.npsn,
      loginIdentifier: s.npsn || s.authEmail || s.adminEmail || "",
      runtimeEmail: s.authEmail || s.adminEmail || (s.npsn ? `${s.npsn}@edulock.local` : ""),
      schoolActive: s.isActive,
      accessActive: s.adminAccessActive,
      runtimeLastLoginAt: s.lastLoginAt || null,
      runtimeMustChangePassword: false
    }));
  }, [superSchools]);

  const openAdminSchoolEditor = (school: SuperSchoolRow) => {
    setAdminSchoolForm({
      schoolId: school.schoolId,
      schoolName: school.name,
      npsn: school.npsn,
      authEmail: school.authEmail,
      adminEmail: school.adminEmail,
      backupEmail: school.backupEmail,
      schoolActive: school.isActive,
      adminAccessActive: school.adminAccessActive,
    });
  };

  const saveAdminSchoolRegistry = async () => {
    if (!adminSchoolForm.schoolId) {
      setStatusMsg({ type: "error", text: "Pilih sekolah terlebih dahulu." });
      return;
    }
    setSuperSaving(true);
    setStatusMsg({ type: "", text: "" });
    try {
      await callSuperAdminApi("POST", {
        action: "save-school",
        school: {
          schoolId: adminSchoolForm.schoolId,
          name: adminSchoolForm.schoolName,
          npsn: adminSchoolForm.npsn,
          authEmail: adminSchoolForm.authEmail,
          adminEmail: adminSchoolForm.adminEmail,
          backupEmail: adminSchoolForm.backupEmail,
          isActive: adminSchoolForm.schoolActive,
          adminAccessActive: adminSchoolForm.adminAccessActive,
          district: superSchools.find((school) => school.schoolId === adminSchoolForm.schoolId)?.district || "",
        },
      });
      setStatusMsg({ type: "success", text: "Login Admin berhasil disimpan." });
    } catch (error: unknown) {
      setStatusMsg({ type: "error", text: getErrorMessage(error, "Gagal menyimpan login admin.") });
    } finally {
      setSuperSaving(false);
    }
  };

  useEffect(() => {
    if (isAuthLoading) return;
    const unsub = onValue(
      ref(db, "schools"),
      (snapshot) => {
        const data = snapshot.val();
        if (!data || typeof data !== "object") {
          setSuperSchools([]);
          setLoading(false);
          return;
        }

        const list: SuperSchoolRow[] = Object.entries(data).map(([key, value]) => {
          const record = value as Record<string, unknown>;
          return {
            schoolId: String(record.schoolId || key).trim().toLowerCase(),
            name: record.name ? String(record.name).trim() : "",
            district: record.district ? String(record.district).trim() : "",
            npsn: record.npsn ? String(record.npsn).trim() : "",
            authEmail: record.authEmail ? String(record.authEmail).trim() : "",
            adminEmail: record.adminEmail ? String(record.adminEmail).trim() : "",
            backupEmail: record.backupEmail ? String(record.backupEmail).trim() : "",
            isActive: record.isActive !== false,
            adminAccessActive: record.adminAccessActive !== false,
            createdAt: typeof record.createdAt === "number" ? record.createdAt : null,
            updatedAt: typeof record.updatedAt === "number" ? record.updatedAt : null,
            lastLoginAt: typeof record.lastLoginAt === "number" ? record.lastLoginAt : null,
          };
        });
        list.sort((a, b) => String(a.name || a.schoolId).localeCompare(String(b.name || b.schoolId)));
        setSuperSchools(list);
        setLoading(false);
      },
      (error) => {
        console.error("RTDB error schools:", error);
        setLoading(false);
      }
    );

    const unsubPrincipals = onValue(
      ref(db, "principals"),
      (snapshot) => {
        const data = snapshot.val();
        if (!data || typeof data !== "object") {
          setSuperPrincipals([]);
          return;
        }
        const list: PrincipalRow[] = Object.values(data).map((value) => {
          const record = value as Record<string, unknown>;
          return {
            username: String(record.username || ""),
            name: String(record.name || ""),
            schoolId: String(record.schoolId || ""),
            schoolName: String(record.schoolName || ""),
            npsn: String(record.npsn || ""),
            isActive: record.isActive !== false,
            lastLoginAt: typeof record.lastLoginAt === "number" ? record.lastLoginAt : null,
            deviceId: String(record.deviceId || ""),
          };
        });
        list.sort((a, b) => a.username.localeCompare(b.username));
        setSuperPrincipals(list);
      },
      (error) => {
        console.error("RTDB error principals:", error);
      }
    );

    const unsubSecurityLogs = onValue(
      query(ref(db, "super/security_logs"), limitToLast(200)),
      (snapshot) => {
        const data = snapshot.val();
        if (!data || typeof data !== "object") {
          setSecurityLogs([]);
          return;
        }
        const list: SecurityLog[] = Object.entries(data).map(([key, value]) => {
          const record = value as Record<string, unknown>;
          return {
            id: key,
            timestamp: typeof record.timestamp === "number" ? record.timestamp : null,
            username: String(record.username || ""),
            accountType: String(record.accountType || ""),
            activity: String(record.activity || ""),
          };
        });
        list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setSecurityLogs(list);
      }
    );

    return () => {
      unsub();
      unsubPrincipals();
      unsubSecurityLogs();
    };
  }, [isAuthLoading]);

  const filteredSuperPrincipals = useMemo(() => {
    if (!principalQuery) return superPrincipals;
    const q = principalQuery.toLowerCase();
    return superPrincipals.filter(p => p.username.toLowerCase().includes(q) || p.name.toLowerCase().includes(q) || p.schoolName.toLowerCase().includes(q));
  }, [superPrincipals, principalQuery]);

  const formatDateTime = (ts?: number | null) => {
    if (!ts) return "-";
    return new Date(ts).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const upsertPrincipalAccount = async () => {
    if (!principalForm.username || !principalForm.schoolId) {
      setStatusMsg({ type: "error", text: "Username dan School ID wajib diisi." });
      return;
    }
    if (!principalEditing && !principalForm.password) {
      setStatusMsg({ type: "error", text: "Password wajib diisi untuk akun baru." });
      return;
    }

    setPrincipalSaving(true);
    setStatusMsg({ type: "", text: "" });
    try {
      const school = superSchools.find(s => s.schoolId === principalForm.schoolId);
      await callSuperAdminApi("POST", {
        action: "save-principal",
        principal: {
          ...principalForm,
          npsn: school?.npsn || ""
        }
      });
      setStatusMsg({ type: "success", text: "Akun kepala sekolah berhasil disimpan." });
      setPrincipalEditing("");
      setPrincipalForm({ username: "", name: "", schoolId: "", schoolName: "", password: "", isActive: true });
    } catch (error: unknown) {
      setStatusMsg({ type: "error", text: getErrorMessage(error, "Gagal menyimpan akun.") });
    } finally {
      setPrincipalSaving(false);
    }
  };

  const startEditPrincipal = (p: PrincipalRow) => {
    setPrincipalEditing(p.username);
    setPrincipalForm({
      username: p.username,
      name: p.name,
      schoolId: p.schoolId,
      schoolName: p.schoolName,
      password: "",
      isActive: p.isActive
    });
  };

  const resetPrincipalDevice = async (username: string) => {
    if (!confirm(`Yakin ingin reset device untuk akun ${username}?`)) return;
    setStatusMsg({ type: "", text: "" });
    try {
      await callSuperAdminApi("POST", {
        action: "reset-principal-device",
        username
      });
      setStatusMsg({ type: "success", text: `Device untuk akun ${username} berhasil di-reset.` });
    } catch (error: unknown) {
      setStatusMsg({ type: "error", text: getErrorMessage(error, "Gagal reset device.") });
    }
  };

  const resetPrincipalPassword = async (username: string) => {
    if (!confirm(`Reset password akun kepala sekolah ${username} ke default admin123?`)) return;
    setStatusMsg({ type: "", text: "" });
    try {
      await callSuperAdminApi("POST", {
        action: "reset-principal-password",
        username,
      });
      setStatusMsg({
        type: "success",
        text: `Password akun kepala sekolah ${username} berhasil direset ke admin123.`,
      });
    } catch (error: unknown) {
      setStatusMsg({ type: "error", text: getErrorMessage(error, "Gagal reset password kepala sekolah.") });
    }
  };

  const schoolsWithoutAdmin = useMemo(() => {
    return superSchools.filter(s => s.isActive && !s.authEmail && !s.adminEmail);
  }, [superSchools]);

  const schoolsWithoutPrincipal = useMemo(() => {
    return superSchools.filter(s => s.isActive && !superPrincipals.find(p => p.schoolId === s.schoolId));
  }, [superSchools, superPrincipals]);

  const superStats = useMemo(() => {
    const tenantsTotal = superSchools.length;
    const tenantsActive = superSchools.filter((s) => s.isActive).length;
    const adminsActive = superSchools.filter((s) => s.adminAccessActive && (s.authEmail || s.adminEmail)).length;
    const tenantsMissingAdmin = Math.max(0, tenantsTotal - adminsActive);
    const principalsActive = superPrincipals.filter(p => p.isActive).length; 
    const schoolsMissingPrincipalCount = tenantsActive - principalsActive;
    const tenantsLive = superSchools.filter((s) => s.isActive && s.adminAccessActive && !!s.lastLoginAt).length;
    const securityLogsCount = securityLogs.length;
    
    return {
      tenantsTotal,
      tenantsActive,
      adminsActive,
      tenantsMissingAdmin,
      principalsActive,
      schoolsMissingPrincipalCount,
      tenantsLive,
      securityLogsCount,
    };
  }, [superSchools, superPrincipals, securityLogs]);

  const saveSuperSchool = async () => {
    if (!superSchoolForm.schoolId) {
      setStatusMsg({ type: "error", text: "School ID harus diisi." });
      return;
    }
    setSuperSaving(true);
    setStatusMsg({ type: "", text: "" });
    try {
      await callSuperAdminApi("POST", {
        action: "save-school",
        school: superSchoolForm,
      });
      setStatusMsg({ type: "success", text: "Data sekolah berhasil disimpan." });
      setSuperSchoolForm({
        schoolId: "",
        name: "",
        district: "",
        npsn: "",
        authEmail: "",
        adminEmail: "",
        backupEmail: "",
        isActive: true,
      });
    } catch (error: unknown) {
      setStatusMsg({ type: "error", text: getErrorMessage(error, "Gagal menyimpan sekolah.") });
    } finally {
      setSuperSaving(false);
    }
  };

  const handleInject42Schools = async () => {
    if (!window.confirm("Apakah Anda yakin ingin menginjeksi 42 sekolah default dari Satu Pintu?")) return;
    setSuperSaving(true);
    setStatusMsg({ type: "", text: "Menyiapkan injeksi..." });
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Belum login. Sesi tidak aktif.");
      const idToken = await currentUser.getIdToken();

      const seedObj = JSON.parse(SEED_RAW);
      const schools = seedObj.schools;
      const schoolKeys = Object.keys(schools);
      let count = 0;
      
      const now = Date.now();
      for (const key of schoolKeys) {
         const school = schools[key];
         const payload = {
               ...school,
               adminAccessActive: true,
               isActive: true,
               adminEmail: school.authEmail,
               backupEmail: "",
               createdAt: now,
               updatedAt: now,
         };
         
         const res = await fetch(`https://dashboard-portal-179f7-default-rtdb.asia-southeast1.firebasedatabase.app/schools/${key}.json?auth=${idToken}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
         });
         
         if (!res.ok) {
            const err = await res.text();
            throw new Error(`Error ${res.status}: ${err}`);
         }
         
         count++;
         setStatusMsg({ type: "", text: `Menginjeksi via REST... (${count}/${schoolKeys.length})` });
      }
      
      setStatusMsg({ type: "success", text: "Berhasil menginjeksi 42 sekolah! Daftar Admin telah diperbarui." });
    } catch (error: unknown) {
      setStatusMsg({ type: "error", text: `Gagal injeksi: ${getErrorMessage(error, "Terjadi kesalahan.")}` });
    } finally {
      setSuperSaving(false);
    }
  };

  const toggleActive = async (sid: string, next: boolean) => {
    if (!sid) return;
    setStatusMsg({ type: "", text: "" });
    try {
      await callSuperAdminApi("POST", {
        action: "toggle-school-active",
        schoolId: sid,
        isActive: next,
      });
    } catch (error: unknown) {
      setStatusMsg({ type: "error", text: getErrorMessage(error, "Gagal update status sekolah.") });
    }
  };

  const bootstrapAdminLogin = async (schoolId: string, npsn?: string) => {
    const normalizedNpsn = String(npsn || "").trim();
    if (!schoolId || !normalizedNpsn) {
      setStatusMsg({ type: "error", text: "NPSN sekolah harus dilengkapi sebelum bootstrap login." });
      return;
    }

    setSuperSaving(true);
    setStatusMsg({ type: "", text: "" });
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Belum login. Sesi tidak aktif.");
      const idToken = await currentUser.getIdToken();

      const response = await fetch("/api/bootstrap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({ npsn: normalizedNpsn, mode: "bootstrap" }),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Gagal bootstrap login admin.");
      }

      setStatusMsg({
        type: "success",
        text: payload.message || `Login admin untuk ${schoolId} berhasil disiapkan.`,
      });
    } catch (error: unknown) {
      setStatusMsg({ type: "error", text: getErrorMessage(error, "Gagal bootstrap login admin.") });
    } finally {
      setSuperSaving(false);
    }
  };

  const resetAdminPassword = async (schoolId: string, npsn?: string) => {
    const normalizedNpsn = String(npsn || "").trim();
    if (!schoolId || !normalizedNpsn) {
      setStatusMsg({ type: "error", text: "NPSN sekolah harus dilengkapi sebelum reset password." });
      return;
    }

    if (!window.confirm(`Reset password admin sekolah ${schoolId} ke default admin123?`)) {
      return;
    }

    setSuperSaving(true);
    setStatusMsg({ type: "", text: "" });
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Belum login. Sesi tidak aktif.");
      const idToken = await currentUser.getIdToken();

      const response = await fetch("/api/bootstrap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({ npsn: normalizedNpsn, mode: "reset-password" }),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Gagal reset password admin.");
      }

      setStatusMsg({
        type: "success",
        text: payload.message || `Password admin ${schoolId} berhasil direset ke admin123.`,
      });
    } catch (error: unknown) {
      setStatusMsg({ type: "error", text: getErrorMessage(error, "Gagal reset password admin.") });
    } finally {
      setSuperSaving(false);
    }
  };

  return {
    superSchools,
    loading,
    superSaving,
    statusMsg,
    setStatusMsg,
    superSchoolForm,
    setSuperSchoolForm,
    superPrincipals,
    principalQuery,
    setPrincipalQuery,
    principalEditing,
    setPrincipalEditing,
    principalSaving,
    principalForm,
    setPrincipalForm,
    securityLogs,
    adminSchoolForm,
    setAdminSchoolForm,
    superSchoolAdmins,
    openAdminSchoolEditor,
    saveAdminSchoolRegistry,
    filteredSuperPrincipals,
    formatDateTime,
    upsertPrincipalAccount,
    startEditPrincipal,
    resetPrincipalDevice,
    resetPrincipalPassword,
    schoolsWithoutAdmin,
    schoolsWithoutPrincipal,
    superStats,
    saveSuperSchool,
    handleInject42Schools,
    toggleActive,
    bootstrapAdminLogin,
    resetAdminPassword
  };
}
