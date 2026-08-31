"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Star,
  Sparkles,
  Heart,
  Smile,
  Zap,
  BookOpen,
  Users,
  Brain,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  Trophy,
  Award,
  Flame,
  CheckCircle2,
  Clock,
  Utensils,
  Moon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import {
  listenVirtualPet,
  listenPrayerRecord,
  listen7HabitsLogs,
  listenReadingDuration,
  listenDisciplineRecords,
  getTodayDateStr,
  type StudentVirtualPet,
} from "@/lib/siswa/studentDataService";

export default function VirtualPetPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [pet, setPet] = useState<StudentVirtualPet | null>(null);
  const [readingMillis, setReadingMillis] = useState(0);
  const [habitsCount, setHabitsCount] = useState(0);
  const [prayerStatus, setPrayerStatus] = useState<string | null>(null);
  const [disciplinePenalty, setDisciplinePenalty] = useState(0);
  const [activeTab, setActiveTab] = useState<"tugas" | "pencapaian" | "peringkat">("tugas");
  const [loading, setLoading] = useState(true);

  const todayStr = getTodayDateStr();

  // Listen to all relevant realtime sources for Vitals calculation
  useEffect(() => {
    if (!user || !user.nisn) {
      setLoading(false);
      return;
    }
    const studentId = user.nisn;
    const schoolId = user.schoolId || "";

    const unsubPet = listenVirtualPet(studentId, schoolId, (p) => {
      setPet(p);
      setLoading(false);
    });

    const unsubReading = listenReadingDuration(studentId, todayStr, (millis) => {
      setReadingMillis(millis);
    });

    const unsubHabits = listen7HabitsLogs(studentId, schoolId, (logs) => {
      const todayLog = logs[todayStr]?.habits || {};
      const count = Object.values(todayLog).filter(Boolean).length;
      setHabitsCount(count);
    });

    const unsubPrayer = listenPrayerRecord(studentId, schoolId, todayStr, (rec) => {
      setPrayerStatus(rec?.status || null);
    });

    const unsubDiscipline = listenDisciplineRecords(studentId, schoolId, (_, penalty) => {
      setDisciplinePenalty(penalty);
    });

    return () => {
      unsubPet();
      unsubReading();
      unsubHabits();
      unsubPrayer();
      unsubDiscipline();
    };
  }, [user, todayStr]);

  // Vitals Calculation (Option B rules)
  // 1. Kenyang (E-Perpus reading duration: 30 minutes = 100%)
  const readingMinutes = Math.floor(readingMillis / 60000);
  const calculatedKenyang = Math.min(100, Math.round((readingMinutes / 30) * 100));

  // 2. Energi (7 KAIH: 7 habits = 100%)
  const calculatedEnergi = Math.min(100, Math.round((habitsCount / 7) * 100));

  // 3. Kesehatan (Sholat: 100% if prayed/permit/halangan, 0% if pending)
  const calculatedKesehatan = prayerStatus === "PRAY" || prayerStatus === "PERMIT" || prayerStatus === "HALANGAN" ? 100 : 0;

  // 4. Kebahagiaan (Attendance baseline 100 - discipline penalties)
  const calculatedKebahagiaan = Math.max(0, Math.min(100, 100 - disciplinePenalty));

  // 5. Kecerdasan & Sosial
  const calculatedKecerdasan = Math.min(100, 50 + Math.round(readingMinutes * 1.5));
  const calculatedSosial = Math.min(100, 50 + habitsCount * 7);

  // Overall Status
  const lowestVital = Math.min(calculatedKenyang, calculatedEnergi, calculatedKesehatan, calculatedKebahagiaan);
  const isSekarat = lowestVital <= 20;
  const isSedih = lowestVital > 20 && lowestVital < 60;
  const isBahagia = lowestVital >= 80;

  const currentLevel = pet?.level || 3;
  const currentXp = pet?.experiencePoints || 65;
  const maxXp = currentLevel * 100;
  const xpPercent = Math.min(100, Math.round((currentXp / maxXp) * 100));
  const coins = pet?.coins || 810;

  const getPetStatusBadge = () => {
    if (isSekarat) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-3.5 py-1 text-xs font-black text-white shadow-md uppercase tracking-wider animate-pulse">
          SEKARAT
        </span>
      );
    }
    if (isSedih) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-3.5 py-1 text-xs font-black text-white shadow-md uppercase tracking-wider">
          SEDIH
        </span>
      );
    }
    if (isBahagia) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3.5 py-1 text-xs font-black text-white shadow-md uppercase tracking-wider">
          BAHAGIA
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500 px-3.5 py-1 text-xs font-black text-white shadow-md uppercase tracking-wider">
        SEHAT
      </span>
    );
  };

  return (
    <div className="min-h-dvh bg-gradient-to-b from-sky-500 via-blue-600 to-indigo-900 pb-24 text-white">
      {/* Top Bar */}
      <div className="px-4 pt-12 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/siswa")}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur text-white hover:bg-white/30 active:scale-95 transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-black tracking-tight">Sahabat Belajar</h1>
        </div>

        {/* Coin / Star Pill */}
        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-400 text-slate-900 font-black text-sm shadow-md">
          <Star className="h-4 w-4 fill-slate-900" />
          <span>{coins}</span>
        </div>
      </div>

      <div className="px-4 py-2 max-w-2xl mx-auto space-y-4">
        {/* Level & XP Header */}
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-2xl font-black text-white">Level {currentLevel}</span>
            <span className="font-mono font-bold text-sky-200">
              {currentXp}/{maxXp} XP
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-900/40 backdrop-blur">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-300 to-white transition-all duration-500"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>

        {/* 6 VITALS GRID */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* 1. Kenyang */}
          <div className="rounded-2xl bg-slate-900/60 backdrop-blur border border-white/15 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Utensils className="h-3.5 w-3.5" /> Kenyang
              </span>
              <span className="font-mono font-bold text-white">{calculatedKenyang}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                style={{ width: `${calculatedKenyang}%` }}
              />
            </div>
          </div>

          {/* 2. Kebahagiaan */}
          <div className="rounded-2xl bg-slate-900/60 backdrop-blur border border-white/15 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-pink-400 font-bold">
                <Smile className="h-3.5 w-3.5" /> Kebahagiaan
              </span>
              <span className="font-mono font-bold text-white">{calculatedKebahagiaan}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-pink-400 transition-all duration-500"
                style={{ width: `${calculatedKebahagiaan}%` }}
              />
            </div>
          </div>

          {/* 3. Energi */}
          <div className="rounded-2xl bg-slate-900/60 backdrop-blur border border-white/15 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                <Zap className="h-3.5 w-3.5" /> Energi
              </span>
              <span className="font-mono font-bold text-white">{calculatedEnergi}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-amber-400 transition-all duration-500"
                style={{ width: `${calculatedEnergi}%` }}
              />
            </div>
          </div>

          {/* 4. Kesehatan */}
          <div className="rounded-2xl bg-slate-900/60 backdrop-blur border border-white/15 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-sky-400 font-bold">
                <Heart className="h-3.5 w-3.5" /> Kesehatan
              </span>
              <span className="font-mono font-bold text-white">{calculatedKesehatan}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-sky-400 transition-all duration-500"
                style={{ width: `${calculatedKesehatan}%` }}
              />
            </div>
          </div>

          {/* 5. Kecerdasan */}
          <div className="rounded-2xl bg-slate-900/60 backdrop-blur border border-white/15 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-purple-400 font-bold">
                <Brain className="h-3.5 w-3.5" /> Kecerdasan
              </span>
              <span className="font-mono font-bold text-white">{calculatedKecerdasan}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-purple-400 transition-all duration-500"
                style={{ width: `${calculatedKecerdasan}%` }}
              />
            </div>
          </div>

          {/* 6. Sosial */}
          <div className="rounded-2xl bg-slate-900/60 backdrop-blur border border-white/15 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-teal-400 font-bold">
                <Users className="h-3.5 w-3.5" /> Sosial
              </span>
              <span className="font-mono font-bold text-white">{calculatedSosial}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-teal-400 transition-all duration-500"
                style={{ width: `${calculatedSosial}%` }}
              />
            </div>
          </div>
        </div>

        {/* PET STAGE DISPLAY CARD */}
        <div
          className={`relative rounded-3xl p-6 border text-center overflow-hidden transition-all duration-300 ${
            isSekarat
              ? "bg-red-950/40 border-red-500/60 shadow-xl shadow-red-950/50"
              : "bg-slate-900/40 border-white/20 shadow-xl"
          }`}
        >
          {/* Status Badge Centered */}
          <div className="flex justify-center mb-3">{getPetStatusBadge()}</div>

          {/* Interactive SVG Pet Character */}
          <div className="relative h-36 flex items-center justify-center my-2">
            {isSekarat ? (
              // Sekarat / Tired Sleeping Pet SVG
              <svg viewBox="0 0 160 120" className="h-28 w-auto filter drop-shadow-lg animate-pulse">
                <ellipse cx="80" cy="80" rx="55" ry="32" fill="#F97316" />
                <circle cx="120" cy="72" r="24" fill="#EA580C" />
                <path d="M125 50 L135 38 L140 54 Z" fill="#C2410C" />
                <path d="M110 52 L115 39 L122 53 Z" fill="#C2410C" />
                {/* Sleeping Face */}
                <path d="M116 70 Q122 75 128 70" stroke="#7C2D12" strokeWidth="2.5" fill="none" />
                <path d="M130 68 Q135 73 140 68" stroke="#7C2D12" strokeWidth="2.5" fill="none" />
                {/* Sweat / Zzz */}
                <text x="135" y="42" fill="#FEF08A" fontSize="14" fontWeight="bold">
                  zZ
                </text>
                <text x="50" y="55" fill="#FDE047" fontSize="18">
                  ✨
                </text>
              </svg>
            ) : isSedih ? (
              // Sad Pet SVG
              <svg viewBox="0 0 140 140" className="h-28 w-auto filter drop-shadow-lg">
                <circle cx="70" cy="75" r="48" fill="#F59E0B" />
                <path d="M40 38 L55 24 L62 45 Z" fill="#D97706" />
                <path d="M100 38 L85 24 L78 45 Z" fill="#D97706" />
                {/* Sad Face */}
                <circle cx="55" cy="70" r="5" fill="#78350F" />
                <circle cx="85" cy="70" r="5" fill="#78350F" />
                <path d="M58 92 Q70 82 82 92" stroke="#78350F" strokeWidth="3" fill="none" />
                <ellipse cx="90" cy="80" rx="3" ry="5" fill="#67E8F9" />
              </svg>
            ) : (
              // Happy / Healthy Jumping Pet SVG
              <svg viewBox="0 0 140 140" className="h-32 w-auto filter drop-shadow-2xl animate-bounce">
                <circle cx="70" cy="75" r="48" fill="#F97316" />
                <path d="M40 38 L55 20 L65 44 Z" fill="#EA580C" />
                <path d="M100 38 L85 20 L75 44 Z" fill="#EA580C" />
                {/* Cheerful Face */}
                <circle cx="52" cy="68" r="6" fill="#7C2D12" />
                <circle cx="88" cy="68" r="6" fill="#7C2D12" />
                <circle cx="50" cy="66" r="2" fill="#FFFFFF" />
                <circle cx="86" cy="66" r="2" fill="#FFFFFF" />
                <circle cx="44" cy="76" r="7" fill="#FECDD3" opacity="0.8" />
                <circle cx="96" cy="76" r="7" fill="#FECDD3" opacity="0.8" />
                <path d="M58 80 Q70 94 82 80" stroke="#7C2D12" strokeWidth="3" fill="#7C2D12" />
              </svg>
            )}
          </div>

          <p className="text-xs font-bold text-sky-200 tracking-wider uppercase">
            {user?.name || "TESTER SISWA DEMO"}
          </p>
        </div>

        {/* 3 TABS (TUGAS HARIAN | PENCAPAIAN | PERINGKAT) */}
        <div className="flex border-b border-white/20">
          <button
            type="button"
            onClick={() => setActiveTab("tugas")}
            className={`flex-1 py-2.5 text-xs font-bold transition border-b-2 ${
              activeTab === "tugas"
                ? "border-white text-white"
                : "border-transparent text-white/60 hover:text-white/80"
            }`}
          >
            Tugas Harian
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("pencapaian")}
            className={`flex-1 py-2.5 text-xs font-bold transition border-b-2 ${
              activeTab === "pencapaian"
                ? "border-white text-white"
                : "border-transparent text-white/60 hover:text-white/80"
            }`}
          >
            Pencapaian
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("peringkat")}
            className={`flex-1 py-2.5 text-xs font-bold transition border-b-2 ${
              activeTab === "peringkat"
                ? "border-white text-white"
                : "border-transparent text-white/60 hover:text-white/80"
            }`}
          >
            Peringkat
          </button>
        </div>

        {/* TAB 1: TUGAS HARIAN (4 ACTION CARDS) */}
        {activeTab === "tugas" && (
          <div className="space-y-3 pt-1">
            <span className="text-[11px] font-bold text-sky-200 uppercase tracking-wider block">
              Status Aktivitas Hari Ini
            </span>

            <div className="grid grid-cols-2 gap-3">
              {/* Card 1: Kehadiran */}
              <Link
                href="/siswa/absen"
                className="rounded-3xl bg-slate-900/60 backdrop-blur border border-white/15 p-4 space-y-3 hover:border-pink-300 transition active:scale-[0.98] block"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-500/20 text-pink-400">
                    <Smile className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Kehadiran</h3>
                    <p className="text-[10px] text-white/60">Absensi harian</p>
                  </div>
                </div>
                <div className="border-t border-white/10 pt-2 text-[11px] text-white/80">
                  <p>Absensi: Tercatat • Tanpa penalti</p>
                </div>
              </Link>

              {/* Card 2: Ibadah */}
              <Link
                href="/siswa/sholat"
                className="rounded-3xl bg-slate-900/60 backdrop-blur border border-white/15 p-4 space-y-3 hover:border-sky-300 transition active:scale-[0.98] block"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-400">
                    <Heart className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Ibadah</h3>
                    <p className="text-[10px] text-white/60">Presensi sholat</p>
                  </div>
                </div>
                <div className="border-t border-white/10 pt-2 text-[11px] text-white/80">
                  <p>
                    Status:{" "}
                    {calculatedKesehatan === 100
                      ? "Sudah Sholat (100%)"
                      : "Belum Sholat (0%)"}
                  </p>
                </div>
              </Link>

              {/* Card 3: 7 KAIH */}
              <Link
                href="/siswa/7kaih"
                className="rounded-3xl bg-slate-900/60 backdrop-blur border border-white/15 p-4 space-y-3 hover:border-amber-300 transition active:scale-[0.98] block"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">7 KAIH</h3>
                    <p className="text-[10px] text-white/60">Kebiasaan baik</p>
                  </div>
                </div>
                <div className="border-t border-white/10 pt-2 text-[11px] text-white/80">
                  <p>{habitsCount}/7 kebiasaan terisi</p>
                </div>
              </Link>

              {/* Card 4: E-Perpus */}
              <Link
                href="/siswa/lentera"
                className="rounded-3xl bg-slate-900/60 backdrop-blur border border-white/15 p-4 space-y-3 hover:border-emerald-300 transition active:scale-[0.98] block"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
                    <Utensils className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">E-Perpus</h3>
                    <p className="text-[10px] text-white/60">Baca buku kenyang</p>
                  </div>
                </div>
                <div className="border-t border-white/10 pt-2 text-[11px] text-white/80">
                  <p>{readingMinutes}/30 menit baca hari ini</p>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* TAB 2: PENCAPAIAN */}
        {activeTab === "pencapaian" && (
          <div className="space-y-3 pt-1">
            {[
              { title: "Kutu Buku Pemula", desc: "Membaca total 60 menit di Lentera Digital", progress: "45/60 menit", xp: "+50 XP", done: false },
              { title: "Ahli Ibadah", desc: "Presensi Sholat Dzuhur tepat waktu 5 hari berturut-turut", progress: "3/5 hari", xp: "+100 XP", done: false },
              { title: "Anak Hebat 7 KAIH", desc: "Menyelesaikan 7 kebiasaan penuh dalam 1 hari", progress: "1/1 hari", xp: "+75 XP", done: true },
              { title: "Disiplin Emas", desc: "Tanpa catatan pelanggaran selama 1 bulan", progress: "Aktif", xp: "+150 XP", done: true },
            ].map((ach, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 rounded-3xl bg-slate-900/60 backdrop-blur border border-white/15"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                      ach.done ? "bg-amber-400 text-slate-900" : "bg-white/10 text-white/50"
                    }`}
                  >
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">{ach.title}</h3>
                    <p className="text-[10px] text-white/60 leading-tight mt-0.5">{ach.desc}</p>
                    <span className="text-[10px] font-mono text-sky-300 font-bold mt-1 block">
                      {ach.progress}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-black text-amber-300 bg-amber-400/20 px-2.5 py-1 rounded-xl">
                  {ach.xp}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: PERINGKAT */}
        {activeTab === "peringkat" && (
          <div className="space-y-3 pt-1">
            {[
              { rank: 1, name: "Ahmad Fauzan", class: "7-A", level: 5, xp: 480, avatar: "🥇" },
              { rank: 2, name: "Nabila Putri", class: "7-B", level: 4, xp: 390, avatar: "🥈" },
              { rank: 3, name: user?.name || "TESTER SISWA DEMO", class: "7-Demo", level: currentLevel, xp: currentXp, avatar: "🥉", isMe: true },
              { rank: 4, name: "Rizky Ramadhan", class: "7-A", level: 3, xp: 210, avatar: "👤" },
              { rank: 5, name: "Siti Rahma", class: "7-C", level: 2, xp: 150, avatar: "👤" },
            ].map((st) => (
              <div
                key={st.rank}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition ${
                  st.isMe
                    ? "bg-sky-500/30 border-sky-400 shadow-md shadow-sky-900/50"
                    : "bg-slate-900/50 border-white/10"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base font-black w-6 text-center">{st.avatar}</span>
                  <div>
                    <h3 className="text-xs font-bold text-white">
                      {st.name} {st.isMe && <span className="text-[10px] text-sky-300 font-normal">(Kamu)</span>}
                    </h3>
                    <p className="text-[10px] text-white/60">Kelas {st.class}</p>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-xs font-black text-amber-300">Level {st.level}</span>
                  <span className="text-[10px] text-white/50 block">{st.xp} XP</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
