"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { LogOut, User, Key, ChevronRight, Bell } from "lucide-react";
import Image from "next/image";
import { getAuth, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function SiswaProfilPage() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    // Hapus juga localStorage Firebase jika ada, lalu lempar ke login
    router.push("/siswa/login");
  };

  return (
    <div className="min-h-dvh bg-slate-50 pb-24">
      {/* Header Profil */}
      <div className="bg-slate-900 px-6 pt-12 pb-24 text-white relative">
        <h1 className="text-xl font-bold text-center">Profil Saya</h1>
      </div>

      {/* Info Card - Overlapping Header */}
      <div className="px-5 -mt-16 relative z-10">
        <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center">
          <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-white shadow-lg bg-slate-100 -mt-12 mb-3">
            <Image
              src="/tutorial/gas-siswa/logo-aplikasi.png"
              alt="Avatar"
              width={80}
              height={80}
              className="h-full w-full object-cover"
            />
          </div>
          
          <h2 className="text-lg font-bold text-slate-800 text-center">
            {user?.name || "Nama Siswa"}
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            NISN: {user?.nisn || "0000000000"}
          </p>
          <div className="mt-3 inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            Kelas {user?.class || "-"}
          </div>
        </div>
      </div>

      {/* Menu List */}
      <div className="px-5 mt-6">
        <h3 className="mb-3 text-[11px] font-bold tracking-widest text-slate-400 uppercase ml-2">
          PENGATURAN AKUN
        </h3>
        
        <div className="rounded-3xl bg-white shadow-sm border border-slate-100 overflow-hidden">
          
          <button className="flex w-full items-center p-4 transition hover:bg-slate-50 active:bg-slate-100">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <User className="h-5 w-5" />
            </div>
            <div className="ml-4 flex-1 text-left">
              <p className="text-sm font-semibold text-slate-700">Informasi Pribadi</p>
              <p className="text-xs text-slate-500 mt-0.5">Edit data profil & kontak</p>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-300" />
          </button>
          
          <div className="h-px w-full bg-slate-50 ml-16" />
          
          <button className="flex w-full items-center p-4 transition hover:bg-slate-50 active:bg-slate-100">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <Key className="h-5 w-5" />
            </div>
            <div className="ml-4 flex-1 text-left">
              <p className="text-sm font-semibold text-slate-700">Ganti Password</p>
              <p className="text-xs text-slate-500 mt-0.5">Ubah kata sandi akun</p>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-300" />
          </button>

          <div className="h-px w-full bg-slate-50 ml-16" />
          
          <button className="flex w-full items-center p-4 transition hover:bg-slate-50 active:bg-slate-100">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
              <Bell className="h-5 w-5" />
            </div>
            <div className="ml-4 flex-1 text-left">
              <p className="text-sm font-semibold text-slate-700">Notifikasi</p>
              <p className="text-xs text-slate-500 mt-0.5">Atur pemberitahuan PWA</p>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-300" />
          </button>

        </div>
      </div>

      {/* Logout Button */}
      <div className="px-5 mt-8 mb-12">
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center rounded-2xl bg-rose-50 px-4 py-4 text-sm font-bold text-rose-600 transition hover:bg-rose-100 active:scale-95"
        >
          <LogOut className="mr-2 h-5 w-5" />
          KELUAR AKUN
        </button>
      </div>

    </div>
  );
}
