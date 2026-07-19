"use client";

import { useState } from "react";
import { Book, Search } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useGasLibrary } from "@/hooks/gas/library/useGasLibrary";

const CATALOG_CATEGORIES = ["Semua", "Fiksi", "Non-Fiksi", "Pelajaran", "Referensi", "Agama"];

export function LenteraCatalogPanel() {
  const { user } = useAuthStore();
  const schoolId = user?.schoolId || "";
  const { books, loading } = useGasLibrary(schoolId, "");
  
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBooks = books.filter((book) => {
    const matchesCategory = selectedCategory === "Semua" || book.category === selectedCategory;
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          book.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return <div className="text-slate-400 p-6">Memuat katalog buku...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Katalog Buku Sekolah</h3>
            <p className="mt-1 text-sm text-slate-400">
              Cari dan filter buku yang tersedia di perpustakaan digital.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Cari judul buku atau penulis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950/50 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 sm:overflow-visible scrollbar-hide">
            {CATALOG_CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`whitespace-nowrap rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                  selectedCategory === category
                    ? "border-amber-500 bg-amber-500/10 text-amber-400"
                    : "border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Book Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {filteredBooks.length > 0 ? (
          filteredBooks.map((book) => (
            <div
              key={book.id}
              className="group cursor-pointer overflow-hidden rounded-xl border border-slate-700 bg-slate-800/30 transition-all hover:-translate-y-1 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-slate-800/50">
                <div className="absolute right-2 top-2 z-10 rounded bg-indigo-500 px-2 py-1 text-[10px] font-bold text-white shadow-sm">
                  Tersedia: {book.available}
                </div>
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-slate-600 transition-transform duration-300 group-hover:scale-110">
                  <Book className="h-12 w-12" />
                </div>
              </div>
              <div className="p-4">
                <h4 className="line-clamp-2 text-sm font-bold leading-tight text-white mb-1 group-hover:text-amber-400 transition-colors">
                  {book.title}
                </h4>
                <p className="mb-3 text-xs text-slate-400">{book.author || "Anonim"}</p>
                <span className="inline-block rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-400">
                  {book.category || "UMUM"}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 px-6 py-12 text-center">
            <Book className="mx-auto mb-3 h-10 w-10 text-slate-600" />
            <p className="text-sm font-semibold text-slate-300">
              {books.length === 0
                ? "Belum ada koleksi buku di sekolah ini."
                : "Tidak ada buku yang cocok dengan pencarian Anda."}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Pastikan Anda sudah mengimpor data buku ke RTDB.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
