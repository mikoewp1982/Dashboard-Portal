"use client";

import Image from "next/image";
import { useState } from "react";
import { signInWithEmailAndPassword, updatePassword } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useAuthStore } from "@/store/useAuthStore";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const user = useAuthStore((state) => state.user);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [mustChangeGate, setMustChangeGate] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const effectiveMustChangeGate = mustChangeGate || user?.mustChangePassword === true;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const raw = String(identifier || "").trim();
      if (!raw || !password) {
        setError("NPSN/Email dan password wajib diisi.");
        setLoading(false);
        return;
      }

      // Format login: Jika tidak ada '@', asumsikan NPSN sekolah
      const emailLower = raw.includes("@") ? raw.toLowerCase() : `${raw}@edulock.local`;

      try {
        await signInWithEmailAndPassword(auth, emailLower, password);
      } catch (signInErr: unknown) {
        const authErrorCode = signInErr instanceof Error && "code" in signInErr ? String((signInErr as { code?: string }).code || "") : "";
        if (authErrorCode === "auth/invalid-credential" && password === "admin123" && !raw.includes("@")) {
          throw new Error("Akun admin sekolah belum disiapkan atau password default sudah direset. Minta Super Admin melakukan bootstrap/reset akun.");
        } else {
          throw signInErr;
        }
      }

      if (auth.currentUser) {
        const tokenResult = await auth.currentUser.getIdTokenResult(true);
        const token = tokenResult.token;
        // Record login time
        fetch("/api/auth/record-login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        }).catch(err => console.error("Failed to record login", err));

        const shouldForcePasswordChange =
          tokenResult.claims.mustChangePassword === true ||
          (!raw.includes("@") && password === "admin123");

        if (shouldForcePasswordChange) {
          setMustChangeGate(true);
          setNewPassword("");
          setConfirmPassword("");
          return;
        }
      }
      
      // Redirect diurus otomatis oleh AuthProvider jika tidak harus ganti password
    } catch (err: unknown) {
      const code = err instanceof Error && "code" in err ? String((err as { code?: string }).code || "") : "";
      const message = err instanceof Error ? err.message : String(err);
      if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
        setError("Email atau Password salah.");
      } else if (code === "auth/user-not-found") {
        setError("Akun belum terdaftar.");
      } else {
        setError(`Gagal masuk: ${message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const next = String(newPassword || "");
    const confirm = String(confirmPassword || "");
    if (next.length < 6) {
      setError("Password baru minimal 6 karakter.");
      return;
    }
    if (next === "admin123") {
      setError("Password baru tidak boleh sama dengan admin123.");
      return;
    }
    if (next !== confirm) {
      setError("Konfirmasi password tidak sama.");
      return;
    }

    setChangingPassword(true);
    try {
      if (!auth.currentUser) throw new Error("User tidak terautentikasi.");
      await updatePassword(auth.currentUser, next);

      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch("/api/auth/complete-password-change", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Gagal menyelesaikan perubahan password.");
      }

      await auth.currentUser.getIdToken(true);
      
      setMustChangeGate(false);
      setNewPassword("");
      setConfirmPassword("");
      // Redirect diurus otomatis oleh AuthProvider
    } catch (error: unknown) {
      setError(`Gagal ubah password: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-8 shadow-xl backdrop-blur">
          <div className="flex flex-col items-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 mb-4 shadow-lg border border-white/10 overflow-hidden relative">
              <Image
                src="/PortalKita.png"
                alt="Logo PortalKita"
                fill
                className="object-contain p-2"
                priority
              />
            </div>
            <p className="text-center text-sm font-semibold text-slate-200">
              SELAMAT DATANG DI PORTAL KITA
            </p>
            <h1 className="text-center text-2xl font-bold tracking-tight text-white">Login Portal</h1>
          </div>

          {error && (
            <div className="mt-6 rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {effectiveMustChangeGate ? (
            <form onSubmit={handleChangePassword} className="mt-6 space-y-4">
              <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-200">
                Demi keamanan, Anda wajib mengganti password pada login pertama.
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-200">Password Baru</label>
                <input
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={changingPassword}
                  type="password"
                  className="mt-2 w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Minimal 6 karakter"
                  autoComplete="new-password"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200">Konfirmasi Password Baru</label>
                <input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={changingPassword}
                  type="password"
                  className="mt-2 w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ulangi password baru"
                  autoComplete="new-password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={changingPassword}
                className="mt-2 w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {changingPassword ? "Menyimpan..." : "Simpan Password & Lanjutkan"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-200">NPSN Sekolah / Email Super Admin</label>
                <input
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={loading}
                  className="mt-2 w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="NPSN atau Email"
                  autoComplete="username"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200">Password</label>
                <div className="relative mt-2">
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    type={showPassword ? "text" : "password"}
                    className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-3 pr-12 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="admin123"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-200 hover:text-white disabled:opacity-60"
                    disabled={loading}
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              >
                {loading ? "Memproses..." : "Masuk"}
              </button>
              
              <div className="mt-4 text-center text-xs text-slate-400">
                Login admin sekolah menggunakan username NPSN dan password awal admin123.
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <button
              type="button"
              disabled={loading}
              className="text-sm font-semibold text-slate-200 hover:text-white disabled:opacity-60"
            >
              Lupa Password?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
