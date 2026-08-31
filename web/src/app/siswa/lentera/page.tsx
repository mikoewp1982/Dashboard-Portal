"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  BookOpen,
  Search,
  Clock,
  Play,
  Pause,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  BookMarked,
  X,
  Maximize2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import {
  listenReadingDuration,
  addReadingTime,
  getTodayDateStr,
} from "@/lib/siswa/studentDataService";

interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  coverColor: string;
  pages: number;
  description: string;
  sampleContent: string[];
}

const SAMPLE_BOOKS: Book[] = [
  {
    id: "buku_1",
    title: "Laskar Pelangi",
    author: "Andrea Hirata",
    category: "Inspiratif & Sastra",
    coverColor: "from-amber-500 to-orange-600",
    pages: 34,
    description: "Kisah perjuangan sepuluh anak di Belitung dalam meraih pendidikan dan mimpi.",
    sampleContent: [
      "Halaman 1: Pagi itu, waktu masih amat pagi. Kabut masih menyelimuti dedaunan pohon filicium yang rindang di pekarangan sekolah...",
      "Halaman 2: Pak Harfan dan Bu Muslimah berdiri di depan pintu kelas. Wajah mereka tampak cemas menantikan murid kesepuluh agar sekolah tidak ditutup...",
      "Halaman 3: Tiba-tiba dari kejauhan tampak seorang ibu menggandeng anaknya yang berjalan pincang. Harun namanya...",
      "Halaman 4: Keberanian dan ketulusan belajar adalah lentera paling terang di tengah keterbatasan...",
    ],
  },
  {
    id: "buku_2",
    title: "Sains & Keajaiban Alam Semesta",
    author: "Tim IPA Edukasi",
    category: "Ilmu Pengetahuan",
    coverColor: "from-blue-600 to-indigo-700",
    pages: 28,
    description: "Menjelajahi rahasia tata surya, lubang hitam, dan keajaiban ekosistem bumi.",
    sampleContent: [
      "Halaman 1: Alam semesta memiliki miliaran galaksi yang masing-masing berisi ratusan miliar bintang...",
      "Halaman 2: Fotosintesis pada tumbuhan hijau adalah proses biologis yang menghasilkan oksigen untuk seluruh makhluk hidup...",
      "Halaman 3: Gravitasi menjaga planet-planet tetap berputar pada orbitnya mengelilingi matahari...",
      "Halaman 4: Eksplorasi sains membuka wawasan manusia tentang betapa luas dan teraturnya ciptaan Tuhan...",
    ],
  },
  {
    id: "buku_3",
    title: "Kisah Keteladanan Tokoh Bangsa",
    author: "Sejarah Nusantara",
    category: "Karakter & Sejarah",
    coverColor: "from-emerald-600 to-teal-700",
    pages: 25,
    description: "Belajar integritas, kegigihan, dan cinta tanah air dari pahlawan nasional.",
    sampleContent: [
      "Halaman 1: Ki Hajar Dewantara mengajarkan semboyan 'Ing ngarsa sung tuladha, ing madya mangun karsa, tut wuri handayani'...",
      "Halaman 2: Bung Hatta dikenal dengan kejujuran dan kegemarannya membaca ribuan buku sepanjang hidupnya...",
      "Halaman 3: Semangat persatuan dalam keberagaman adalah fondasi kokoh bagi generasi penerus bangsa...",
    ],
  },
  {
    id: "buku_4",
    title: "Etika & Budi Pekerti Remaja",
    author: "Pusat Literasi Remaja",
    category: "Pengembangan Diri",
    coverColor: "from-purple-600 to-pink-600",
    pages: 20,
    description: "Panduan membangun karakter positif, sopan santun, dan empati sosial.",
    sampleContent: [
      "Halaman 1: Menghormati guru dan orang tua adalah kunci utama keberkahan ilmu dan masa depan...",
      "Halaman 2: Menjaga lisan dan bijak bermedia sosial menghindarkan kita dari konflik dan perundungan...",
      "Halaman 3: Bersikap jujur dalam setiap tindakan adalah mahkota kehormatan seorang pelajar...",
    ],
  },
];

export default function LenteraDigitalPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [readingMillis, setReadingMillis] = useState(0);
  const [activeBook, setActiveBook] = useState<Book | null>(null);
  const [readingPage, setReadingPage] = useState(0);
  const [isReadingActive, setIsReadingActive] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");

  const todayStr = getTodayDateStr();

  // Listen to realtime total reading duration today
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
          // Every 30 seconds, sync to Firebase RTDB
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
  const readingTargetMinutes = 30;
  const satietyPercent = Math.min(100, Math.round((totalReadingMinutes / readingTargetMinutes) * 100));

  const filteredBooks = SAMPLE_BOOKS.filter((b) => {
    const matchQuery = b.title.toLowerCase().includes(searchQuery.toLowerCase()) || b.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === "Semua" || b.category.includes(selectedCategory);
    return matchQuery && matchCat;
  });

  const openBook = (book: Book) => {
    setActiveBook(book);
    setReadingPage(0);
    setIsReadingActive(true);
    setSessionSeconds(0);
  };

  const closeBook = async () => {
    if (sessionSeconds > 0 && user?.nisn) {
      // Sync remaining seconds
      const remainder = sessionSeconds % 30;
      if (remainder > 0) {
        await addReadingTime(user.nisn, todayStr, remainder * 1000);
      }
    }
    setIsReadingActive(false);
    setActiveBook(null);
    setSessionSeconds(0);
  };

  return (
    <div className="min-h-dvh bg-slate-50 pb-24 text-slate-800">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-teal-800 px-4 pt-12 pb-4 text-white shadow-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/siswa")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white transition hover:bg-white/30 active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold leading-tight">Lentera Digital</h1>
            <p className="text-xs text-teal-200">E-Perpustakaan & Catatan Membaca Harian</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 max-w-2xl mx-auto space-y-4">
        {/* Reading Target Card */}
        <div className="rounded-3xl bg-white p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider block">
                Target Membaca Hari Ini
              </span>
              <p className="text-2xl font-black text-slate-900 mt-0.5">
                {totalReadingMinutes} / {readingTargetMinutes} <span className="text-sm font-semibold text-slate-500">Menit</span>
              </p>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-2xl font-black text-teal-700">{satietyPercent}%</span>
              <span className="text-[10px] text-slate-400 font-semibold">Kenyang Pet</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-3.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${satietyPercent}%` }}
            />
          </div>

          {/* Satiety Status Text */}
          <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-3">
            <span className="text-slate-500">Status Kenyang:</span>
            <span className={`font-bold ${satietyPercent >= 100 ? "text-emerald-700" : "text-amber-600"}`}>
              {satietyPercent >= 100 ? "Kenyang Penuh (100%) 🎉" : `${readingTargetMinutes - totalReadingMinutes} menit lagi untuk kenyang`}
            </span>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul buku atau penulis..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            {["Semua", "Inspiratif", "Ilmu Pengetahuan", "Karakter", "Pengembangan Diri"].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  selectedCategory === cat
                    ? "bg-teal-700 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Books Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              className="rounded-3xl bg-white p-4 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                {/* Book Cover Banner */}
                <div
                  className={`h-28 rounded-2xl bg-gradient-to-br ${book.coverColor} p-3.5 text-white flex flex-col justify-between shadow-inner mb-3`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded-full w-fit">
                    {book.category}
                  </span>
                  <div>
                    <h3 className="text-sm font-black line-clamp-2 leading-snug">{book.title}</h3>
                    <p className="text-[10px] text-white/80 mt-0.5">{book.author}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                  {book.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => openBook(book)}
                className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-teal-50 py-2.5 text-xs font-bold text-teal-700 hover:bg-teal-100 transition active:scale-95"
              >
                <BookOpen className="h-4 w-4" /> Baca Sekarang
              </button>
            </div>
          ))}
        </div>

        {/* Pet Satiety Note */}
        <div className="rounded-2xl bg-teal-50/80 p-4 border border-teal-100 flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
            🥗
          </div>
          <div>
            <h4 className="text-xs font-bold text-teal-900">Koneksi ke Sahabat Belajar (Virtual Pet)</h4>
            <p className="text-[11px] text-teal-700 leading-relaxed mt-0.5">
              Setiap detik Anda membaca buku di Lentera Digital akan terekam ke akun siswa dan mengisi <strong>Bar Kenyang Pet</strong> secara bertahap hingga mencapai 100% di 30 menit!
            </p>
          </div>
        </div>
      </div>

      {/* READING MODAL / IN-APP READER */}
      {activeBook && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-900 text-white">
          {/* Reader Top Bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <button
                type="button"
                onClick={closeBook}
                className="p-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="truncate">
                <h3 className="text-xs font-bold truncate">{activeBook.title}</h3>
                <p className="text-[10px] text-slate-400">{activeBook.author}</p>
              </div>
            </div>

            {/* Reading Timer Live Badge */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-mono font-bold">
                <Clock className="h-3.5 w-3.5 animate-pulse text-teal-400" />
                <span>
                  {Math.floor(sessionSeconds / 60)}:
                  {String(sessionSeconds % 60).padStart(2, "0")}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsReadingActive(!isReadingActive)}
                className={`p-2 rounded-xl text-xs font-bold ${
                  isReadingActive ? "bg-amber-500 text-slate-900" : "bg-teal-600 text-white"
                }`}
              >
                {isReadingActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Reader Content Body */}
          <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto space-y-6 text-slate-200">
            <div className="text-center border-b border-slate-800 pb-4">
              <span className="text-[10px] uppercase font-bold text-teal-400 tracking-wider">
                Halaman {readingPage + 1} dari {activeBook.sampleContent.length}
              </span>
              <h2 className="text-xl font-bold text-white mt-1">{activeBook.title}</h2>
            </div>

            <div className="rounded-3xl bg-slate-800/80 p-6 border border-slate-700 leading-relaxed text-sm space-y-4 shadow-xl">
              <p className="text-base text-slate-100 font-serif leading-loose">
                {activeBook.sampleContent[readingPage]}
              </p>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                disabled={readingPage === 0}
                onClick={() => setReadingPage((p) => p - 1)}
                className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold disabled:opacity-40"
              >
                Halaman Sebelumnya
              </button>
              <span className="text-xs text-slate-400">
                {readingPage + 1} / {activeBook.sampleContent.length}
              </span>
              <button
                type="button"
                disabled={readingPage >= activeBook.sampleContent.length - 1}
                onClick={() => setReadingPage((p) => p + 1)}
                className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold disabled:opacity-40"
              >
                Halaman Berikutnya
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
