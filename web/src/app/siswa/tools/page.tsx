"use client";

import { ArrowLeft, BookOpen, Languages, BookMarked, Calculator, Wrench } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ToolItem {
  id: string;
  title: string;
  subtitle: string;
  href?: string;
  icon: React.ReactNode;
  iconBg: string;
  isAvailable: boolean;
  badgeText: string;
  badgeBg: string;
  badgeTextCol: string;
}

const TOOLS_LIST: ToolItem[] = [
  {
    id: "inggris",
    title: "Kamus Bahasa Inggris",
    subtitle: "Cari definisi, jenis kata, contoh, dan arti Indonesianya",
    href: "/siswa/tools/inggris",
    icon: <Languages className="h-7 w-7 text-blue-600" />,
    iconBg: "bg-blue-100",
    isAvailable: true,
    badgeText: "Tersedia",
    badgeBg: "bg-blue-100",
    badgeTextCol: "text-blue-700",
  },
  {
    id: "jawa",
    title: "Kamus Bahasa Jawa",
    subtitle: "Terjemahan dua arah Jawa-Indonesia plus aksara Hanacaraka",
    href: "/siswa/tools/jawa",
    icon: (
      <span className="text-xl font-bold text-purple-700 tracking-tighter">文A</span>
    ),
    iconBg: "bg-purple-100",
    isAvailable: true,
    badgeText: "Tersedia",
    badgeBg: "bg-purple-100",
    badgeTextCol: "text-purple-700",
  },
  {
    id: "religius",
    title: "Buku Pembiasaan Religius",
    subtitle: "Surat pilihan (Yasin, Ar-Rahman, Al-Waqi'ah, Al-Mulk), Istighotsah, Asmaul Husna, & Doa",
    href: "/siswa/tools/religius",
    icon: <BookOpen className="h-7 w-7 text-emerald-600" />,
    iconBg: "bg-emerald-100",
    isAvailable: true,
    badgeText: "Tersedia",
    badgeBg: "bg-emerald-100",
    badgeTextCol: "text-emerald-700",
  },
  {
    id: "kbbi",
    title: "Kamus Besar Bahasa Indonesia",
    subtitle: "Pencarian definisi kosakata bahasa Indonesia (KBBI)",
    href: "/siswa/tools/kbbi",
    icon: <BookMarked className="h-7 w-7 text-red-600" />,
    iconBg: "bg-red-100",
    isAvailable: true,
    badgeText: "Tersedia",
    badgeBg: "bg-red-100",
    badgeTextCol: "text-red-700",
  },
  {
    id: "cs_calc",
    title: "Coming Soon",
    subtitle: "Slot kosong untuk tool belajar berikutnya",
    icon: <Calculator className="h-7 w-7 text-slate-500" />,
    iconBg: "bg-slate-100",
    isAvailable: false,
    badgeText: "Coming Soon",
    badgeBg: "bg-slate-100",
    badgeTextCol: "text-slate-500",
  },
  {
    id: "cs_book",
    title: "Coming Soon",
    subtitle: "Slot kosong untuk tool belajar berikutnya",
    icon: <BookOpen className="h-7 w-7 text-slate-500" />,
    iconBg: "bg-slate-100",
    isAvailable: false,
    badgeText: "Coming Soon",
    badgeBg: "bg-slate-100",
    badgeTextCol: "text-slate-500",
  },
  {
    id: "cs_wrench",
    title: "Coming Soon",
    subtitle: "Slot kosong untuk tool belajar berikutnya",
    icon: <Wrench className="h-7 w-7 text-slate-500" />,
    iconBg: "bg-slate-100",
    isAvailable: false,
    badgeText: "Coming Soon",
    badgeBg: "bg-slate-100",
    badgeTextCol: "text-slate-500",
  },
];

export default function ToolsBelajarPage() {
  const router = useRouter();

  return (
    <div className="min-h-dvh bg-gradient-to-b from-sky-50 via-slate-50 to-indigo-50/30 pb-24 text-slate-800">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/siswa")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition hover:bg-slate-200 active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">Tools Belajar</h1>
            <p className="text-xs text-slate-500">Kumpulan alat bantu ringan untuk siswa</p>
          </div>
        </div>
      </div>

      {/* Content List */}
      <div className="px-4 py-5 space-y-3.5 max-w-2xl mx-auto">
        {TOOLS_LIST.map((tool) => {
          const cardContent = (
            <div
              className={`flex items-center gap-3.5 p-4 rounded-3xl border transition-all duration-200 ${
                tool.isAvailable
                  ? "bg-white border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-200 active:scale-[0.99] cursor-pointer"
                  : "bg-white/60 border-slate-200/50 opacity-70 cursor-not-allowed"
              }`}
            >
              {/* Icon Box */}
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${tool.iconBg}`}
              >
                {tool.icon}
              </div>

              {/* Texts */}
              <div className="flex-1 min-w-0 pr-1">
                <h2
                  className={`text-sm font-bold truncate ${
                    tool.isAvailable ? "text-slate-800" : "text-slate-500"
                  }`}
                >
                  {tool.title}
                </h2>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mt-0.5">
                  {tool.subtitle}
                </p>
              </div>

              {/* Status Badge */}
              <div className="shrink-0">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold ${tool.badgeBg} ${tool.badgeTextCol}`}
                >
                  {tool.badgeText}
                </span>
              </div>
            </div>
          );

          if (tool.isAvailable && tool.href) {
            return (
              <Link key={tool.id} href={tool.href} className="block no-underline">
                {cardContent}
              </Link>
            );
          }

          return <div key={tool.id}>{cardContent}</div>;
        })}
      </div>
    </div>
  );
}
