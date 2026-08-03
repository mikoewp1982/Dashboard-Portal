"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { applyTeacherAuthSession } from "@/lib/guru/applyTeacherSession";

type LookupState = {
  loading: boolean;
  name?: string;
  message?: string;
};

export function GuruLoginForm() {
  const [npsn, setNpsn] = useState("");
  const [nuptk, setNuptk] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lookup, setLookup] = useState<LookupState>({ loading: false });

  useEffect(() => {
    const npsnValue = npsn.trim();
    const nuptkValue = nuptk.trim();
    if (npsnValue.length < 6 || nuptkValue.length < 6) {
      setLookup({ loading: false });
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLookup({ loading: true });
      try {
        const response = await fetch("/api/teacher/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ npsn: npsnValue, nuptk: nuptkValue }),
        });
        const payload = (await response.json().catch(() => ({}))) as {
          success?: boolean;
          name?: string;
          message?: string;
        };
        if (cancelled) return;
        if (!response.ok || !payload.success) {
          setLookup({
            loading: false,
            message: payload.message || "Guru tidak ditemukan di database admin.",
          });
          return;
        }
        setLookup({ loading: false, name: payload.name || "" });
      } catch {
        if (!cancelled) {
          setLookup({ loading: false, message: "Gagal memeriksa data guru." });
        }
      }
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [npsn, nuptk]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const npsnValue = npsn.trim();
      const nuptkValue = nuptk.trim();
      if (!npsnValue || !nuptkValue) {
        throw new Error("NPSN dan NUPTK wajib diisi (sama seperti APK GAS Guru).");
      }

      const response = await fetch("/api/teacher/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ npsn: npsnValue, nuptk: nuptkValue }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string;
        email?: string;
        customToken?: string;
        session?: {
          localId: string;
          email: string;
          displayName?: string;
          idToken: string;
          refreshToken: string;
          expiresIn: string;
        };
        teacher?: { name?: string };
      };

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Login gagal.");
      }

      await applyTeacherAuthSession({
        email: payload.email,
        password: nuptkValue,
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
            Portal wali kelas untuk iPhone &amp; browser. Login sama seperti APK: NPSN + NUPTK
            (hanya guru terdaftar &amp; aktif di database admin).
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
              placeholder="Masukkan NPSN sekolah"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none ring-teal-400/40 placeholder:text-slate-500 focus:ring-2"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">NUPTK</span>
            <input
              value={nuptk}
              onChange={(e) => setNuptk(e.target.value)}
              inputMode="numeric"
              autoComplete="current-password"
              placeholder="Masukkan NUPTK (password login)"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none ring-teal-400/40 placeholder:text-slate-500 focus:ring-2"
            />
          </label>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Nama Guru
            </div>
            <div className="mt-1 text-sm text-white">
              {lookup.loading
                ? "Mencari nama guru..."
                : lookup.name
                  ? lookup.name
                  : "Terisi otomatis dari database admin"}
            </div>
            {!lookup.loading && lookup.message && (
              <div className="mt-1 text-xs text-rose-200">{lookup.message}</div>
            )}
            {!lookup.loading && lookup.name && (
              <div className="mt-1 text-xs text-teal-200/80">
                Nama guru terhubung otomatis dari Manajemen Guru/Wali Kelas.
              </div>
            )}
          </div>

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
            Kredensial mengikuti APK GAS Guru: isi NPSN dan NUPTK. Nama guru hanya tampilan dari
            database admin (bukan username ketik manual).
          </p>
          <p>
            Di iPhone/iPad: buka Safari → Bagikan → <strong className="text-slate-200">Add to Home Screen</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
