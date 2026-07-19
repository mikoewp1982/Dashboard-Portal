"use client";

import { useMemo, useState } from "react";
import { SuperAdminPageLayout } from "@/components/super-admin/SuperAdminPageLayout";
import { useSuperAdminLiveData } from "@/hooks/super-admin/useSuperAdminLiveData";
import { callSuperAdminApi } from "@/lib/callSuperAdminApi";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Terjadi kesalahan saat menyimpan konfigurasi.";
}

export default function SuperAdminGlobalConfigPage() {
  const { metrics, loading, globalConfig } = useSuperAdminLiveData();
  const [draftConfig, setDraftConfig] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const hasConfig = useMemo(
    () => Boolean(globalConfig && Object.keys(globalConfig).length > 0),
    [globalConfig]
  );

  const loadedConfigText = useMemo(() => {
    const nextConfig =
      globalConfig && Object.keys(globalConfig).length > 0 ? globalConfig : {};
    return JSON.stringify(nextConfig, null, 2);
  }, [globalConfig]);

  const configText = draftConfig ?? loadedConfigText;

  const handleSave = async () => {
    setIsSaving(true);
    setMessage("");
    try {
      const parsedConfig = JSON.parse(configText);
      await callSuperAdminApi("POST", {
        action: "save-global-config",
        config: parsedConfig
      });
      setDraftConfig(null);
      setMessage("Konfigurasi berhasil disimpan!");
    } catch (error: unknown) {
      setMessage(`Error: ${getErrorMessage(error)}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SuperAdminPageLayout
      title="Konfigurasi Global"
      description="Menu konfigurasi pusat lintas tenant. Halaman ini dikembalikan sebagai route khusus agar tidak lagi melebur ke overview atau database."
      actions={[
        { href: "/super-admin/dashboard", label: "Kembali ke Overview" },
        { href: "/super-admin/service-status", label: "Lihat Service Status" },
      ]}
    >
      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Tenant Aktif</div>
          <div className="mt-3 text-3xl font-bold text-emerald-300">{metrics.activeSchools}</div>
        </article>
        <article className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Support Terbuka</div>
          <div className="mt-3 text-3xl font-bold text-amber-300">{metrics.supportOpen}</div>
        </article>
        <article className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Sync Queued</div>
          <div className="mt-3 text-3xl font-bold text-blue-300">{metrics.syncQueued}</div>
        </article>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-white">Edit Konfigurasi Global (JSON)</div>
            <div className="mt-1 text-xs text-slate-400">
              Editor ini membaca node RTDB riil `gas/global_config`, bukan data contoh.
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200">
            {loading ? "Memuat..." : hasConfig ? "Data riil terbaca" : "Belum ada konfigurasi tersimpan"}
          </div>
        </div>
        <textarea
          className="mt-4 h-48 w-full rounded-xl border border-white/10 bg-slate-950/50 p-4 font-mono text-sm text-slate-300 focus:border-blue-500/50 focus:outline-none"
          value={configText}
          onChange={(e) => setDraftConfig(e.target.value)}
        />
        {message && (
          <div className={`mt-4 text-sm ${message.startsWith("Error") ? "text-red-400" : "text-emerald-400"}`}>
            {message}
          </div>
        )}
        <div className="mt-4 flex flex-wrap justify-end gap-3">
          <button
            onClick={() => {
              setDraftConfig(null);
              setMessage("");
            }}
            className="rounded-xl border border-white/10 bg-white/5 px-6 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            type="button"
          >
            Muat Ulang dari Server
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            type="button"
            className="rounded-xl bg-blue-500 hover:bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition disabled:opacity-50"
          >
            {isSaving ? "Menyimpan..." : "Simpan Konfigurasi"}
          </button>
        </div>
      </section>
    </SuperAdminPageLayout>
  );
}
