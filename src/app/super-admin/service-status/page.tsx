"use client";

import { useMemo, useState } from "react";
import { SuperAdminPageLayout } from "@/components/super-admin/SuperAdminPageLayout";
import { useSuperAdminLiveData } from "@/hooks/super-admin/useSuperAdminLiveData";
import { callSuperAdminApi } from "@/lib/callSuperAdminApi";

type FilterMode = "ALL" | "ACTIVE" | "INACTIVE" | "ISSUES";
type ServiceTab = "STATUS" | "ACTIVE_USERS";

function formatDateTime(ts: number | null | undefined): string {
  if (!ts) return "-";
  return new Date(ts).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeActivity(ts: number | null | undefined): string {
  if (!ts) return "Belum pernah login";

  const diffMs = Date.now() - ts;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Aktif < 1 jam";
  if (diffHours < 24) return `Aktif ${diffHours} jam lalu`;
  return `Aktif ${diffDays} hari lalu`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function readNumericConfigValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const digitsOnly = value.replace(/[^\d.-]/g, "");
    const parsed = Number(digitsOnly);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }
  return null;
}

function readPerStudentTariff(config: Record<string, unknown> | null): number | null {
  if (!config) return null;

  const billing = config.billing && typeof config.billing === "object"
    ? (config.billing as Record<string, unknown>)
    : null;
  const pricing = config.pricing && typeof config.pricing === "object"
    ? (config.pricing as Record<string, unknown>)
    : null;

  const candidates = [
    billing?.perStudentTariff,
    billing?.studentTariff,
    billing?.tarifPerSiswa,
    billing?.pricePerStudent,
    pricing?.perStudentTariff,
    pricing?.studentTariff,
    config.perStudentTariff,
    config.studentTariff,
    config.tarifPerSiswa,
    config.pricePerStudent,
  ];

  for (const candidate of candidates) {
    const parsed = readNumericConfigValue(candidate);
    if (parsed !== null) {
      return parsed;
    }
  }

  return null;
}

function buildIssueLabel(params: {
  paymentStatus: "PAID" | "UNPAID";
  isActive: boolean;
  adminAccessActive: boolean;
  hasAdminLogin: boolean;
}) {
  if (params.paymentStatus !== "PAID") return "Belum membayar";
  if (!params.isActive) return "Tenant ditutup";
  if (!params.adminAccessActive) return "Login admin ditutup";
  if (!params.hasAdminLogin) return "Login admin belum diatur";
  return "Normal";
}

export default function ServiceStatusPage() {
  const { loading, schools, supportRequests, syncJobs, metrics, studentUsageRows, globalConfig } = useSuperAdminLiveData();
  const [serviceTab, setServiceTab] = useState<ServiceTab>("STATUS");
  const [filterMode, setFilterMode] = useState<FilterMode>("ALL");
  const [search, setSearch] = useState("");
  const [pendingSchoolId, setPendingSchoolId] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [tariffDraft, setTariffDraft] = useState<string | null>(null);
  const [billingMessage, setBillingMessage] = useState("");
  const [billingSaving, setBillingSaving] = useState(false);

  const latestSyncBySchool = useMemo(() => {
    return syncJobs.reduce<Record<string, { status: string; updatedAt: number | null }>>((acc, job) => {
      const currentTime = job.updatedAt || job.createdAt || 0;
      const previousTime = acc[job.schoolId]?.updatedAt || 0;
      if (!acc[job.schoolId] || currentTime > previousTime) {
        acc[job.schoolId] = {
          status: job.status,
          updatedAt: job.updatedAt || job.createdAt,
        };
      }
      return acc;
    }, {});
  }, [syncJobs]);

  const openSupportBySchool = useMemo(() => {
    return supportRequests.reduce<Record<string, number>>((acc, row) => {
      if (row.status === "OPEN") {
        acc[row.schoolId] = (acc[row.schoolId] || 0) + 1;
      }
      return acc;
    }, {});
  }, [supportRequests]);

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return schools.filter((row) => {
      const hasAdminLogin = Boolean(row.authEmail || row.adminEmail);
      const hasIssue = row.paymentStatus !== "PAID" || !row.isActive || !row.adminAccessActive || !hasAdminLogin;

      if (filterMode === "ACTIVE" && !row.isActive) return false;
      if (filterMode === "INACTIVE" && row.isActive) return false;
      if (filterMode === "ISSUES" && !hasIssue) return false;

      if (!keyword) return true;
      return [row.name, row.schoolId, row.npsn, row.district, row.authEmail, row.adminEmail, row.paymentStatus]
        .some((value) => String(value || "").toLowerCase().includes(keyword));
    });
  }, [filterMode, schools, search]);

  const effectiveSelectedSchoolId = useMemo(() => {
    if (filteredRows.length === 0) return "";
    const stillExists = filteredRows.some((row) => row.schoolId === selectedSchoolId);
    return stillExists ? selectedSchoolId : filteredRows[0].schoolId;
  }, [filteredRows, selectedSchoolId]);

  const selectedSchool = useMemo(
    () => schools.find((row) => row.schoolId === effectiveSelectedSchoolId) || null,
    [effectiveSelectedSchoolId, schools]
  );

  const perStudentTariff = useMemo(() => readPerStudentTariff(globalConfig), [globalConfig]);
  const tariffInput = tariffDraft ?? (perStudentTariff !== null ? String(perStudentTariff) : "");

  const studentUsageBySchool = useMemo(() => {
    return studentUsageRows.reduce<Record<string, (typeof studentUsageRows)[number]>>((acc, row) => {
      acc[row.schoolId] = row;
      return acc;
    }, {});
  }, [studentUsageRows]);

  const filteredStudentRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    const rows = schools
      .map((school) => ({
        school,
        usage: studentUsageBySchool[school.schoolId] || {
          schoolId: school.schoolId,
          totalStudents: 0,
          activatedStudents: 0,
          unactivatedStudents: 0,
          activeOperationalStudents: 0,
          latestActivityAt: null,
        },
      }))
      .sort((a, b) => {
        const activityA = a.usage.latestActivityAt || 0;
        const activityB = b.usage.latestActivityAt || 0;
        if (activityA !== activityB) return activityB - activityA;
        return String(a.school.name || a.school.schoolId).localeCompare(String(b.school.name || b.school.schoolId));
      });

    if (!keyword) return rows;

    return rows.filter(({ school }) =>
      [school.name, school.schoolId, school.npsn, school.district]
        .some((value) => String(value || "").toLowerCase().includes(keyword))
    );
  }, [schools, search, studentUsageBySchool]);

  const effectiveMonitoringSchoolId = useMemo(() => {
    if (filteredStudentRows.length === 0) return "";
    const stillExists = filteredStudentRows.some((row) => row.school.schoolId === selectedSchoolId);
    return stillExists ? selectedSchoolId : filteredStudentRows[0].school.schoolId;
  }, [filteredStudentRows, selectedSchoolId]);

  const monitoringMetrics = useMemo(() => {
    return filteredStudentRows.reduce(
      (acc, row) => {
        acc.totalSchools += 1;
        acc.totalStudents += row.usage.totalStudents;
        acc.activatedStudents += row.usage.activatedStudents;
        acc.unactivatedStudents += row.usage.unactivatedStudents;
        acc.activeOperationalStudents += row.usage.activeOperationalStudents;
        return acc;
      },
      {
        totalSchools: 0,
        totalStudents: 0,
        activatedStudents: 0,
        unactivatedStudents: 0,
        activeOperationalStudents: 0,
      }
    );
  }, [filteredStudentRows]);

  const selectedMonitoringSchool = useMemo(() => {
    if (!effectiveMonitoringSchoolId) return null;
    return schools.find((row) => row.schoolId === effectiveMonitoringSchoolId) || null;
  }, [effectiveMonitoringSchoolId, schools]);

  const selectedMonitoringUsage = useMemo(() => {
    if (!effectiveMonitoringSchoolId) {
      return null;
    }
    return studentUsageBySchool[effectiveMonitoringSchoolId] || null;
  }, [effectiveMonitoringSchoolId, studentUsageBySchool]);

  const totalEstimatedBilling = useMemo(() => {
    if (perStudentTariff === null) return null;
    return filteredStudentRows.reduce((sum, row) => {
      return sum + (row.usage.activatedStudents * perStudentTariff);
    }, 0);
  }, [filteredStudentRows, perStudentTariff]);

  const handleSavePerStudentTariff = async () => {
    const normalizedTariff = readNumericConfigValue(tariffInput);
    if (normalizedTariff === null) {
      setBillingMessage("Tarif per siswa wajib berupa angka nol atau lebih.");
      return;
    }

    setBillingSaving(true);
    setBillingMessage("");
    try {
      const nextConfig =
        globalConfig && typeof globalConfig === "object"
          ? JSON.parse(JSON.stringify(globalConfig))
          : {};
      const nextRecord = nextConfig as Record<string, unknown>;
      const currentBilling =
        nextRecord.billing && typeof nextRecord.billing === "object"
          ? (nextRecord.billing as Record<string, unknown>)
          : {};

      nextRecord.billing = {
        ...currentBilling,
        perStudentTariff: normalizedTariff,
        updatedAt: Date.now(),
      };

      await callSuperAdminApi("POST", {
        action: "save-global-config",
        config: nextRecord,
      });
      setTariffDraft(null);
      setBillingMessage("Tarif per siswa berhasil disimpan ke konfigurasi global.");
    } catch (error: unknown) {
      setBillingMessage(error instanceof Error ? error.message : "Gagal menyimpan tarif per siswa.");
    } finally {
      setBillingSaving(false);
    }
  };

  const handleToggleSchool = async (schoolId: string, nextActive: boolean) => {
    setPendingSchoolId(schoolId);
    setStatusMessage("");
    try {
      await callSuperAdminApi("POST", {
        action: "toggle-school-active",
        schoolId,
        isActive: nextActive,
      });
      setStatusMessage(`Status layanan ${schoolId} berhasil diubah menjadi ${nextActive ? "aktif" : "nonaktif"}.`);
    } catch (error: unknown) {
      setStatusMessage(error instanceof Error ? error.message : "Gagal mengubah status layanan sekolah.");
    } finally {
      setPendingSchoolId("");
    }
  };

  const handleSetPaymentStatus = async (
    schoolId: string,
    nextPaymentStatus: "PAID" | "UNPAID"
  ) => {
    setPendingSchoolId(schoolId);
    setStatusMessage("");
    try {
      await callSuperAdminApi("POST", {
        action: "set-school-payment-status",
        schoolId,
        paymentStatus: nextPaymentStatus,
      });
      setStatusMessage(
        `Status pembayaran ${schoolId} berhasil diubah menjadi ${nextPaymentStatus === "PAID" ? "sudah membayar" : "belum membayar"}.`
      );
    } catch (error: unknown) {
      setStatusMessage(error instanceof Error ? error.message : "Gagal mengubah status pembayaran sekolah.");
    } finally {
      setPendingSchoolId("");
    }
  };

  const hasAdminLogin = Boolean(selectedSchool?.authEmail || selectedSchool?.adminEmail);
  const issueLabel = selectedSchool
    ? buildIssueLabel({
        paymentStatus: selectedSchool.paymentStatus,
        isActive: selectedSchool.isActive,
        adminAccessActive: selectedSchool.adminAccessActive,
        hasAdminLogin,
      })
    : "-";

  const selectedSupportOpen = selectedSchool ? openSupportBySchool[selectedSchool.schoolId] || 0 : 0;
  const selectedLatestSync = selectedSchool ? latestSyncBySchool[selectedSchool.schoolId] : null;
  const summaryCards = [
    {
      label: "TOTAL",
      value: metrics.totalSchools,
      helper: "Semua sekolah",
      valueClassName: "text-white",
    },
    {
      label: "SUDAH MEMBAYAR",
      value: metrics.paidSchools,
      helper: "Tercatat membayar",
      valueClassName: "text-cyan-300",
    },
    {
      label: "BELUM MEMBAYAR",
      value: metrics.unpaidSchools,
      helper: "Perlu tindak lanjut",
      valueClassName: "text-amber-300",
    },
    {
      label: "LAYANAN AKTIF",
      value: metrics.activeSchools,
      helper: "Bisa digunakan",
      valueClassName: "text-emerald-300",
    },
    {
      label: "LAYANAN NONAKTIF",
      value: metrics.totalSchools - metrics.activeSchools,
      helper: "Sedang ditutup",
      valueClassName: "text-rose-300",
    },
  ] as const;

  return (
    <SuperAdminPageLayout
      title="Status Layanan"
      description="Monitoring pembayaran sekolah, status layanan tenant, dan kontrol aktivasi akses admin sekolah lintas tenant."
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((card) => (
          <article
            key={card.label}
            className="rounded-[26px] border border-white/10 bg-[#0f173b]/95 px-5 py-4 shadow-[0_10px_30px_rgba(4,10,30,0.28)] backdrop-blur"
          >
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{card.label}</div>
            <div className={`mt-3 text-[40px] font-bold leading-none ${card.valueClassName}`}>{card.value}</div>
            <div className="mt-3 text-sm text-slate-300">{card.helper}</div>
          </article>
        ))}
      </section>

      {statusMessage && (
        <section className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
          {statusMessage}
        </section>
      )}

      <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-2 shadow-xl backdrop-blur">
        <div className="grid gap-2 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setServiceTab("STATUS")}
            className={`rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
              serviceTab === "STATUS"
                ? "bg-indigo-600/90 text-white shadow-lg shadow-indigo-900/20"
                : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            Status Layanan
          </button>
          <button
            type="button"
            onClick={() => setServiceTab("ACTIVE_USERS")}
            className={`rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
              serviceTab === "ACTIVE_USERS"
                ? "bg-indigo-600/90 text-white shadow-lg shadow-indigo-900/20"
                : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            Monitoring Pengguna Aktif
          </button>
        </div>
      </section>

      {serviceTab === "STATUS" ? (
        <>
          <section className="rounded-3xl border border-white/10 bg-slate-900/60 shadow-xl backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-5">
              <div>
                <div className="text-sm font-semibold text-white">Kontrol Status Tenant</div>
                <div className="mt-1 text-sm text-slate-400">
                  Sumber data: `schools`, `schools/*/billing`, `gas/support_requests`, dan `gas/sync_jobs`.
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <select
                  value={filterMode}
                  onChange={(e) => setFilterMode(e.target.value as FilterMode)}
                  className="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500"
                >
                  <option value="ALL">Semua</option>
                  <option value="ACTIVE">Tenant Aktif</option>
                  <option value="INACTIVE">Tenant Nonaktif</option>
                  <option value="ISSUES">Perlu Tindak Lanjut</option>
                </select>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari schoolId / nama sekolah / NPSN..."
                  className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-blue-500 sm:w-80"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/5 text-sm">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">SEKOLAH</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">NPSN / KECAMATAN</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">STATUS PEMBAYARAN</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">LOGIN ADMIN</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">TERAKHIR AKTIF</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">CATATAN</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">LAYANAN</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-slate-950/20">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-10 text-center text-slate-400">Memuat...</td>
                    </tr>
                  ) : filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-10 text-center text-slate-400">Tidak ada tenant yang cocok.</td>
                    </tr>
                  ) : (
                    filteredRows.map((row) => {
                      const rowHasAdminLogin = Boolean(row.authEmail || row.adminEmail);
                      const rowIssueLabel = buildIssueLabel({
                        paymentStatus: row.paymentStatus,
                        isActive: row.isActive,
                        adminAccessActive: row.adminAccessActive,
                        hasAdminLogin: rowHasAdminLogin,
                      });
                      const latestSync = latestSyncBySchool[row.schoolId];
                      const supportOpen = openSupportBySchool[row.schoolId] || 0;
                      const isSelected = row.schoolId === effectiveSelectedSchoolId;

                      return (
                        <tr key={row.schoolId} className={isSelected ? "bg-cyan-500/5" : "hover:bg-white/5"}>
                          <td className="px-5 py-4">
                            <div className="font-semibold text-white">{row.name || "-"}</div>
                            <div className="mt-1 text-xs text-slate-400">{row.schoolId}</div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="text-slate-200">{row.npsn || "-"}</div>
                            <div className="mt-1 text-xs text-slate-400">{row.district || "-"}</div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-col gap-2">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                                row.paymentStatus === "PAID"
                                  ? "bg-cyan-500/10 text-cyan-200"
                                  : "bg-amber-500/10 text-amber-200"
                              }`}>
                                {row.paymentStatus === "PAID" ? "Sudah Membayar" : "Belum Membayar"}
                              </span>
                              <div className="text-xs text-slate-400">
                                {row.lastPaidAt ? `Lunas ${formatDateTime(row.lastPaidAt)}` : "Belum ada pembayaran tercatat"}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="text-slate-200">{row.npsn || row.authEmail || row.adminEmail || "-"}</div>
                            <div className="mt-1 text-xs text-slate-400">
                              {row.adminAccessActive ? "Login dibuka" : "Login ditutup"}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="text-slate-200">{formatDateTime(row.lastLoginAt)}</div>
                            <div className="mt-1 text-xs text-slate-400">
                              {latestSync?.status ? `Sinkron ${latestSync.status}` : "Belum ada sinkronisasi"}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="text-slate-200">
                              {rowIssueLabel === "Normal" ? "Status dasar normal." : rowIssueLabel}
                            </div>
                            <div className="mt-1 text-xs text-slate-400">
                              {supportOpen > 0 ? `${supportOpen} support request terbuka` : "Tanpa support request terbuka"}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                              row.isActive ? "bg-emerald-500/10 text-emerald-200" : "bg-rose-500/10 text-rose-200"
                            }`}>
                              {row.isActive ? "Layanan Aktif" : "Layanan Nonaktif"}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedSchoolId(row.schoolId)}
                                className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                                  isSelected
                                    ? "border border-cyan-500/30 bg-cyan-500/10 text-cyan-100"
                                    : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                                }`}
                              >
                                {isSelected ? "Tenant Aktif Dipilih" : "Pilih Tenant"}
                              </button>
                              <button
                                type="button"
                                disabled={pendingSchoolId === row.schoolId}
                                onClick={() => handleSetPaymentStatus(row.schoolId, row.paymentStatus === "PAID" ? "UNPAID" : "PAID")}
                                className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                                  row.paymentStatus === "PAID"
                                    ? "border border-amber-500/30 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20"
                                    : "border border-cyan-500/30 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20"
                                } disabled:cursor-not-allowed disabled:opacity-60`}
                              >
                                {pendingSchoolId === row.schoolId
                                  ? "Memproses..."
                                  : row.paymentStatus === "PAID"
                                    ? "Tandai Belum Bayar"
                                    : "Tandai Lunas"}
                              </button>
                              <button
                                type="button"
                                disabled={pendingSchoolId === row.schoolId}
                                onClick={() => handleToggleSchool(row.schoolId, !row.isActive)}
                                className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                                  row.isActive
                                    ? "border border-rose-500/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20"
                                    : "border border-cyan-500/30 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20"
                                } disabled:cursor-not-allowed disabled:opacity-60`}
                              >
                                {pendingSchoolId === row.schoolId ? "Memproses..." : row.isActive ? "Nonaktifkan" : "Aktifkan"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-white">Ringkasan Tenant Terpilih</div>
                  <div className="mt-1 text-sm text-slate-400">
                    Panel detail untuk tenant yang sedang dipilih dari tabel status layanan.
                  </div>
                </div>
                <select
                  value={effectiveSelectedSchoolId}
                  onChange={(e) => setSelectedSchoolId(e.target.value)}
                  className="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500"
                >
                  {schools.map((row) => (
                    <option key={row.schoolId} value={row.schoolId}>
                      {row.name || row.schoolId}
                    </option>
                  ))}
                </select>
              </div>

              {!selectedSchool ? (
                <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-slate-950/20 p-6 text-sm text-slate-400">
                  Pilih tenant terlebih dahulu untuk melihat detail layanan.
                </div>
              ) : (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">IDENTITAS TENANT</div>
                    <div className="mt-3 text-lg font-semibold text-white">{selectedSchool.name || "-"}</div>
                    <div className="mt-1 text-sm text-slate-400">{selectedSchool.schoolId}</div>
                    <div className="mt-4 space-y-2 text-sm text-slate-200">
                      <div>NPSN: {selectedSchool.npsn || "-"}</div>
                      <div>Kecamatan: {selectedSchool.district || "-"}</div>
                      <div>Status pembayaran: {selectedSchool.paymentStatus === "PAID" ? "Sudah Membayar" : "Belum Membayar"}</div>
                      <div>Pembayaran terakhir: {formatDateTime(selectedSchool.lastPaidAt)}</div>
                      <div>Login admin: {selectedSchool.npsn || selectedSchool.authEmail || selectedSchool.adminEmail || "-"}</div>
                      <div>Terakhir login: {formatDateTime(selectedSchool.lastLoginAt)}</div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">STATUS OPERASIONAL</div>
                    <div className="mt-4 space-y-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-400">Layanan tenant</span>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                          selectedSchool.isActive ? "bg-emerald-500/10 text-emerald-200" : "bg-rose-500/10 text-rose-200"
                        }`}>
                          {selectedSchool.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-400">Akses login admin</span>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                          selectedSchool.adminAccessActive ? "bg-cyan-500/10 text-cyan-200" : "bg-amber-500/10 text-amber-200"
                        }`}>
                          {selectedSchool.adminAccessActive ? "Dibuka" : "Ditutup"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-400">Sinkron terakhir</span>
                        <span className="text-slate-200">{selectedLatestSync?.status || "-"}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-400">Support terbuka</span>
                        <span className="text-slate-200">{selectedSupportOpen}</span>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-slate-200">
                        Catatan: {issueLabel === "Normal" ? "Status dasar normal." : issueLabel}
                      </div>
                    </div>
                  </div>
                </div>
              )}
          </section>
        </>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[
              { label: "TOTAL SEKOLAH", value: monitoringMetrics.totalSchools, helper: "Tenant yang dipantau", valueClassName: "text-white" },
              { label: "TOTAL SISWA", value: monitoringMetrics.totalStudents, helper: "Terdaftar di Database Siswa", valueClassName: "text-cyan-300" },
              { label: "SISWA DITAGIHKAN", value: monitoringMetrics.activatedStudents, helper: "Dasar billing siswa aktif", valueClassName: "text-emerald-300" },
              { label: "BELUM AKTIVASI", value: monitoringMetrics.unactivatedStudents, helper: "Belum masuk dasar billing", valueClassName: "text-amber-300" },
              { label: "AKTIF OPERASIONAL", value: monitoringMetrics.activeOperationalStudents, helper: "Realtime pemakaian, bukan billing", valueClassName: "text-sky-300" },
            ].map((card) => (
              <article
                key={card.label}
                className="rounded-[26px] border border-white/10 bg-[#0f173b]/95 px-5 py-4 shadow-[0_10px_30px_rgba(4,10,30,0.28)] backdrop-blur"
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{card.label}</div>
                <div className={`mt-3 text-[40px] font-bold leading-none ${card.valueClassName}`}>{card.value}</div>
                <div className="mt-3 text-sm text-slate-300">{card.helper}</div>
              </article>
            ))}
          </section>

          <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-white">Konfigurasi Tarif Billing</div>
                <div className="mt-1 text-sm text-slate-400">
                  Tarif per siswa disimpan terpusat di `gas/global_config.billing.perStudentTariff` dan dipakai untuk estimasi tagihan semua sekolah.
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100">
                {totalEstimatedBilling === null ? "Estimasi total menunggu tarif" : `Estimasi total: ${formatCurrency(totalEstimatedBilling)}`}
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[240px_auto]">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Tarif Per Siswa</label>
                <input
                  value={tariffInput}
                  onChange={(e) => setTariffDraft(e.target.value)}
                  placeholder="Contoh: 15000"
                  inputMode="numeric"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex flex-col justify-end gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-300">
                  {perStudentTariff === null
                    ? "Tarif pusat belum diatur. Estimasi nominal belum bisa dihitung."
                    : `Tarif aktif saat ini: ${formatCurrency(perStudentTariff)} per siswa teraktivasi.`}
                </div>
                <button
                  type="button"
                  onClick={handleSavePerStudentTariff}
                  disabled={billingSaving}
                  className="rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {billingSaving ? "Menyimpan..." : "Simpan Tarif"}
                </button>
              </div>
            </div>

            {billingMessage && (
              <div className="mt-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
                {billingMessage}
              </div>
            )}
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_380px]">
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 shadow-xl backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-5">
                <div>
                  <div className="text-sm font-semibold text-white">Monitoring Database & Aktivasi</div>
                  <div className="mt-1 text-sm text-slate-400">
                    Basis utama diambil dari `Database Siswa`. Billing dihitung dari siswa unik yang sudah aktivasi, sedangkan operasional realtime hanya untuk memantau pemakaian lintas GAS dan EduLock.
                  </div>
                </div>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari schoolId / nama sekolah / NPSN..."
                  className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-blue-500 sm:w-80"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/5 text-sm">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">SEKOLAH</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">TOTAL SISWA</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">SISWA DITAGIHKAN</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">BELUM AKTIVASI</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">AKTIF OPERASIONAL</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">ESTIMASI TAGIHAN</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">AKTIVITAS TERAKHIR</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold tracking-widest text-slate-400">DETAIL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-slate-950/20">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="px-5 py-10 text-center text-slate-400">Memuat...</td>
                      </tr>
                    ) : filteredStudentRows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-5 py-10 text-center text-slate-400">Tidak ada sekolah yang cocok dengan filter monitoring saat ini.</td>
                      </tr>
                    ) : (
                      filteredStudentRows.map(({ school, usage }) => {
                        const isSelected = school.schoolId === effectiveSelectedSchoolId;
                        const estimatedBilling = perStudentTariff === null ? null : usage.activatedStudents * perStudentTariff;
                        return (
                          <tr key={school.schoolId} className={isSelected ? "bg-cyan-500/5" : "hover:bg-white/5"}>
                            <td className="px-5 py-4">
                              <div className="font-semibold text-white">{school.name || "-"}</div>
                              <div className="mt-1 text-xs text-slate-400">{school.schoolId}</div>
                            </td>
                            <td className="px-5 py-4 text-slate-200">{usage.totalStudents}</td>
                            <td className="px-5 py-4 text-emerald-200">
                              <div>{usage.activatedStudents}</div>
                              <div className="mt-1 text-xs text-slate-400">Dasar tagihan</div>
                            </td>
                            <td className="px-5 py-4 text-amber-200">{usage.unactivatedStudents}</td>
                            <td className="px-5 py-4 text-sky-200">{usage.activeOperationalStudents}</td>
                            <td className="px-5 py-4">
                              <div className="text-slate-200">
                                {estimatedBilling === null ? "-" : formatCurrency(estimatedBilling)}
                              </div>
                              <div className="mt-1 text-xs text-slate-400">
                                {perStudentTariff === null ? "Tarif belum diatur" : `${usage.activatedStudents} x ${formatCurrency(perStudentTariff)}`}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="text-slate-200">{formatDateTime(usage.latestActivityAt)}</div>
                              <div className="mt-1 text-xs text-slate-400">{formatRelativeActivity(usage.latestActivityAt)}</div>
                            </td>
                            <td className="px-5 py-4">
                              <button
                                type="button"
                                onClick={() => setSelectedSchoolId(school.schoolId)}
                                className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                                  isSelected
                                    ? "border border-cyan-500/30 bg-cyan-500/10 text-cyan-100"
                                    : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                                }`}
                              >
                                {isSelected ? "Sekolah Terpilih" : "Lihat Detail"}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <aside className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
              <div className="text-sm font-semibold text-white">Detail Sekolah</div>
              <div className="mt-1 text-sm text-slate-400">
                Klik sekolah pada tabel kiri untuk melihat ringkasan database siswa, aktivasi, dan aktivitas operasionalnya.
              </div>

              {!selectedMonitoringSchool || !selectedMonitoringUsage ? (
                <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-slate-950/20 p-6 text-sm text-slate-400">
                  Belum ada sekolah yang dipilih atau belum ada data database siswa yang bisa diringkas saat ini.
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">IDENTITAS</div>
                    <div className="mt-3 text-lg font-semibold text-white">{selectedMonitoringSchool.name || "-"}</div>
                    <div className="mt-1 text-sm text-slate-400">{selectedMonitoringSchool.schoolId}</div>
                    <div className="mt-4 space-y-2 text-sm text-slate-200">
                      <div>NPSN: {selectedMonitoringSchool.npsn || "-"}</div>
                      <div>Kecamatan: {selectedMonitoringSchool.district || "-"}</div>
                      <div>Status layanan: {selectedMonitoringSchool.isActive ? "Aktif" : "Nonaktif"}</div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">RINGKASAN SISWA UNIK</div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                      <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Total Siswa</div>
                        <div className="mt-2 text-2xl font-bold text-white">{selectedMonitoringUsage.totalStudents}</div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Siswa Ditagihkan</div>
                        <div className="mt-2 text-2xl font-bold text-emerald-300">{selectedMonitoringUsage.activatedStudents}</div>
                        <div className="mt-1 text-xs text-slate-400">Siswa unik yang sudah aktivasi</div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Belum Aktivasi</div>
                        <div className="mt-2 text-2xl font-bold text-amber-300">{selectedMonitoringUsage.unactivatedStudents}</div>
                        <div className="mt-1 text-xs text-slate-400">Belum masuk dasar billing</div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Aktif Operasional</div>
                        <div className="mt-2 text-2xl font-bold text-sky-300">{selectedMonitoringUsage.activeOperationalStudents}</div>
                        <div className="mt-1 text-xs text-slate-400">Realtime pemakaian saat ini</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">AKTIVITAS TERAKHIR</div>
                    <div className="mt-3 text-sm text-slate-200">{formatDateTime(selectedMonitoringUsage.latestActivityAt)}</div>
                    <div className="mt-1 text-xs text-slate-400">{formatRelativeActivity(selectedMonitoringUsage.latestActivityAt)}</div>
                    <div className="mt-4 rounded-xl border border-sky-500/20 bg-sky-500/10 px-3 py-3 text-sm text-sky-100">
                      Billing memakai siswa unik yang sudah aktivasi. GAS dan EduLock dihitung satu akun siswa yang sama, tidak didobel. Angka `Aktif Operasional` hanya untuk pantauan realtime.
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">ESTIMASI TAGIHAN</div>
                    <div className="mt-3 text-2xl font-bold text-white">
                      {perStudentTariff === null ? "-" : formatCurrency(selectedMonitoringUsage.activatedStudents * perStudentTariff)}
                    </div>
                    <div className="mt-2 text-sm text-slate-300">
                      {perStudentTariff === null
                        ? "Tarif per siswa belum diatur di konfigurasi global."
                        : `${selectedMonitoringUsage.activatedStudents} siswa ditagihkan x ${formatCurrency(perStudentTariff)}.`}
                    </div>
                  </div>
                </div>
              )}
            </aside>
          </section>
        </>
      )}
    </SuperAdminPageLayout>
  );
}
