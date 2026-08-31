"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, BookOpen, ChevronRight, Sparkles, Heart, Search, ZoomIn, ZoomOut } from "lucide-react";
import { useRouter } from "next/navigation";
import religiousData from "@/data/buku_religius.json";

export default function BukuReligiusPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"surah" | "istighotsah" | "asmaul" | "doa">("surah");
  const [selectedSurahIdx, setSelectedSurahIdx] = useState<number | null>(null);
  const [fontSize, setFontSize] = useState<number>(24);
  const [searchFilter, setSearchFilter] = useState("");

  const surahs = religiousData.surahs || [];
  const istighotsah = religiousData.istighotsah || [];
  const asmaulHusna = (religiousData as any).asmaul_husna || [];
  const doaPendek = (religiousData as any).doa_pendek || [];

  return (
    <div className="min-h-dvh bg-slate-50 pb-24 text-slate-800">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-emerald-700 px-4 pt-12 pb-4 text-white shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (selectedSurahIdx !== null) {
                  setSelectedSurahIdx(null);
                } else {
                  router.push("/siswa/tools");
                }
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white transition hover:bg-white/30 active:scale-95"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold leading-tight line-clamp-1">
                {selectedSurahIdx !== null
                  ? `Surat ${surahs[selectedSurahIdx]?.name}`
                  : "Buku Pembiasaan Religius"}
              </h1>
              <p className="text-xs text-emerald-200">
                {selectedSurahIdx !== null
                  ? `${surahs[selectedSurahIdx]?.numberOfVerses} Ayat • ${surahs[selectedSurahIdx]?.translation}`
                  : "Surat pilihan, Istighotsah, Asmaul Husna, & Doa"}
              </p>
            </div>
          </div>

          {/* Font Resizer */}
          <div className="flex items-center gap-1 bg-white/15 rounded-xl px-2 py-1">
            <button
              type="button"
              onClick={() => setFontSize((s) => Math.max(18, s - 2))}
              className="p-1 hover:bg-white/20 rounded-lg text-white"
              title="Perkecil Teks"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-[11px] font-bold px-1">{fontSize}px</span>
            <button
              type="button"
              onClick={() => setFontSize((s) => Math.min(36, s + 2))}
              className="p-1 hover:bg-white/20 rounded-lg text-white"
              title="Perbesar Teks"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation (when not in single surah view) */}
        {selectedSurahIdx === null && (
          <div className="flex items-center gap-1.5 overflow-x-auto mt-4 pt-1 no-scrollbar">
            {[
              { key: "surah", label: "Surat Pilihan" },
              { key: "istighotsah", label: "Istighotsah" },
              { key: "asmaul", label: "Asmaul Husna" },
              { key: "doa", label: "Doa Harian" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key as any);
                  setSelectedSurahIdx(null);
                }}
                className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                  activeTab === tab.key
                    ? "bg-white text-emerald-800 shadow-sm"
                    : "bg-white/15 text-emerald-100 hover:bg-white/25"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="px-4 py-5 max-w-2xl mx-auto space-y-4">
        {/* VIEW 1: SURAHS LIST / SINGLE SURAH */}
        {activeTab === "surah" && (
          <>
            {selectedSurahIdx === null ? (
              <div className="space-y-3">
                {surahs.map((surah, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedSurahIdx(idx)}
                    className="flex w-full items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow transition text-left active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-bold text-sm">
                        {surah.number || idx + 1}
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-slate-800">
                          Surat {surah.name}
                        </h2>
                        <p className="text-xs text-slate-500">
                          {surah.translation} • {surah.numberOfVerses} Ayat
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </button>
                ))}
              </div>
            ) : (
              // Verses List
              <div className="space-y-4">
                {surahs[selectedSurahIdx]?.verses?.map((v, vIdx) => (
                  <div
                    key={vIdx}
                    className="rounded-3xl bg-white p-5 border border-slate-200 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                        {v.number}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        Ayat {v.number}
                      </span>
                    </div>

                    {/* Arabic Text */}
                    <p
                      className="text-right font-serif leading-[2.2] text-slate-900 font-medium"
                      style={{ fontSize: `${fontSize}px` }}
                      dir="rtl"
                    >
                      {v.arab}
                    </p>

                    {/* Latin & Translation */}
                    <div className="space-y-1 pt-1">
                      <p className="text-xs font-medium text-emerald-700 italic">
                        {v.latin}
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {v.translation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* VIEW 2: ISTIGHOTSAH */}
        {activeTab === "istighotsah" && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-100 text-xs text-emerald-800 font-medium leading-relaxed">
              Dzikir dan doa Istighotsah untuk memohon pertolongan, ketenangan hati, dan keselamatan kepada Allah SWT.
            </div>

            {istighotsah.map((item, idx) => (
              <div
                key={idx}
                className="rounded-3xl bg-white p-5 border border-slate-200 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                    {item.number || idx + 1}
                  </span>
                </div>
                <p
                  className="text-right font-serif leading-[2.2] text-slate-900 font-medium"
                  style={{ fontSize: `${fontSize}px` }}
                  dir="rtl"
                >
                  {item.arab}
                </p>
                <p className="text-xs text-slate-600 leading-relaxed pt-1">
                  {item.translation}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* VIEW 3: ASMAUL HUSNA */}
        {activeTab === "asmaul" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {asmaulHusna.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="rounded-2xl bg-white p-4 border border-slate-200 shadow-sm flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-emerald-600">
                      #{item.number || idx + 1}
                    </span>
                  </div>
                  <p
                    className="text-right font-serif text-slate-900 font-bold my-1"
                    style={{ fontSize: `${Math.max(20, fontSize)}px` }}
                    dir="rtl"
                  >
                    {item.arab}
                  </p>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{item.latin}</p>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                      {item.translation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 4: DOA PENDEK */}
        {activeTab === "doa" && (
          <div className="space-y-4">
            {doaPendek.map((doa: any, idx: number) => (
              <div
                key={idx}
                className="rounded-3xl bg-white p-5 border border-slate-200 shadow-sm space-y-3"
              >
                <h3 className="text-sm font-bold text-emerald-800 border-b border-slate-100 pb-2">
                  {doa.title}
                </h3>
                <p
                  className="text-right font-serif leading-[2.2] text-slate-900 font-medium"
                  style={{ fontSize: `${fontSize}px` }}
                  dir="rtl"
                >
                  {doa.arab}
                </p>
                <div className="space-y-1 pt-1">
                  <p className="text-xs font-medium text-emerald-700 italic">
                    {doa.latin}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {doa.translation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
