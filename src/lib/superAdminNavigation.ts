export type SuperAdminTab =
  | "overview"
  | "tenants"
  | "global-config"
  | "sync-jobs"
  | "broadcast"
  | "support"
  | "audit"
  | "service-status";

export type SuperAdminNavItem = {
  tab: SuperAdminTab;
  href: string;
  label: string;
  description?: string;
};

export const SUPER_ADMIN_TABS: readonly SuperAdminTab[] = [
  "overview",
  "tenants",
  "global-config",
  "sync-jobs",
  "broadcast",
  "support",
  "audit",
  "service-status",
] as const;

export function isSuperAdminTab(value: string | null | undefined): value is SuperAdminTab {
  return SUPER_ADMIN_TABS.includes((value ?? "") as SuperAdminTab);
}

export function buildSuperAdminHref(tab: SuperAdminTab) {
  if (tab === "overview") return "/super-admin/gas";
  if (tab === "tenants") return "/super-admin/gas/tenants";
  if (tab === "global-config") return "/super-admin/gas/global-config";
  if (tab === "sync-jobs") return "/super-admin/gas/sync-jobs";
  if (tab === "broadcast") return "/super-admin/gas/broadcast";
  if (tab === "support") return "/super-admin/gas/support";
  if (tab === "audit") return "/super-admin/gas/audit";
  return "/super-admin/service-status";
}

export const SUPER_ADMIN_NAV_ITEMS: readonly SuperAdminNavItem[] = [
  {
    tab: "overview",
    href: buildSuperAdminHref("overview"),
    label: "Super Admin GAS",
    description: "Ringkasan tenant, support, dan antrean sinkronisasi lintas sekolah.",
  },
  {
    tab: "tenants",
    href: buildSuperAdminHref("tenants"),
    label: "Sekolah & Tenant",
    description: "Pantau tenant aktif, tenant nonaktif, dan status registry sekolah.",
  },
  {
    tab: "global-config",
    href: buildSuperAdminHref("global-config"),
    label: "Konfigurasi Global",
    description: "Pusat kebijakan global lintas tenant.",
  },
  {
    tab: "sync-jobs",
    href: buildSuperAdminHref("sync-jobs"),
    label: "Sync Jobs",
    description: "Pantau antrean sinkronisasi dan status job operasional.",
  },
  {
    tab: "broadcast",
    href: buildSuperAdminHref("broadcast"),
    label: "Broadcast Global",
    description: "Kelola pengumuman lintas sekolah dari pusat.",
  },
  {
    tab: "support",
    href: buildSuperAdminHref("support"),
    label: "Support Tools",
    description: "Ringkas tiket terbuka dan tindak lanjut operasional super admin.",
  },
  {
    tab: "audit",
    href: buildSuperAdminHref("audit"),
    label: "Audit & Compliance",
    description: "Jejak audit dan kontrol kepatuhan area GAS lintas tenant.",
  },
  {
    tab: "service-status",
    href: buildSuperAdminHref("service-status"),
    label: "Status Layanan Sekolah",
    description: "Lihat kesehatan operasional tenant tanpa keluar dari dashboard utama.",
  },
] as const;
