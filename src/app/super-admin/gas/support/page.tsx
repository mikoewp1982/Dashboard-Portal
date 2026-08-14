"use client";

import { useState, useEffect } from "react";
import { SuperAdminPageLayout } from "@/components/super-admin/SuperAdminPageLayout";
import { callSuperAdminApi } from "@/lib/callSuperAdminApi";
import { rtdb } from "@/lib/firebase/client";
import { ref, onValue } from "firebase/database";

export default function SuperAdminSupportPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [schoolId, setSchoolId] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    const reqRef = ref(rtdb, 'gas/support_requests');
    const unsubscribe = onValue(reqRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const arr = Object.values(data).sort((a: any, b: any) => b.createdAt - a.createdAt);
        setRequests(arr);
      } else {
        setRequests([]);
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
        action: "create-support-request",
        schoolId,
        title,
        notes
      });
      setStatusMsg("Tiket support berhasil dibuat!");
      setSchoolId("");
      setTitle("");
      setNotes("");
    } catch (e: any) {
      setStatusMsg(`Error: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await callSuperAdminApi("POST", {
        action: "set-support-request-status",
        id,
        status
      });
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus tiket support ini?")) return;
    try {
      await callSuperAdminApi("POST", {
        action: "delete-support-request",
        id
      });
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  return (
    <SuperAdminPageLayout
      title="Support Tools"
      description="Antrian dukungan operasional lintas tenant. Menu ini kembali berdiri sendiri sesuai struktur final Super Admin."
      actions={[
        { href: "/super-admin/dashboard", label: "Kembali ke Overview" },
        { href: "/super-admin/service-status", label: "Lihat Service Status" },
      ]}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-1 rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur h-fit">
          <div className="text-sm font-semibold text-white mb-4">Buat Tiket Support Baru</div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold tracking-widest text-slate-400 mb-1">TARGET SEKOLAH (ID)</label>
              <input
                required
                type="text"
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white focus:border-blue-500 focus:outline-none"
                placeholder="schoolId"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-widest text-slate-400 mb-1">JUDUL KENDALA</label>
              <input
                required
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white focus:border-blue-500 focus:outline-none"
                placeholder="Contoh: Sinkronisasi gagal"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-widest text-slate-400 mb-1">CATATAN TAMBAHAN</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-24 rounded-xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white focus:border-blue-500 focus:outline-none"
                placeholder="Catatan detail..."
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
              {isSaving ? "Menyimpan..." : "Buat Tiket"}
            </button>
          </form>
        </section>

        <section className="lg:col-span-2 rounded-3xl border border-white/10 bg-slate-900/60 shadow-xl backdrop-blur overflow-hidden">
          <div className="border-b border-white/10 px-6 py-4">
            <div className="text-sm font-semibold text-white">Daftar Tiket Terbuka</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-white/5 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-semibold">Sekolah</th>
                  <th className="px-6 py-4 font-semibold">Kendala</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                      Belum ada tiket support.
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id} className="hover:bg-white/5">
                      <td className="px-6 py-4 font-medium text-white">{req.schoolId}</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{req.title}</div>
                        <div className="text-xs text-slate-400 mt-1">{new Date(req.createdAt).toLocaleString("id-ID")}</div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={req.status}
                          onChange={(e) => handleUpdateStatus(req.id, e.target.value)}
                          className={`text-xs font-semibold rounded p-1 border border-white/10 focus:outline-none ${
                            req.status === "OPEN" ? "bg-amber-500/20 text-amber-300" :
                            req.status === "DONE" ? "bg-emerald-500/20 text-emerald-300" :
                            "bg-slate-500/20 text-slate-300"
                          }`}
                        >
                          <option value="OPEN">OPEN</option>
                          <option value="DONE">DONE</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDelete(req.id)}
                          className="text-xs font-semibold text-red-400 hover:text-red-300 transition"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </SuperAdminPageLayout>
  );
}
