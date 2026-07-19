"use client";

import { useState } from "react";
import { ShieldAlert, Trash2, Plus } from "lucide-react";
import QRCode from "react-qr-code";

const calculateDuration = (start: string, end: string) => {
  if (!start || !end) return 0;
  const [h1, m1] = start.split(":").map(Number);
  const [h2, m2] = end.split(":").map(Number);
  const t1 = h1 * 60 + m1;
  const t2 = h2 * 60 + m2;
  return t2 >= t1 ? t2 - t1 : (24 * 60 - t1) + t2;
};

export function EduLockCodesPanel({ schoolId }: { schoolId: string }) {
  const [startTimeInput, setStartTimeInput] = useState("07:00");
  const [endTimeInput, setEndTimeInput] = useState("14:00");
  const [loading, setLoading] = useState(false);

  const [codes, setCodes] = useState([
    {
      code: "EDULOCK-2839",
      sessionStart: "07:00",
      sessionEnd: "08:00",
      duration: 60,
      expiresAt: Date.now() + 1000 * 60 * 60 * 24, // tomorrow
    }
  ]);

  const handleCreateCode = () => {
    setLoading(true);
    setTimeout(() => {
      const newCodeStr = "EDULOCK-" + Math.floor(1000 + Math.random() * 9000);
      const newCode = {
        code: newCodeStr,
        sessionStart: startTimeInput,
        sessionEnd: endTimeInput,
        duration: calculateDuration(startTimeInput, endTimeInput),
        expiresAt: Date.now() + 1000 * 60 * 60 * 24, 
      };
      setCodes([newCode, ...codes]);
      setLoading(false);
    }, 500);
  };

  const handleDeleteExpiredCodes = () => {
    setCodes(codes.filter(c => Date.now() <= c.expiresAt));
  };

  const handleDeleteCode = (codeToRemove: string) => {
    setCodes(codes.filter(c => c.code !== codeToRemove));
  };

  const isExpired = (expiresAt: number) => {
    return Date.now() > expiresAt;
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-[#1e293b]/50 overflow-hidden backdrop-blur-xl shadow-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Generate Kode Baru</h3>
        <div className="grid gap-4 md:grid-cols-3 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Jam Mulai</label>
            <input 
              type="time" 
              value={startTimeInput} 
              onChange={(e) => setStartTimeInput(e.target.value)} 
              className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-2.5 text-white outline-none focus:border-indigo-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Jam Akhir</label>
            <input 
              type="time" 
              value={endTimeInput} 
              onChange={(e) => setEndTimeInput(e.target.value)} 
              className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-2.5 text-white outline-none focus:border-indigo-500" 
            />
          </div>
          <div className="flex gap-2">
            <button 
              type="button" 
              onClick={handleCreateCode} 
              disabled={loading} 
              className="flex-1 flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? "Memproses..." : (
                <>
                  <Plus className="w-5 h-5 mr-2" /> Generate
                </>
              )}
            </button>
            <button 
              type="button" 
              onClick={handleDeleteExpiredCodes} 
              disabled={loading} 
              className="flex-shrink-0 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
              title="Hapus semua kode expired"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#1e293b]/50 overflow-hidden backdrop-blur-xl shadow-xl">
        <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
          <h3 className="font-semibold text-white">Daftar Kode Aktif</h3>
          <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300">
            {codes.length}
          </span>
        </div>
        <div className="divide-y divide-white/10">
          {codes.length === 0 ? (
            <div className="p-6 text-center text-slate-400">Tidak ada kode aktif saat ini.</div>
          ) : (
            codes.map((item: any) => (
              <div key={item.code} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-5">
                  <div className="bg-white p-2 rounded-xl">
                    <QRCode value={String(item.code)} size={88} />
                  </div>
                  <div>
                    <div className="text-xl font-bold tracking-widest text-white">{item.code}</div>
                    <div className="text-sm text-slate-300 mt-1">
                      {item.sessionStart || "-"} - {item.sessionEnd || "-"} • {item.duration ? `${item.duration} menit` : "-"}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Expired: {item.expiresAt ? new Date(item.expiresAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-"}
                    </div>
                    {isExpired(item.expiresAt) && <div className="text-xs text-rose-300 font-semibold mt-1">Expired</div>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    type="button" 
                    onClick={() => handleDeleteCode(String(item.code))} 
                    className="flex items-center justify-center rounded-xl bg-rose-600/20 text-rose-300 hover:bg-rose-600/40 px-4 py-2 font-semibold transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Hapus
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
