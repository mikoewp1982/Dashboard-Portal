"use client";

import Image from "next/image";
import { useState } from "react";
import { applyStudentAuthSession } from "@/lib/siswa/applyStudentSession";

export default function SiswaLoginForm() {
  const [npsn, setNpsn] = useState("");
  const [nisn, setNisn] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const npsnValue = npsn.trim();
      const nisnValue = nisn.trim();
      const passwordValue = password.trim();
      
      if (!npsnValue || !nisnValue || !passwordValue) {
        throw new Error("NPSN, NISN, dan Password wajib diisi.");
      }

      const response = await fetch("/api/student/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ npsn: npsnValue, nisn: nisnValue, password: passwordValue }),
      });
      
      const payload = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string;
        email?: string;
        customToken?: string;
        session?: any;
      };

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Login gagal.");
      }

      await applyStudentAuthSession({
        email: payload.email,
        password: nisnValue, // Underlying FirebaseAuth password is NISN
        customToken: payload.customToken,
        session: payload.session,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal masuk.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-slate-950 px-4 py-8 text-slate-100 flex items-center justify-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950"></div>
      
      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col justify-center">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/20 to-blue-500/20 shadow-xl backdrop-blur-sm">
            <Image
              src="/tutorial/gas-siswa/logo-aplikasi.png"
              alt="GAS Siswa"
              width={72}
              height={72}
              className="h-16 w-16 object-contain"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">GAS Siswa Web</h1>
          <p className="mt-2 text-sm text-indigo-200/80">
            Portal absensi untuk pengguna iOS / iPhone.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-md"
        >
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">NPSN Sekolah</span>
            <input
              value={npsn}
              onChange={(e) => setNpsn(e.target.value)}
              inputMode="numeric"
              placeholder="Masukkan NPSN sekolah"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none ring-indigo-500/40 placeholder:text-slate-500 focus:ring-2"
              required
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">NISN</span>
            <input
              value={nisn}
              onChange={(e) => setNisn(e.target.value)}
              inputMode="numeric"
              autoComplete="username"
              placeholder="Masukkan NISN Anda"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none ring-indigo-500/40 placeholder:text-slate-500 focus:ring-2"
              required
            />
          </label>
          
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Password</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              placeholder="Masukkan Password"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none ring-indigo-500/40 placeholder:text-slate-500 focus:ring-2"
              required
            />
          </label>

          {error && (
            <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-2xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500 disabled:opacity-60"
          >
            {loading ? "Masuk..." : "Masuk"}
          </button>
        </form>

        <div className="mt-8 space-y-2 text-center text-xs leading-relaxed text-slate-400">
          <p>
            Gunakan Safari, lalu tap icon Bagikan (Share) dan pilih <strong className="text-slate-200">Tambahkan ke Layar Utama</strong> (Add to Home Screen) agar terasa seperti aplikasi asli.
          </p>
        </div>
      </div>
    </div>
  );
}
