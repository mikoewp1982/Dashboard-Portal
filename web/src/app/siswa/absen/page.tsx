"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { MapPin, Navigation, Clock, ShieldCheck, AlertTriangle } from "lucide-react";
import { ref, push, set, serverTimestamp } from "firebase/database";
import { rtdb } from "@/lib/firebase/client";

export default function SiswaAbsenPage() {
  const user = useAuthStore((state) => state.user);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const requestLocation = () => {
    setLocating(true);
    setError("");
    
    if (!navigator.geolocation) {
      setError("Browser Anda tidak mendukung fitur lokasi (GPS).");
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocating(false);
      },
      (err) => {
        let msg = "Gagal mengambil lokasi.";
        if (err.code === 1) msg = "Izin lokasi ditolak. Buka Pengaturan Safari lalu izinkan lokasi untuk web ini.";
        if (err.code === 2) msg = "Sinyal GPS tidak ditemukan.";
        if (err.code === 3) msg = "Waktu pengambilan lokasi habis (timeout).";
        setError(msg);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    // Otomatis minta lokasi saat halaman dibuka
    requestLocation();
  }, []);

  const handleAbsen = async () => {
    if (!user || !user.schoolId || !user.nisn) {
      setError("Data sesi tidak lengkap. Silakan login ulang.");
      return;
    }
    if (!location) {
      setError("Tunggu sampai lokasi ditemukan terlebih dahulu.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const today = new Date();
      // Format YYYY-MM-DD
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      
      const attendanceRef = ref(rtdb, `gas/schools/${user.schoolId}/attendances/${dateStr}/students/${user.nisn}`);
      
      await set(attendanceRef, {
        timestamp: serverTimestamp(),
        lat: location.lat,
        lng: location.lng,
        status: "Hadir",
        platform: "Web-iOS", // Tandai bahwa ini dari PWA iOS
        method: "gps",
      });

      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan presensi.");
    } finally {
      setSubmitting(false);
    }
  };

  const getDayName = () => {
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    return days[new Date().getDay()];
  };

  return (
    <div className="min-h-dvh bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-slate-950 px-6 pt-12 pb-16 text-white rounded-b-[40px] shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-transparent to-transparent"></div>
        <div className="relative z-10 text-center">
          <h1 className="text-2xl font-bold">Presensi Sekolah</h1>
          <p className="mt-1 text-sm text-indigo-200">
            {getDayName()}, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Card Utama */}
      <div className="px-5 -mt-10 relative z-20">
        <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/50 border border-slate-100">
          
          <div className="flex flex-col items-center justify-center py-4">
            <div className={`flex h-20 w-20 items-center justify-center rounded-full shadow-lg ${
              success ? "bg-emerald-500 shadow-emerald-500/30" : 
              location ? "bg-indigo-500 shadow-indigo-500/30" : 
              "bg-slate-100 shadow-none border-2 border-dashed border-slate-300"
            }`}>
              {success ? (
                <ShieldCheck className="h-10 w-10 text-white" />
              ) : location ? (
                <MapPin className="h-10 w-10 text-white" />
              ) : (
                <Navigation className={`h-8 w-8 text-slate-400 ${locating ? "animate-spin" : ""}`} />
              )}
            </div>
            
            <h2 className="mt-4 text-lg font-bold text-slate-800">
              {success ? "Presensi Berhasil!" : location ? "Lokasi Ditemukan" : "Mencari Titik Lokasi..."}
            </h2>
            
            <p className="mt-1 text-center text-sm text-slate-500 px-4">
              {success 
                ? "Data kehadiran Anda hari ini sudah tersimpan di sistem sekolah."
                : location 
                  ? "Sistem siap merekam kehadiran Anda. Pastikan Anda berada di area sekolah."
                  : "Mohon tunggu atau pastikan izin lokasi di browser Anda sudah aktif."}
            </p>
          </div>

          {/* Koordinat Info */}
          {location && !success && (
            <div className="mt-4 rounded-2xl bg-indigo-50 p-4 border border-indigo-100 flex items-start">
              <MapPin className="h-5 w-5 text-indigo-600 mt-0.5 mr-3 shrink-0" />
              <div>
                <p className="text-xs font-bold text-indigo-900">Koordinat Saat Ini</p>
                <p className="text-xs text-indigo-700 font-mono mt-0.5">
                  {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mt-4 rounded-2xl bg-rose-50 p-4 border border-rose-100 flex items-start">
              <AlertTriangle className="h-5 w-5 text-rose-600 mt-0.5 mr-3 shrink-0" />
              <div>
                <p className="text-xs font-bold text-rose-900">Gagal Membaca Lokasi</p>
                <p className="text-xs text-rose-700 mt-0.5">{error}</p>
                {!locating && (
                  <button 
                    onClick={requestLocation}
                    className="mt-2 text-xs font-semibold text-rose-600 hover:text-rose-800 underline"
                  >
                    Coba Lagi
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tombol Aksi */}
          <div className="mt-8">
            {!success ? (
              <button
                onClick={handleAbsen}
                disabled={!location || submitting || locating}
                className="w-full rounded-2xl bg-slate-900 px-4 py-4 text-sm font-bold text-white shadow-xl shadow-slate-900/20 transition-all hover:bg-slate-800 active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:active:scale-100"
              >
                {submitting ? (
                  "Mengirim Data..."
                ) : locating ? (
                  "Membaca Sensor..."
                ) : (
                  <>
                    <Clock className="mr-2 h-5 w-5" /> REKAM KEHADIRAN
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => window.location.assign("/siswa")}
                className="w-full rounded-2xl bg-slate-100 px-4 py-4 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
              >
                Kembali ke Beranda
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Disclaimer Proteksi */}
      <div className="px-8 mt-8 text-center">
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Sistem absen iOS ini berdiri sendiri dan tidak terikat dengan Proteksi EduLock. Kehadiran akan ditandai dengan label <span className="font-semibold text-slate-500">Web-iOS</span> di dashboard admin.
        </p>
      </div>
    </div>
  );
}
