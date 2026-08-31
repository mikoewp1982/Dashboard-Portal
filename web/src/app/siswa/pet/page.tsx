"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Star,
  ShoppingCart,
  Smile,
  ThumbsUp,
  Heart,
  Lightbulb,
  Users,
  Trophy,
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

export default function SahabatBelajarScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [pet, setPet] = useState<StudentVirtualPet | null>(null);
  const [readingMillis, setReadingMillis] = useState(0);
  const [habitsCount, setHabitsCount] = useState(0);
  const [prayerStatus, setPrayerStatus] = useState<string | null>(null);
  const [disciplinePenalty, setDisciplinePenalty] = useState(0);
  const [activeTab, setActiveTab] = useState<"tugas" | "pencapaian" | "peringkat">("tugas");

  const todayStr = getTodayDateStr();

  // Listen to realtime stats
  useEffect(() => {
    if (!user || !user.nisn) return;
    const studentId = user.nisn;
    const schoolId = user.schoolId || "";

    const unsubPet = listenVirtualPet(studentId, schoolId, (p) => setPet(p));
    const unsubReading = listenReadingDuration(studentId, todayStr, (m) => setReadingMillis(m));
    const unsubHabits = listen7HabitsLogs(studentId, schoolId, (logs) => {
      const todayLog = logs[todayStr]?.habits || {};
      const count = Object.values(todayLog).filter(Boolean).length;
      setHabitsCount(count);
    });
    const unsubPrayer = listenPrayerRecord(studentId, schoolId, todayStr, (rec) => {
      setPrayerStatus(rec?.status || null);
    });
    const unsubDiscipline = listenDisciplineRecords(studentId, schoolId, (_, pen) => {
      setDisciplinePenalty(pen);
    });

    return () => {
      unsubPet();
      unsubReading();
      unsubHabits();
      unsubPrayer();
      unsubDiscipline();
    };
  }, [user, todayStr]);

  // Vitals Calculation
  const readingMinutes = Math.floor(readingMillis / 60000);
  const calculatedKenyang = Math.min(100, Math.round((readingMinutes / 30) * 100));
  const calculatedEnergi = Math.min(100, Math.round((habitsCount / 7) * 100));
  const calculatedKesehatan =
    prayerStatus === "PRAY" || prayerStatus === "PERMIT" || prayerStatus === "HALANGAN" ? 100 : 0;
  const calculatedKebahagiaan = Math.max(0, Math.min(100, 100 - disciplinePenalty));
  const calculatedKecerdasan = 79; // Matches Android screenshot baseline
  const calculatedSosial = 75; // Matches Android screenshot baseline

  // Status check
  const lowestVital = Math.min(
    calculatedKenyang,
    calculatedEnergi,
    calculatedKesehatan,
    calculatedKebahagiaan
  );
  const isSekarat = lowestVital <= 20;

  const currentLevel = pet?.level || 3;
  const currentXp = pet?.experiencePoints || 65;
  const maxXp = 300;
  const coins = pet?.coins || 810;

  // Check 15:00 cutoff for prayer status label
  const now = new Date();
  const isPast15 = now.getHours() >= 15;
  const prayerStatusLabel =
    prayerStatus === "PRAY"
      ? "Sudah Sholat (100%)"
      : isPast15
      ? "Status: Lewat waktu (15:00)"
      : "Status: Belum Sholat (0%)";

  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#12D6C6] via-[#0F7BFF] to-[#0F2A43] pb-24 text-white">
      {/* Top Bar Header (Matches Screenshot 3) */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-[#0F2A43] to-[#0F7BFF] px-4 pt-12 pb-4 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/siswa")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white hover:bg-white/25 active:scale-95 transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold tracking-tight">Sahabat Belajar</h1>
        </div>

        {/* Star Coin Pill Badge */}
        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FBBF24] text-slate-900 font-bold text-xs shadow-md">
          <Star className="h-3.5 w-3.5 fill-slate-900" />
          <span>{coins}</span>
        </div>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto space-y-4">
        {/* Level Bar & XP */}
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between text-xs font-bold">
            <span className="text-xl text-white">Level {currentLevel}</span>
            <span className="text-cyan-200 font-mono text-[11px]">
              {currentXp}/{maxXp} XP
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#0A1D30]">
            <div
              className="h-full rounded-full bg-cyan-300 transition-all duration-500"
              style={{ width: `${Math.min(100, (currentXp / maxXp) * 100)}%` }}
            />
          </div>
        </div>

        {/* 6 VITALS GRID (Matches Screenshot 3) */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* 1. Kenyang */}
          <div className="rounded-2xl bg-[#0B1F33]/70 backdrop-blur-md border border-white/15 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <ShoppingCart className="h-3.5 w-3.5 text-emerald-400" /> Kenyang
              </span>
              <span className="font-mono font-bold text-white text-[11px]">{calculatedKenyang}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                style={{ width: `${calculatedKenyang}%` }}
              />
            </div>
          </div>

          {/* 2. Kebahagiaan */}
          <div className="rounded-2xl bg-[#0B1F33]/70 backdrop-blur-md border border-white/15 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-pink-400 font-bold">
                <Smile className="h-3.5 w-3.5 text-pink-400" /> Kebahagiaan
              </span>
              <span className="font-mono font-bold text-white text-[11px]">{calculatedKebahagiaan}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-pink-400 transition-all duration-500"
                style={{ width: `${calculatedKebahagiaan}%` }}
              />
            </div>
          </div>

          {/* 3. Energi */}
          <div className="rounded-2xl bg-[#0B1F33]/70 backdrop-blur-md border border-white/15 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                <ThumbsUp className="h-3.5 w-3.5 text-amber-400" /> Energi
              </span>
              <span className="font-mono font-bold text-white text-[11px]">{calculatedEnergi}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-amber-400 transition-all duration-500"
                style={{ width: `${calculatedEnergi}%` }}
              />
            </div>
          </div>

          {/* 4. Kesehatan */}
          <div className="rounded-2xl bg-[#0B1F33]/70 backdrop-blur-md border border-white/15 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-sky-400 font-bold">
                <Heart className="h-3.5 w-3.5 text-sky-400 fill-sky-400" /> Kesehatan
              </span>
              <span className="font-mono font-bold text-white text-[11px]">{calculatedKesehatan}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-sky-400 transition-all duration-500"
                style={{ width: `${calculatedKesehatan}%` }}
              />
            </div>
          </div>

          {/* 5. Kecerdasan */}
          <div className="rounded-2xl bg-[#0B1F33]/70 backdrop-blur-md border border-white/15 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-purple-400 font-bold">
                <Lightbulb className="h-3.5 w-3.5 text-purple-400" /> Kecerdasan
              </span>
              <span className="font-mono font-bold text-white text-[11px]">{calculatedKecerdasan}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-purple-400 transition-all duration-500"
                style={{ width: `${calculatedKecerdasan}%` }}
              />
            </div>
          </div>

          {/* 6. Sosial */}
          <div className="rounded-2xl bg-[#0B1F33]/70 backdrop-blur-md border border-white/15 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-teal-400 font-bold">
                <Users className="h-3.5 w-3.5 text-teal-400" /> Sosial
              </span>
              <span className="font-mono font-bold text-white text-[11px]">{calculatedSosial}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-teal-400 transition-all duration-500"
                style={{ width: `${calculatedSosial}%` }}
              />
            </div>
          </div>
        </div>

        {/* PET DISPLAY STAGE CARD (Matches Screenshot 3) */}
        <div
          className={`rounded-3xl p-6 border text-center relative overflow-hidden transition-all ${
            isSekarat
              ? "bg-[#0B1F33]/40 border-red-500/60 shadow-xl"
              : "bg-[#0B1F33]/40 border-white/20 shadow-xl"
          }`}
        >
          {/* Centered Pill Badge */}
          <div className="flex justify-center mb-3">
            <span className="inline-flex items-center rounded-full bg-red-600 px-4 py-1 text-xs font-black text-white shadow-md uppercase tracking-wider">
              SEKARAT
            </span>
          </div>

          {/* Sleeping Cat SVG Illustration (Exact match to Screenshot 3) */}
          <div className="relative h-32 flex items-center justify-center my-1">
            <svg viewBox="0 0 200 130" className="h-28 w-auto filter drop-shadow-md">
              {/* Floating stars */}
              <text x="50" y="45" fill="#FDA4AF" fontSize="16">✦</text>
              <text x="80" y="30" fill="#FDA4AF" fontSize="16">✦</text>
              <text x="140" y="40" fill="#FDA4AF" fontSize="14">✦</text>

              {/* Cat Body */}
              <ellipse cx="105" cy="85" rx="55" ry="32" fill="#F97316" stroke="#C2410C" strokeWidth="2" />
              {/* Cat Tail */}
              <path d="M155 85 Q175 80 170 95" stroke="#F97316" strokeWidth="10" strokeLinecap="round" fill="none" />
              <path d="M155 85 Q175 80 170 95" stroke="#C2410C" strokeWidth="2" strokeLinecap="round" fill="none" />

              {/* Cat Head */}
              <ellipse cx="65" cy="78" rx="28" ry="24" fill="#F97316" stroke="#C2410C" strokeWidth="2" />
              {/* Ears */}
              <path d="M50 60 L45 42 L62 55 Z" fill="#F97316" stroke="#C2410C" strokeWidth="2" />
              <path d="M72 56 L85 42 L82 62 Z" fill="#F97316" stroke="#C2410C" strokeWidth="2" />

              {/* Closed Sleepy Eyes */}
              <path d="M52 75 Q58 82 64 75" stroke="#7C2D12" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M68 76 Q74 83 80 76" stroke="#7C2D12" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              {/* Nose & Mouth */}
              <ellipse cx="66" cy="84" rx="2.5" ry="2" fill="#7C2D12" />
              {/* Tear / Sweat */}
              <ellipse cx="50" cy="84" rx="2" ry="4" fill="#67E8F9" />
            </svg>
          </div>

          {/* Student Name */}
          <p className="text-xs font-bold text-white tracking-wide uppercase mt-1">
            {user?.name || "TESTER SISWA DEMO"}
          </p>
        </div>

        {/* 3 TABS (Matches Screenshot 3) */}
        <div className="flex border-b border-white/20">
          <button
            type="button"
            onClick={() => setActiveTab("tugas")}
            className={`py-2.5 px-4 text-xs font-bold transition border-b-2 ${
              activeTab === "tugas"
                ? "border-cyan-300 text-white"
                : "border-transparent text-cyan-200/70 hover:text-white"
            }`}
          >
            Tugas Harian
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("pencapaian")}
            className={`py-2.5 px-4 text-xs font-bold transition border-b-2 ${
              activeTab === "pencapaian"
                ? "border-cyan-300 text-white"
                : "border-transparent text-cyan-200/70 hover:text-white"
            }`}
          >
            Pencapaian
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("peringkat")}
            className={`py-2.5 px-4 text-xs font-bold transition border-b-2 ${
              activeTab === "peringkat"
                ? "border-cyan-300 text-white"
                : "border-transparent text-cyan-200/70 hover:text-white"
            }`}
          >
            Peringkat
          </button>
        </div>

        {/* TAB 1: TUGAS HARIAN (4 ACTION CARDS IN 2X2 GRID) */}
        {activeTab === "tugas" && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Card 1: Kehadiran */}
            <Link
              href="/siswa/absen"
              className="rounded-3xl bg-[#0B1F33]/70 backdrop-blur-md border border-white/15 p-4 space-y-3 hover:border-pink-300 transition active:scale-[0.98] block shadow-lg"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-500/20 text-pink-400">
                  <Smile className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Kehadiran</h3>
                  <p className="text-[10px] text-cyan-200/70">Absensi sekolah harian</p>
                </div>
              </div>
              <div className="border-t border-white/10 pt-2 text-[11px] text-cyan-100/90 leading-tight">
                <p>Absensi: Belum ada • Tanpa penalti</p>
              </div>
            </Link>

            {/* Card 2: Ibadah */}
            <Link
              href="/siswa/sholat"
              className="rounded-3xl bg-[#0B1F33]/70 backdrop-blur-md border border-white/15 p-4 space-y-3 hover:border-sky-300 transition active:scale-[0.98] block shadow-lg"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-400">
                  <Heart className="h-5 w-5 fill-sky-400" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Ibadah</h3>
                  <p className="text-[10px] text-cyan-200/70">Presensi sholat</p>
                </div>
              </div>
              <div className="border-t border-white/10 pt-2 text-[11px] text-cyan-100/90 leading-tight">
                <p>{prayerStatusLabel}</p>
              </div>
            </Link>

            {/* Card 3: 7KAIH */}
            <Link
              href="/siswa/7kaih"
              className="rounded-3xl bg-[#0B1F33]/70 backdrop-blur-md border border-white/15 p-4 space-y-3 hover:border-amber-300 transition active:scale-[0.98] block shadow-lg"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400">
                  <ThumbsUp className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">7KAIH</h3>
                  <p className="text-[10px] text-cyan-200/70">Kebiasaan baik harian</p>
                </div>
              </div>
              <div className="border-t border-white/10 pt-2 text-[11px] text-cyan-100/90 leading-tight">
                <p>{habitsCount}/7 kebiasaan terisi</p>
              </div>
            </Link>

            {/* Card 4: E-Perpus */}
            <Link
              href="/siswa/lentera"
              className="rounded-3xl bg-[#0B1F33]/70 backdrop-blur-md border border-white/15 p-4 space-y-3 hover:border-emerald-300 transition active:scale-[0.98] block shadow-lg"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">E-Perpus</h3>
                  <p className="text-[10px] text-cyan-200/70">Baca buku untuk kenyang</p>
                </div>
              </div>
              <div className="border-t border-white/10 pt-2 text-[11px] text-cyan-100/90 leading-tight">
                <p>{readingMinutes}/30 menit membaca hari ini</p>
              </div>
            </Link>
          </div>
        )}

        {/* TAB 2: PENCAPAIAN */}
        {activeTab === "pencapaian" && (
          <div className="space-y-3 pt-1">
            {[
              { title: "Kutu Buku", desc: "Membaca minimal 30 menit di Lentera Digital", xp: "+50 XP", done: readingMinutes >= 30 },
              { title: "Rajin Ibadah", desc: "Presensi Sholat Dzuhur tepat waktu", xp: "+100 XP", done: prayerStatus === "PRAY" },
              { title: "Hebat 7 KAIH", desc: "Mengisi 7 kebiasaan penuh hari ini", xp: "+75 XP", done: habitsCount === 7 },
              { title: "Bintang Disiplin", desc: "Tanpa catatan pelanggaran tata tertib", xp: "+150 XP", done: true },
            ].map((ach, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 rounded-3xl bg-[#0B1F33]/70 backdrop-blur-md border border-white/15"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                      ach.done ? "bg-amber-400 text-slate-900" : "bg-white/10 text-white/50"
                    }`}
                  >
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{ach.title}</h4>
                    <p className="text-[10px] text-cyan-200/70">{ach.desc}</p>
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
          <div className="space-y-2.5 pt-1">
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
                    ? "bg-cyan-500/30 border-cyan-300 shadow-md"
                    : "bg-[#0B1F33]/70 border-white/10"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base font-black w-6 text-center">{st.avatar}</span>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      {st.name} {st.isMe && <span className="text-[10px] text-cyan-300">(Kamu)</span>}
                    </h4>
                    <p className="text-[10px] text-cyan-200/70">Kelas {st.class}</p>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-xs font-black text-amber-300">Level {st.level}</span>
                  <span className="text-[10px] text-cyan-200/50 block">{st.xp} XP</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
