"use client";

import { useState } from "react";
import { Book, ExternalLink, Search } from "lucide-react";
import {
  useLenteraCatalogBooks,
  type LenteraCatalogBook,
} from "@/hooks/lentera/useLenteraCatalogBooks";

const CATALOG_CATEGORIES = [
  "SEMUA KATEGORI",
  "FIKSI & SASTRA",
  "BUKU PELAJARAN",
  "NON-FIKSI",
  "ENSIKLOPEDIA",
  "SAINS & TEKNOLOGI",
  "PENGEMBANGAN DIRI",
  "MINAT",
  "MAJALAH",
  "LAINNYA",
] as const;

function matchesCategory(book: LenteraCatalogBook, categoryKey: string) {
  if (!categoryKey || categoryKey === "SEMUA KATEGORI") return true;

  const bookCategoryStr = (book.category || "").toUpperCase();
  const bookMainCategory = (book.mainCategory || "").toUpperCase();

  if (categoryKey === "ENSIKLOPEDIA") {
    return bookMainCategory === "ENSIKLOPEDIA" || bookCategoryStr.includes("ENSIKLOPEDIA");
  }

  return bookMainCategory === categoryKey || bookCategoryStr.startsWith(categoryKey);
}

export function LenteraCatalogPanel() {
  const { books, loading, error } = useLenteraCatalogBooks();
  const [selectedCategory, setSelectedCategory] = useState<string>("SEMUA KATEGORI");
  const [searchQuery, setSearchQuery] = useState("");

  const keyword = searchQuery.trim().toLowerCase();
  const filteredBooks = books.filter((book) => {
    const matchesCat = matchesCategory(book, selectedCategory);
    const matchesSearch =
      !keyword ||
      book.title.toLowerCase().includes(keyword) ||
      book.author.toLowerCase().includes(keyword);
    return matchesCat && matchesSearch;
  });

  if (loading) {
    return <div className="p-6 text-slate-400">Memuat katalog buku Lentera Digital…</div>;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-200">
        Gagal memuat katalog: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Katalog Buku Lentera Digital</h3>
            <p className="mt-1 text-sm text-slate-400">
              Koleksi baca-saja dari Firestore eperpus-sekolah ·{" "}
              <span className="text-emerald-400">{books.length} judul</span>
              {selectedCategory !== "SEMUA KATEGORI" || searchQuery
                ? ` · tampil ${filteredBooks.length}`
                : ""}
            </p>
          </div>
          <p className="text-xs text-slate-500">Hanya melihat koleksi · tanpa ubah data</p>
        </div>

        <div className="mt-6 flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Cari judul atau penulis…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950/50 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATALOG_CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-semibold transition-all sm:text-sm ${
                  selectedCategory === category
                    ? "border-amber-500 bg-amber-500/10 text-amber-400"
                    : "border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {category === "SEMUA KATEGORI" ? "Semua" : category}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/40">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-700/80 bg-slate-950/50 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Buku</th>
                <th className="px-4 py-3 font-semibold">Kategori</th>
                <th className="px-4 py-3 font-semibold">Stok</th>
                <th className="px-4 py-3 font-semibold">Tipe</th>
                <th className="px-4 py-3 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredBooks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                    <Book className="mx-auto mb-3 h-10 w-10 text-slate-600" />
                    {books.length === 0
                      ? "Belum ada buku di katalog Lentera Digital."
                      : "Tidak ada buku yang cocok dengan filter."}
                  </td>
                </tr>
              ) : (
                filteredBooks.map((book) => (
                  <tr key={book.id} className="hover:bg-white/[0.03]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-14 w-10 shrink-0 overflow-hidden rounded-md bg-slate-800">
                          {book.coverUrl ? (
                            <img
                              src={book.coverUrl}
                              alt=""
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-600">
                              <Book className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-white" title={book.title}>
                            {book.title}
                          </div>
                          <div className="truncate text-xs text-slate-400">{book.author}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-[220px] truncate text-slate-300" title={book.category}>
                        {book.category}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${
                          book.stock > 0
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-rose-500/15 text-rose-300"
                        }`}
                      >
                        {book.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {book.pdfUrl ? "E-Book" : "Fisik"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {book.pdfUrl ? (
                        <a
                          href={book.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-600 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:border-amber-500/50 hover:text-amber-300"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Baca
                        </a>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
