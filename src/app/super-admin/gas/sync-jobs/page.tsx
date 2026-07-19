"use client";

import { useState, useEffect } from "react";
import { SuperAdminPageLayout } from "@/components/super-admin/SuperAdminPageLayout";
import { callSuperAdminApi } from "@/lib/callSuperAdminApi";
import { rtdb } from "@/lib/firebase/client";
import { ref, onValue } from "firebase/database";

export default function SuperAdminSyncJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [schoolId, setSchoolId] = useState("");
  const [jobType, setJobType] = useState("MASTER_DATA");
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    const jobsRef = ref(rtdb, 'gas/sync_jobs');
    const unsubscribe = onValue(jobsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const arr = Object.values(data).sort((a: any, b: any) => b.createdAt - a.createdAt);
        setJobs(arr);
      } else {
        setJobs([]);
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
        action: "create-sync-job",
        schoolId,
        jobType
      });
      setStatusMsg("Job berhasil dibuat dan diantrekan!");
      setSchoolId("");
    } catch (e: any) {
      setStatusMsg(`Error: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await callSuperAdminApi("POST", {
        action: "set-sync-job-status",
        id,
        status
      });
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  return (
    <SuperAdminPageLayout
      title="Sync Jobs"
      description="Monitoring job background lintas tenant sesuai route final dokumen."
      actions={[
        { href: "/super-admin/dashboard", label: "Kembali ke Overview" },
        { href: "/super-admin/service-status", label: "Lihat Service Status" },
      ]}
    >
      <div className="grid gap-6 md:grid-cols-3">
        <section className="md:col-span-1 rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur h-fit">
          <div className="text-sm font-semibold text-white mb-4">Buat Sync Job Baru</div>
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
              <label className="block text-xs font-semibold tracking-widest text-slate-400 mb-1">TIPE JOB</label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="MASTER_DATA">MASTER_DATA</option>
                <option value="ATTENDANCE">ATTENDANCE</option>
                <option value="USERS">USERS</option>
              </select>
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
              {isSaving ? "Memproses..." : "Buat Job"}
            </button>
          </form>
        </section>

        <section className="md:col-span-2 rounded-3xl border border-white/10 bg-slate-900/60 shadow-xl backdrop-blur overflow-hidden">
          <div className="border-b border-white/10 px-6 py-4">
            <div className="text-sm font-semibold text-white">Daftar Antrean Sync</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-white/5 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-semibold">Waktu</th>
                  <th className="px-6 py-4 font-semibold">Sekolah</th>
                  <th className="px-6 py-4 font-semibold">Tipe Job</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {jobs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      Belum ada antrean job.
                    </td>
                  </tr>
                ) : (
                  jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-white/5">
                      <td className="px-6 py-4 whitespace-nowrap">{new Date(job.createdAt).toLocaleString("id-ID")}</td>
                      <td className="px-6 py-4 font-medium text-white">{job.schoolId}</td>
                      <td className="px-6 py-4">{job.jobType}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          job.status === "QUEUED" ? "bg-amber-500/20 text-amber-300" :
                          job.status === "RUNNING" ? "bg-blue-500/20 text-blue-300" :
                          job.status === "COMPLETED" ? "bg-emerald-500/20 text-emerald-300" :
                          "bg-red-500/20 text-red-300"
                        }`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={job.status}
                          onChange={(e) => handleUpdateStatus(job.id, e.target.value)}
                          className="bg-slate-800 text-xs text-white rounded p-1 border border-white/10 focus:outline-none"
                        >
                          <option value="QUEUED">QUEUED</option>
                          <option value="RUNNING">RUNNING</option>
                          <option value="COMPLETED">COMPLETED</option>
                          <option value="FAILED">FAILED</option>
                        </select>
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
