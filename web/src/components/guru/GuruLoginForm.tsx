"use client";

import Image from "next/image";
import { useState } from "react";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

export function GuruLoginForm() {
  const [npsn, setNpsn] = useState("");
  const [nuptk, setNuptk] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/teacher/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ npsn: npsn.trim(), nuptk: nuptk.trim() }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string;
        customToken?: string;
      };
      if (!response.ok || !payload.success || !payload.customToken) {
        throw new Error(payload.message || "Login gagal.");
      }
      await signInWithCustomToken(auth, payload.customToken);
      await auth.currentUser?.getIdToken(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal masuk.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top,_#0f766e_0%,_#0b1220_50%,_#071018_100%)] px-4 py-8 text-slate-100">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-md flex-col justify-center">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl">
            <Image
              src="/tutorial/gas-siswa/logo-aplikasi.png"
              alt="GAS Guru"
              width={72}
              height={72}
              className="h-16 w-16 object-contain"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">GAS Guru</h1>
          <p className="mt-2 text-sm text-teal-100/80">
            Portal wali kelas untuk iPhone &amp; browser. Login dengan NPSN + NUPTK.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-3xl border border-white/10 bg-slate-950/50 p-5 shadow-2xl backdrop-blur"
        >
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">NPSN Sekolah</span>
            <input
              value={npsn}
              onChange={(e) => setNpsn(e.target.value)}
              inputMode="numeric"
              autoComplete="username"
              placeholder="Masukkan NPSN"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none ring-teal-400/40 placeholder:text-slate-500 focus:ring-2"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">NUPTK Guru</span>
            <input
              value={nuptk}
              onChange={(e) => setNuptk(e.target.value)}
              autoComplete="current-password"
              placeholder="Masukkan NUPTK"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none ring-teal-400/40 placeholder:text-slate-500 focus:ring-2"
            />
          </label>

          {error && (
            <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-teal-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-400 disabled:opacity-60"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-center text-xs leading-relaxed text-slate-400">
          <p>
            Di iPhone/iPad: buka Safari → Bagikan → <strong className="text-slate-200">Add to Home Screen</strong>.
          </p>
          <p>
            Notifikasi push iOS butuh iOS 16.4+, dipasang sebagai Home Screen app, dan izin pengguna.
          </p>
        </div>
      </div>
    </div>
  );
}
