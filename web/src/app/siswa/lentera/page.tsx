"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Star,
  BookOpen,
  List,
  Heart,
  Edit3,
  User,
  Home,
  Clock,
  Play,
  Pause,
  X,
  Search,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import {
  listenReadingDuration,
  addReadingTime,
  getTodayDateStr,
} from "@/lib/siswa/studentDataService";

interface BookItem {
  id: string;
  title: string;
  author: string;
  category: string;
  coverColor: string;
  pages: number;
  description: string;
  content: string[];
}

const SAMPLE_BOOKS: BookItem[] = [
  {
    id: "b1",
    title: "Laskar Pelangi",
    author: "Andrea Hirata",
    category: "Fiksi & Sastra",
    coverColor: "from-amber-500 to-orange-600",
    pages: 34,
    description: "Kisah perjuangan sepuluh anak di Belitung dalam meraih pendidikan dan mimpi.",
    content: [
      "Halaman 1: Pagi itu, waktu masih amat pagi. Kabut masih menyelimuti dedaunan pohon filicium yang rindang di pekarangan sekolah SD Muhammadiyah Gantong...",
      "Halaman 2: Pak Harfan dan Bu Muslimah berdiri di depan pintu kelas. Wajah mereka tampak cemas menantikan murid kesepuluh agar sekolah tidak ditutup...",
      "Halaman 3: Tiba-tiba dari kejauhan tampak seorang ibu menggandeng anaknya yang berjalan pincang. Harun namanya...",
      "Halaman 4: Keberanian dan ketulusan belajar adalah lentera paling terang di tengah segala keterbatasan hidup...",
    ],
  },
  {
    id: "b2",
    title: "Sains & Alam Semesta",
    author: "Tim IPA Edukasi",
    category: "Sains & Teknologi",
    coverColor: "from-blue-600 to-indigo-700",
    pages: 28,
    description: "Menjelajahi rahasia tata surya, lubang hitam, dan keajaiban ekosistem bumi.",
    content: [
      "Halaman 1: Alam semesta memiliki miliaran galaksi yang masing-masing berisi ratusan miliar bintang dan planet...",
      "Halaman 2: Fotosintesis pada tumbuhan hijau adalah proses biologis luar biasa yang menghasilkan oksigen untuk kehidupan...",
      "Halaman 3: Gravitasi bumi menjaga atmosfer tetap stabil dan membuat kehidupan dapat berkembang dengan harmonis...",
    ],
  },
  {
    id: "b3",
    title: "Kisah Teladan Tokoh Bangsa",
    author: "Sejarah Nusantara",
    category: "Non-Fiksi",
    coverColor: "from-emerald-600 to-teal-700",
    pages: 25,
    description: "Belajar integritas, kegigihan, dan cinta tanah air dari para pahlawan nasional.",
    content: [
      "Halaman 1: Ki Hajar Dewantara mengajarkan 'Ing ngarsa sung tuladha, ing madya mangun karsa, tut wuri handayani'...",
      "Halaman 2: Mohammad Hatta dikenal dengan kejujuran mutlak dan kegemarannya membaca ribuan buku sepanjang hayat...",
      "Halaman 3: Generasi penerus berkewajiban merawat persatuan dalam keberagaman sebagai kekayaan luhur bangsa...",
    ],
  },
];

export default function LenteraDigitalScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [bottomNav, setBottomNav] = useState<"beranda" | "katalog" | "tugas" | "buku_saya" | "profil">("beranda");
  const [readingMillis, setReadingMillis] = useState(0);
  const [favoriteBookIds, setFavoriteBookIds] = useState<string[]>(["b1"]);
  const [activeBook, setActiveBook] = useState<BookItem | null>(null);
  const [readingPage, setReadingPage] = useState(0);
  const [isReadingActive, setIsReadingActive] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const todayStr = getTodayDateStr();

  // Listen to realtime reading duration
  useEffect(() => {
    if (!user || !user.nisn) return;
    const unsub = listenReadingDuration(user.nisn, todayStr, (millis) => {
      setReadingMillis(millis);
    });
    return () => unsub();
  }, [user, todayStr]);

  // Active reading timer
  useEffect(() => {
    let interval: any = null;
    if (isReadingActive && activeBook) {
      interval = setInterval(() => {
        setSessionSeconds((prev) => {
          const next = prev + 1;
          if (next % 30 === 0 && user?.nisn) {
            addReadingTime(user.nisn, todayStr, 30 * 1000);
          }
          return next;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isReadingActive, activeBook, user, todayStr]);

  const totalReadingMinutes = Math.floor((readingMillis + sessionSeconds * 1000) / 60000);
  const totalPoints = 60 + totalReadingMinutes * 2;
  const totalBooksRead = 1;

  const openBook = (book: BookItem) => {
    setActiveBook(book);
    setReadingPage(0);
    setIsReadingActive(true);
    setSessionSeconds(0);
  };

  const closeBook = async () => {
    if (sessionSeconds > 0 && user?.nisn) {
      const remainder = sessionSeconds % 30;
      if (remainder > 0) {
        await addReadingTime(user.nisn, todayStr, remainder * 1000);
      }
    }
    setIsReadingActive(false);
    setActiveBook(null);
    setSessionSeconds(0);
  };

  const toggleFavorite = (id: string) => {
    setFavoriteBookIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#12D6C6] via-[#0F7BFF] to-[#0F2A43] pb-28 text-white">
      {/* Top App Bar */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-[#0F2A43] to-[#0F7BFF] px-4 pt-12 pb-4 shadow-md flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/siswa")}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white hover:bg-white/25 active:scale-95 transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold tracking-tight">Lentera Digital</h1>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto space-y-5">
        {/* BERANDA TAB (Matches Screenshot 1) */}
        {bottomNav === "beranda" && (
          <>
            {/* Student Header */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-cyan-200 font-medium">Halo,</span>
                <h2 className="text-xl font-black tracking-tight text-white uppercase">
                  {user?.name || "TESTER SISWA DEMO"}
                </h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-400/20 border-2 border-cyan-300 text-cyan-200 text-lg font-black shadow-inner">
                {user?.name?.charAt(0).toUpperCase() || "T"}
              </div>
            </div>

            {/* Statistik Saya Card */}
            <div className="rounded-3xl bg-[#0B1F33]/40 backdrop-blur-md border border-white/20 p-5 shadow-xl space-y-3">
              <span className="text-xs font-semibold text-cyan-200 block">
                Statistik Saya
              </span>

              <div className="grid grid-cols-2 divide-x divide-white/15 text-center">
                <div className="space-y-0.5">
                  <span className="text-3xl font-black text-white">{totalPoints}</span>
                  <p className="text-[11px] text-cyan-100/70 font-medium">Total Poin</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-3xl font-black text-white">{totalBooksRead}</span>
                  <p className="text-[11px] text-cyan-100/70 font-medium">Buku Dibaca</p>
                </div>
              </div>
            </div>

            {/* Tantangan Bulan Ini Card */}
            <div className="rounded-3xl bg-[#0B1F33]/40 backdrop-blur-md border border-white/20 p-5 shadow-xl space-y-3">
              <span className="text-xs font-semibold text-cyan-200 block">
                Tantangan Bulan Ini
              </span>

              <div className="rounded-2xl bg-cyan-950/40 border border-cyan-400/20 p-4 space-y-3">
                <div className="flex items-start gap-2.5">
                  <Star className="h-5 w-5 text-cyan-400 shrink-0 fill-cyan-400 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Belum ada tantangan aktif</h3>
                    <p className="text-xs text-cyan-100/80 leading-relaxed mt-1">
                      Admin sekolah belum mengirim tugas literasi bulanan untuk kelas Anda, atau periode tugas belum dimulai.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setBottomNav("tugas")}
                  className="w-full rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 py-2.5 text-xs font-bold text-cyan-200 transition active:scale-[0.99]"
                >
                  Lihat Tugas
                </button>
              </div>
            </div>

            {/* Menu Cepat */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-cyan-200 block">
                Menu Cepat
              </span>

              <div className="grid grid-cols-2 gap-3.5">
                {/* Katalog Button */}
                <button
                  type="button"
                  onClick={() => setBottomNav("katalog")}
                  className="rounded-3xl bg-[#0B1F33]/40 backdrop-blur-md border border-white/20 p-6 flex flex-col items-center justify-center gap-2.5 hover:border-cyan-300 transition active:scale-[0.98] shadow-lg"
                >
                  <List className="h-7 w-7 text-cyan-300" />
                  <span className="text-xs font-bold text-white">Katalog</span>
                </button>

                {/* Buku Saya Button */}
                <button
                  type="button"
                  onClick={() => setBottomNav("buku_saya")}
                  className="rounded-3xl bg-[#0B1F33]/40 backdrop-blur-md border border-white/20 p-6 flex flex-col items-center justify-center gap-2.5 hover:border-pink-300 transition active:scale-[0.98] shadow-lg"
                >
                  <Heart className="h-7 w-7 text-pink-400 fill-pink-400/30" />
                  <span className="text-xs font-bold text-white">Buku Saya</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* KATALOG TAB */}
        {bottomNav === "katalog" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white">Katalog Buku Digital</h2>
              <span className="text-xs text-cyan-200">{SAMPLE_BOOKS.length} Buku Tersedia</span>
            </div>

            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-300" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari judul buku atau pengarang..."
                className="w-full rounded-2xl bg-[#0B1F33]/50 border border-white/20 py-2.5 pl-10 pr-4 text-xs text-white placeholder-cyan-200/50 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="space-y-3">
              {SAMPLE_BOOKS.filter((b) =>
                b.title.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((book) => (
                <div
                  key={book.id}
                  className="rounded-3xl bg-[#0B1F33]/40 backdrop-blur-md border border-white/20 p-4 flex items-center justify-between gap-3 hover:border-cyan-300 transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-16 w-12 rounded-xl bg-gradient-to-br ${book.coverColor} flex items-center justify-center text-white font-bold text-xs shadow-md shrink-0`}
                    >
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white line-clamp-1">{book.title}</h3>
                      <p className="text-[11px] text-cyan-200">{book.author}</p>
                      <span className="inline-block px-2 py-0.5 rounded-full bg-white/10 text-[9px] text-cyan-100 mt-1">
                        {book.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleFavorite(book.id)}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-pink-400"
                    >
                      <Heart
                        className={`h-4 w-4 ${favoriteBookIds.includes(book.id) ? "fill-pink-400" : ""}`}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => openBook(book)}
                      className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold text-xs shadow-md"
                    >
                      Baca
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TUGAS LITERASI TAB */}
        {bottomNav === "tugas" && (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-white">Tugas Literasi</h2>
            <div className="rounded-3xl bg-[#0B1F33]/40 backdrop-blur-md border border-white/20 p-8 text-center space-y-3">
              <Star className="h-12 w-12 mx-auto text-cyan-300" />
              <h3 className="text-sm font-bold text-white">Belum Ada Tugas Aktif</h3>
              <p className="text-xs text-cyan-100/80 max-w-xs mx-auto leading-relaxed">
                Tugas literasi dari guru atau admin sekolah akan ditampilkan di sini.
              </p>
            </div>
          </div>
        )}

        {/* BUKU SAYA TAB */}
        {bottomNav === "buku_saya" && (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-white">Buku Favorit Saya</h2>
            <div className="space-y-3">
              {SAMPLE_BOOKS.filter((b) => favoriteBookIds.includes(b.id)).map((book) => (
                <div
                  key={book.id}
                  className="rounded-3xl bg-[#0B1F33]/40 backdrop-blur-md border border-white/20 p-4 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-16 w-12 rounded-xl bg-gradient-to-br ${book.coverColor} flex items-center justify-center text-white font-bold text-xs shadow-md shrink-0`}
                    >
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{book.title}</h3>
                      <p className="text-[11px] text-cyan-200">{book.author}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openBook(book)}
                    className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-900 font-bold text-xs shadow-md"
                  >
                    Baca
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PROFIL TAB */}
        {bottomNav === "profil" && (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-white">Profil Literasi</h2>
            <div className="rounded-3xl bg-[#0B1F33]/40 backdrop-blur-md border border-white/20 p-6 space-y-4 text-center">
              <div className="h-20 w-20 mx-auto rounded-full bg-cyan-400/20 border-4 border-cyan-300 flex items-center justify-center text-3xl font-black text-cyan-200">
                {user?.name?.charAt(0).toUpperCase() || "T"}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{user?.name || "TESTER SISWA DEMO"}</h3>
                <p className="text-xs text-cyan-200">NISN: {user?.nisn || "999901"}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
                <div className="rounded-2xl bg-white/5 p-3">
                  <span className="text-xl font-bold text-white">{totalPoints}</span>
                  <p className="text-[10px] text-cyan-200">Poin Literasi</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-3">
                  <span className="text-xl font-bold text-white">{totalReadingMinutes} m</span>
                  <p className="text-[10px] text-cyan-200">Durasi Baca Hari Ini</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM NAVIGATION BAR (Matches Screenshot 1) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#0A1A2B]/95 backdrop-blur-lg border-t border-cyan-500/20 px-2 py-2">
        <div className="flex items-center justify-around max-w-lg mx-auto text-[10px] font-bold text-cyan-200/70">
          <button
            type="button"
            onClick={() => setBottomNav("beranda")}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-2xl transition ${
              bottomNav === "beranda"
                ? "bg-cyan-500/20 text-cyan-300 font-black"
                : "hover:text-white"
            }`}
          >
            <Home className="h-5 w-5" />
            <span>Beranda</span>
          </button>

          <button
            type="button"
            onClick={() => setBottomNav("katalog")}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-2xl transition ${
              bottomNav === "katalog"
                ? "bg-cyan-500/20 text-cyan-300 font-black"
                : "hover:text-white"
            }`}
          >
            <List className="h-5 w-5" />
            <span>Katalog</span>
          </button>

          <button
            type="button"
            onClick={() => setBottomNav("tugas")}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-2xl transition ${
              bottomNav === "tugas"
                ? "bg-cyan-500/20 text-cyan-300 font-black"
                : "hover:text-white"
            }`}
          >
            <Edit3 className="h-5 w-5" />
            <span>Tugas Literasi</span>
          </button>

          <button
            type="button"
            onClick={() => setBottomNav("buku_saya")}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-2xl transition ${
              bottomNav === "buku_saya"
                ? "bg-cyan-500/20 text-cyan-300 font-black"
                : "hover:text-white"
            }`}
          >
            <Heart className="h-5 w-5" />
            <span>Buku Saya</span>
          </button>

          <button
            type="button"
            onClick={() => setBottomNav("profil")}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-2xl transition ${
              bottomNav === "profil"
                ? "bg-cyan-500/20 text-cyan-300 font-black"
                : "hover:text-white"
            }`}
          >
            <User className="h-5 w-5" />
            <span>Profil</span>
          </button>
        </div>
      </div>

      {/* IN-APP READER MODAL */}
      {activeBook && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white">
          <div className="flex items-center justify-between px-4 py-3 bg-[#0B1F33] border-b border-white/10">
            <div className="flex items-center gap-2 truncate">
              <button
                type="button"
                onClick={closeBook}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="truncate">
                <h3 className="text-xs font-bold truncate">{activeBook.title}</h3>
                <p className="text-[10px] text-cyan-200">{activeBook.author}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-xs font-mono font-bold">
                <Clock className="h-3.5 w-3.5 animate-pulse text-cyan-400" />
                <span>
                  {Math.floor(sessionSeconds / 60)}:
                  {String(sessionSeconds % 60).padStart(2, "0")}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsReadingActive(!isReadingActive)}
                className={`p-2 rounded-xl text-xs font-bold ${
                  isReadingActive ? "bg-amber-400 text-slate-900" : "bg-cyan-500 text-slate-900"
                }`}
              >
                {isReadingActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto space-y-6 text-slate-200">
            <div className="rounded-3xl bg-[#0B1F33]/80 p-6 border border-white/10 leading-loose text-sm space-y-4 shadow-xl">
              <p className="text-base text-slate-100 font-serif">
                {activeBook.content[readingPage]}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                disabled={readingPage === 0}
                onClick={() => setReadingPage((p) => p - 1)}
                className="px-4 py-2 rounded-xl bg-white/10 text-xs font-bold disabled:opacity-40"
              >
                Sebelumnya
              </button>
              <span className="text-xs text-cyan-200">
                {readingPage + 1} / {activeBook.content.length}
              </span>
              <button
                type="button"
                disabled={readingPage >= activeBook.content.length - 1}
                onClick={() => setReadingPage((p) => p + 1)}
                className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-900 text-xs font-bold disabled:opacity-40"
              >
                Berikutnya
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
