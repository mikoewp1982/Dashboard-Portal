"use client";

import { useState } from "react";
import { ArrowLeft, Search, BookMarked, Loader2, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";

interface KbbiMeaning {
  partOfSpeech?: string;
  definition: string;
  examples?: string[];
}

interface KbbiEntry {
  lemma: string;
  pronunciation?: string;
  meanings: KbbiMeaning[];
}

export default function KbbiPage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<KbbiEntry[]>([]);
  const [error, setError] = useState("");

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanWord = keyword.trim().toLowerCase();
    if (!cleanWord) return;

    setLoading(true);
    setError("");
    setResults([]);

    try {
      // 1. Try Raf555 KBBI API
      let success = false;
      try {
        const res = await fetch(`https://kbbi.raf555.dev/api/v1/entry/${encodeURIComponent(cleanWord)}`);
        if (res.ok) {
          const data = await res.json();
          const entries: KbbiEntry[] = [];
          if (data.entries && Array.isArray(data.entries)) {
            data.entries.forEach((item: any) => {
              const meanings: KbbiMeaning[] = [];
              if (item.definitions && Array.isArray(item.definitions)) {
                item.definitions.forEach((def: any) => {
                  const pos = def.labels?.map((l: any) => l.code || l.name).filter(Boolean).join(", ") || "";
                  meanings.push({
                    partOfSpeech: pos,
                    definition: def.definition || "",
                    examples: def.usageExamples || [],
                  });
                });
              }
              entries.push({
                lemma: item.entry || data.lemma || cleanWord,
                pronunciation: item.pronunciation,
                meanings,
              });
            });
            if (entries.length > 0) {
              setResults(entries);
              success = true;
            }
          }
        }
      } catch {}

      // 2. Fallback to secondary mirror if needed
      if (!success) {
        try {
          const res2 = await fetch(`https://new-kbbi-api.vercel.app/api/kbbi?text=${encodeURIComponent(cleanWord)}`);
          if (res2.ok) {
            const data2 = await res2.json();
            if (data2.data && Array.isArray(data2.data)) {
              const entries2: KbbiEntry[] = data2.data.map((item: any) => ({
                lemma: item.lema || cleanWord,
                meanings: (item.arti || []).map((a: any) => ({
                  partOfSpeech: a.kelas_kata,
                  definition: a.deskripsi,
                })),
              }));
              if (entries2.length > 0) {
                setResults(entries2);
                success = true;
              }
            }
          }
        } catch {}
      }

      if (!success) {
        setError(`Kata "${cleanWord}" tidak ditemukan dalam Kamus Besar Bahasa Indonesia (KBBI).`);
      }
    } catch {
      setError("Gagal terhubung ke layanan KBBI. Periksa koneksi internet Anda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-slate-50 pb-24 text-slate-800">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-red-700 px-4 pt-12 pb-4 text-white shadow-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/siswa/tools")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white transition hover:bg-white/30 active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold leading-tight">Kamus Besar Bahasa Indonesia</h1>
            <p className="text-xs text-red-200">Pencarian definisi resmi kosakata KBBI</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 max-w-2xl mx-auto space-y-4">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Ketik kata baku... (contoh: gotong royong, integritas)"
              className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !keyword.trim()}
            className="rounded-2xl bg-red-700 px-5 py-3 text-sm font-bold text-white shadow-md shadow-red-700/20 hover:bg-red-800 active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Cari"}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Results List */}
        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((entry, idx) => (
              <div
                key={idx}
                className="rounded-3xl bg-white p-5 border border-slate-200 shadow-sm space-y-4"
              >
                <div className="border-b border-slate-100 pb-3">
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-2xl font-black text-slate-900">{entry.lemma}</h2>
                    {entry.pronunciation && (
                      <span className="text-xs font-mono text-red-700">
                        ({entry.pronunciation})
                      </span>
                    )}
                  </div>
                </div>

                {/* Meanings */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Definisi Kosakata
                  </span>
                  <ol className="space-y-3 pl-4 list-decimal text-sm text-slate-800 leading-relaxed">
                    {entry.meanings.map((m, mIdx) => (
                      <li key={mIdx} className="space-y-1">
                        {m.partOfSpeech && (
                          <span className="inline-block px-2 py-0.5 rounded bg-red-50 text-red-700 text-xs font-bold mr-2 italic">
                            {m.partOfSpeech}
                          </span>
                        )}
                        <span>{m.definition}</span>
                        {m.examples && m.examples.length > 0 && (
                          <div className="mt-1 space-y-0.5 pl-2 border-l-2 border-slate-200">
                            {m.examples.map((ex, exIdx) => (
                              <p key={exIdx} className="text-xs text-slate-500 italic">
                                &ldquo;{ex}&rdquo;
                              </p>
                            ))}
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            ))}
          </div>
        )}

        {results.length === 0 && !loading && !error && (
          <div className="py-12 text-center text-slate-400">
            <BookMarked className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm">Ketik kata di kolom pencarian di atas untuk mencari definisi KBBI.</p>
          </div>
        )}
      </div>
    </div>
  );
}
