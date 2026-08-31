"use client";

import { useState } from "react";
import { ArrowLeft, Search, Volume2, ArrowRightLeft, Loader2, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";

interface DictionaryMeaning {
  partOfSpeech: string;
  definitions: {
    definition: string;
    example?: string;
  }[];
}

interface DictionaryResult {
  word: string;
  phonetic?: string;
  meanings: DictionaryMeaning[];
  translation?: string;
}

export default function KamusInggrisPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [direction, setDirection] = useState<"en-id" | "id-en">("en-id");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DictionaryResult | null>(null);
  const [error, setError] = useState("");

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanWord = query.trim();
    if (!cleanWord) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      if (direction === "en-id") {
        // Look up Free Dictionary API
        const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`);
        let dictData: any = null;
        if (dictRes.ok) {
          const list = await dictRes.json();
          dictData = list[0];
        }

        // Translation lookup via MyMemory API
        const transRes = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanWord)}&langpair=en|id`);
        let translation = "";
        if (transRes.ok) {
          const transData = await transRes.json();
          translation = transData.responseData?.translatedText || "";
        }

        if (!dictData && !translation) {
          setError(`Kata "${cleanWord}" tidak ditemukan dalam kamus.`);
        } else {
          setResult({
            word: dictData?.word || cleanWord,
            phonetic: dictData?.phonetic || dictData?.phonetics?.[0]?.text,
            meanings: dictData?.meanings || [],
            translation,
          });
        }
      } else {
        // Indonesia to English
        const transRes = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanWord)}&langpair=id|en`);
        let translation = "";
        if (transRes.ok) {
          const transData = await transRes.json();
          translation = transData.responseData?.translatedText || "";
        }

        if (!translation) {
          setError(`Terjemahan untuk "${cleanWord}" tidak ditemukan.`);
        } else {
          // Look up English dictionary for the translated word
          const firstWord = translation.split(" ")[0].replace(/[^a-zA-Z]/g, "");
          const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(firstWord)}`);
          let dictData: any = null;
          if (dictRes.ok) {
            const list = await dictRes.json();
            dictData = list[0];
          }

          setResult({
            word: cleanWord,
            translation,
            phonetic: dictData?.phonetic,
            meanings: dictData?.meanings || [],
          });
        }
      }
    } catch (err: any) {
      setError("Gagal menghubungi server kamus. Periksa koneksi internet Anda.");
    } finally {
      setLoading(false);
    }
  };

  const playAudio = () => {
    if (!result?.word) return;
    try {
      const utterance = new SpeechSynthesisUtterance(direction === "en-id" ? result.word : result.translation);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    } catch {}
  };

  return (
    <div className="min-h-dvh bg-slate-50 pb-24 text-slate-800">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-blue-600 px-4 pt-12 pb-4 text-white shadow-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/siswa/tools")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white transition hover:bg-white/30"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold leading-tight">Kamus Bahasa Inggris</h1>
            <p className="text-xs text-blue-100">Cari kosa kata, definisi, & terjemahan</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 max-w-2xl mx-auto">
        {/* Toggle Direction */}
        <div className="flex items-center justify-between bg-white rounded-2xl p-2 border border-slate-200 shadow-sm mb-4">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700">
            {direction === "en-id" ? "🇬🇧 English ➔ 🇮🇩 Indonesia" : "🇮🇩 Indonesia ➔ 🇬🇧 English"}
          </span>
          <button
            type="button"
            onClick={() => {
              setDirection((d) => (d === "en-id" ? "id-en" : "en-id"));
              setResult(null);
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-xl bg-blue-50/50 hover:bg-blue-100 transition"
          >
            <ArrowRightLeft className="h-3.5 w-3.5" /> Ganti Arah
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative flex gap-2 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={direction === "en-id" ? "Ketik kata bahasa Inggris... (contoh: persistent)" : "Ketik kata bahasa Indonesia... (contoh: giat)"}
              className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Cari"}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 mb-5">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="rounded-3xl bg-white p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-2xl font-black text-slate-900">{result.word}</h2>
                {result.phonetic && (
                  <p className="text-sm font-mono text-blue-600 mt-0.5">{result.phonetic}</p>
                )}
              </div>
              <button
                type="button"
                onClick={playAudio}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition hover:bg-blue-100 active:scale-95"
                title="Dengarkan pengucapan"
              >
                <Volume2 className="h-5 w-5" />
              </button>
            </div>

            {/* Arti / Terjemahan */}
            {result.translation && (
              <div className="rounded-2xl bg-blue-50/80 p-3.5 border border-blue-100">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block mb-1">
                  Arti Terjemahan
                </span>
                <p className="text-base font-bold text-blue-950">{result.translation}</p>
              </div>
            )}

            {/* Meanings / Definitions */}
            {result.meanings.length > 0 && (
              <div className="space-y-4 pt-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Definisi & Penggunaan
                </span>
                {result.meanings.map((m, idx) => (
                  <div key={idx} className="space-y-2">
                    <span className="inline-block px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold italic">
                      {m.partOfSpeech}
                    </span>
                    <ul className="space-y-2 pl-4 list-disc text-sm text-slate-700 leading-relaxed">
                      {m.definitions.slice(0, 3).map((def, dIdx) => (
                        <li key={dIdx}>
                          <span>{def.definition}</span>
                          {def.example && (
                            <p className="text-xs text-slate-500 italic mt-0.5">
                              &ldquo;{def.example}&rdquo;
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!result && !loading && !error && (
          <div className="py-12 text-center text-slate-400">
            <BookOpen className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm">Ketik kata di kolom pencarian di atas untuk memulai.</p>
          </div>
        )}
      </div>
    </div>
  );
}
