"use client";

import React from "react";
import { RefreshCw, Home, FileSearch } from "lucide-react";
import Link from "next/link";

type Props = {
  children: React.ReactNode;
  featureLabel?: string;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class TeacherPagesErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const label = this.props.featureLabel || "TeacherPage";
    // eslint-disable-next-line no-console
    console.error(`[TeacherPagesErrorBoundary:${label}]`, error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }
    const label = this.props.featureLabel || "Fitur Guru";
    const errMsg = this.state.error?.message || String(this.state.error || "Unknown error");
    const errStack = this.state.error?.stack || "";
    return (
      <div className="min-h-dvh bg-[radial-gradient(circle_at_top,_#134e4a_0%,_#0b1220_45%,_#071018_100%)] px-4 py-8 text-slate-100">
        <div className="mx-auto max-w-lg space-y-4">
          <section className="rounded-3xl border border-rose-400/30 bg-rose-500/10 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-rose-200">
              <FileSearch className="h-4 w-4" />
              {label} tidak dapat dimuat
            </div>
            <h2 className="mt-2 text-lg font-bold text-white">
              Ada kendala saat memuat halaman ini.
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-rose-100/80">
              Biasanya ini terjadi karena data dari server belum stabil atau cache lama.
              Coba langkah berikut berurutan:
            </p>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-xs text-slate-200">
              <li>Tap tombol <span className="font-semibold text-teal-200">Muat ulang halaman</span> di bawah ini.</li>
              <li>Jika masih error, <span className="font-semibold text-teal-200">Kembali ke Beranda</span> lalu buka menu {label} lagi.</li>
              <li>Jika tetap sama, hapus cache browser / "Clear storage" untuk situs ini, lalu login ulang.</li>
            </ol>
          </section>

          <section className="rounded-3xl border border-white/10 bg-slate-950/50 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-400 px-4 py-3 text-sm font-semibold text-slate-950"
              >
                <RefreshCw className="h-4 w-4" />
                Muat ulang halaman
              </button>
              <Link
                href="/guru"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white"
              >
                <Home className="h-4 w-4" />
                Kembali ke Beranda
              </Link>
            </div>
          </section>

          <details className="rounded-3xl border border-white/10 bg-black/40 p-4 text-xs text-slate-400">
            <summary className="cursor-pointer select-none text-slate-300">
              Lihat detail error (untuk petugas IT)
            </summary>
            <div className="mt-3 space-y-2">
              <div className="rounded-xl border border-white/10 bg-black/60 p-3 font-mono text-[11px] leading-relaxed text-rose-300">
                {errMsg}
              </div>
              {errStack ? (
                <pre className="max-h-60 overflow-auto rounded-xl border border-white/10 bg-black/60 p-3 font-mono text-[10px] leading-relaxed text-slate-400 whitespace-pre-wrap">
                  {errStack}
                </pre>
              ) : null}
            </div>
          </details>
        </div>
      </div>
    );
  }
}
