"use client";

import { useState, useEffect } from "react";
import { SuperAdminPageLayout } from "@/components/super-admin/SuperAdminPageLayout";
import { callSuperAdminApi } from "@/lib/callSuperAdminApi";
import { rtdb } from "@/lib/firebase/client";
import { ref, onValue } from "firebase/database";

export default function SuperAdminBroadcastPage() {
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState("ALL");
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    const broadcastsRef = ref(rtdb, 'gas/broadcasts');
    const unsubscribe = onValue(broadcastsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const arr = Object.values(data).sort((a: any, b: any) => b.createdAt - a.createdAt);
        setBroadcasts(arr);
      } else {
        setBroadcasts([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMsg("");
    try {
      await callSuperAdminApi("POST", {
        action: "create-broadcast",
        title,
        message,
        target
      });
      setStatusMsg("Broadcast berhasil dibuat!");
      setTitle("");
      setMessage("");
    } catch (e: any) {
      setStatusMsg(`Error: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus broadcast ini?")) return;
    try {
      await callSuperAdminApi("POST", {
        action: "delete-broadcast",
        id
      });
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  return (
    <SuperAdminPageLayout
      title="Broadcast Global"
      description="Route broadcast global dipulihkan kembali sebagai menu khusus Super Admin. Posisi menu ini dipisah dari database dan overview sesuai dokumen final."
      actions={[
        { href: "/super-admin/dashboard", label: "Kembali ke Overview" },
        { href: "/super-admin/gas/support", label: "Buka Support Tools" },
      ]}
    >
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur h-fit">
          <div className="text-sm font-semibold text-white mb-4">Buat Broadcast Baru</div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold tracking-widest text-slate-400 mb-1">JUDUL</label>
              <input
                required
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white focus:border-blue-500 focus:outline-none"
                placeholder="Judul Pengumuman"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-widest text-slate-400 mb-1">TARGET SEKOLAH (ID atau ALL)</label>
              <input
                required
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white focus:border-blue-500 focus:outline-none"
                placeholder="ALL atau schoolId"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-widest text-slate-400 mb-1">PESAN</label>
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full h-32 rounded-xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white focus:border-blue-500 focus:outline-none"
                placeholder="Isi pesan broadcast..."
              />
            </div>
            {statusMsg && (
              <div className={`text-sm ${statusMsg.startsWith("Error") ? "text-red-400" : "text-emerald-400"}`}>
                {statusMsg}
              </div>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="w-full rounded-xl bg-blue-500 hover:bg-blue-600 p-3 text-sm font-semibold text-white transition disabled:opacity-50"
            >
              {isSaving ? "Mengirim..." : "Kirim Broadcast"}
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-900/60 shadow-xl backdrop-blur">
          <div className="border-b border-white/10 px-6 py-4">
            <div className="text-sm font-semibold text-white">Daftar Broadcast Terakhir</div>
          </div>
          <div className="divide-y divide-white/5">
            {broadcasts.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-400">Belum ada broadcast.</div>
            ) : (
              broadcasts.map((b) => (
                <div key={b.id} className="p-6 hover:bg-white/5 transition flex justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-white">{b.title}</h3>
                    <div className="mt-1 text-xs text-slate-400 flex items-center gap-2">
                      <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">{b.target}</span>
                      <span>•</span>
                      <span>{new Date(b.createdAt).toLocaleString("id-ID")}</span>
                    </div>
                    <p className="mt-3 text-sm text-slate-300 whitespace-pre-wrap">{b.message}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="shrink-0 h-fit rounded-lg px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition"
                  >
                    Hapus
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </SuperAdminPageLayout>
  );
}
