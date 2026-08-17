"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { eperpusDb } from "@/lib/firebase/eperpus-client";

export type LenteraCatalogBook = {
  id: string;
  title: string;
  author: string;
  category: string;
  mainCategory: string;
  stock: number;
  coverUrl: string;
  pdfUrl: string;
  year?: number;
};

/** Live read of Firestore `books` on project eperpus-sekolah. */
export function useLenteraCatalogBooks() {
  const [books, setBooks] = useState<LenteraCatalogBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(eperpusDb, "books"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const next: LenteraCatalogBook[] = [];
        snap.forEach((docSnap) => {
          const d = docSnap.data() as Record<string, unknown>;
          next.push({
            id: docSnap.id,
            title: String(d.title || d.judul || "Tanpa Judul"),
            author: String(d.author || d.penulis || "-"),
            category: String(d.category || d.kategori || "Umum"),
            mainCategory: String(d.mainCategory || "").toUpperCase(),
            stock: Number(d.stock || 0),
            coverUrl: String(d.coverUrl || d.cover || "").trim(),
            pdfUrl: String(d.pdfUrl || "").trim(),
            year: d.year != null ? Number(d.year) : undefined,
          });
        });
        setBooks(next);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("Lentera catalog snapshot error:", err);
        setError(err.message || "Gagal memuat katalog buku");
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  return { books, loading, error };
}
