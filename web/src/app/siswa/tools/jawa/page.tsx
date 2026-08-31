"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRightLeft, Sparkles, Copy, Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { convertToHanacaraka } from "@/lib/siswa/hanacaraka";

export default function KamusJawaPage() {
  const router = useRouter();
  const [inputText, setInputText] = useState("");
  const [direction, setDirection] = useState<"id-jv" | "jv-id">("id-jv");
  const [translatedText, setTranslatedText] = useState("");
  const [hanacaraka, setHanacaraka] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTranslate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputText.trim();
    if (!query) return;

    setLoading(true);
    try {
      const langPair = direction === "id-jv" ? "id|jw" : "jw|id";
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(query)}&langpair=${langPair}`);
      let trans = "";
      if (res.ok) {
        const data = await res.json();
        trans = data.responseData?.translatedText || "";
      }

      if (!trans || trans.includes("MYMEMORY WARNING")) {
        trans = query; // fallback
      }

      setTranslatedText(trans);

      // Generate Hanacaraka for the Javanese text
      const targetJavanese = direction === "id-jv" ? trans : query;
      const script = convertToHanacaraka(targetJavanese);
      setHanacaraka(script);
    } catch {
      // Offline fallback: convert direct to Hanacaraka
      setTranslatedText(query);
      setHanacaraka(convertToHanacaraka(query));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-dvh bg-slate-50 pb-24 text-slate-800">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-purple-700 px-4 pt-12 pb-4 text-white shadow-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/siswa/tools")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white transition hover:bg-white/30"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold leading-tight">Kamus Bahasa Jawa</h1>
            <p className="text-xs text-purple-200">Terjemahan Jawa-Indonesia & Hanacaraka</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 max-w-2xl mx-auto space-y-4">
        {/* Direction Switcher */}
        <div className="flex items-center justify-between bg-white rounded-2xl p-2 border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700">
            {direction === "id-jv" ? "🇮🇩 Indonesia ➔ ꦗꦮ Basa Jawa" : "ꦗꦮ Basa Jawa ➔ 🇮🇩 Indonesia"}
          </span>
          <button
            type="button"
            onClick={() => {
              setDirection((d) => (d === "id-jv" ? "jv-id" : "id-jv"));
              setTranslatedText("");
              setHanacaraka("");
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-700 px-3 py-1.5 rounded-xl bg-purple-50/60 hover:bg-purple-100 transition"
          >
            <ArrowRightLeft className="h-3.5 w-3.5" /> Ganti Arah
          </button>
        </div>

        {/* Input Card */}
        <div className="rounded-3xl bg-white p-4 border border-slate-200 shadow-sm space-y-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            {direction === "id-jv" ? "Teks Bahasa Indonesia" : "Teks Bahasa Jawa (Latin)"}
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={direction === "id-jv" ? "Ketik kalimat Indonesia... (contoh: Sugeng enjang, apa kabar?)" : "Ketik ukara Jawa... (contoh: Kula badhe sinau)"}
            rows={3}
            className="w-full rounded-2xl border border-slate-200 p-3 text-sm text-slate-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100 resize-none"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => handleTranslate()}
              disabled={loading || !inputText.trim()}
              className="flex items-center gap-2 rounded-2xl bg-purple-700 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-purple-600/20 hover:bg-purple-800 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Menerjemahkan...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Terjemahkan & Aksara
                </>
              )}
            </button>
          </div>
        </div>

        {/* Output Card */}
        {translatedText && (
          <div className="rounded-3xl bg-white p-5 border border-purple-200 shadow-sm space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">
                  Hasil Terjemahan
                </span>
                <p className="text-lg font-bold text-slate-900 mt-1">{translatedText}</p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(translatedText)}
                className="flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-xl hover:bg-purple-100 transition"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? "Disalin" : "Salin"}</span>
              </button>
            </div>

            {/* Aksara Hanacaraka Box */}
            {hanacaraka && (
              <div className="rounded-2xl bg-purple-50/70 p-4 border border-purple-100 space-y-2">
                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                  Aksara Jawa (Hanacaraka)
                </span>
                <p className="text-2xl font-serif text-purple-950 leading-relaxed tracking-wide">
                  {hanacaraka}
                </p>
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleCopy(hanacaraka)}
                    className="text-xs text-purple-700 hover:underline font-medium"
                  >
                    Salin Aksara Jawa
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
