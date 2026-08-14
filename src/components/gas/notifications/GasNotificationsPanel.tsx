import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Send, Bell, Trash2, History, Users, School, GraduationCap, CheckCircle, User, RefreshCw } from "lucide-react";
import { useGasNotifications, NotificationTargetType } from "@/hooks/gas/notifications/useGasNotifications";
import { getStudentClassLabel, useNotificationRecipients } from "@/hooks/gas/notifications/useNotificationRecipients";
import { useAuthStore } from "@/store/useAuthStore";

interface GasNotificationsPanelProps {
  schoolId: string;
}

export const GasNotificationsPanel: React.FC<GasNotificationsPanelProps> = ({ schoolId }) => {
  const { user } = useAuthStore();
  const { notifications, isLoading, error, fetchNotifications, sendNotification, deleteNotification, clearHistory } = useGasNotifications(schoolId);
  const {
    classes,
    students,
    isLoading: loadingRecipients,
    error: recipientsError,
    refresh: refreshRecipients,
  } = useNotificationRecipients(schoolId);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState<NotificationTargetType>('TEACHERS');
  const [targetValue, setTargetValue] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  const handleRefresh = async () => {
    await Promise.all([fetchNotifications(), refreshRecipients()]);
  };

  useEffect(() => {
    if (schoolId) {
      void fetchNotifications();
    }
  }, [schoolId, fetchNotifications]);

  const normalizeIdentity = (value: unknown) => String(value || "").trim();

  // Filtered students for search
  const filteredStudents = useMemo(() => {
    const query = studentSearch.toLowerCase();
    if (!query) return [];
    return students
      .filter((s) =>
        (s.name || "").toLowerCase().includes(query) ||
        (s.nisn || "").includes(studentSearch) ||
        getStudentClassLabel(s).toLowerCase().includes(query)
      )
      .slice(0, 10);
  }, [students, studentSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    if (targetType === 'CLASS' && !targetValue) {
      alert('Silakan pilih kelas tujuan');
      return;
    }

    if (targetType === 'SPECIFIC_STUDENT' && !targetValue) {
      alert('Silakan pilih siswa tujuan');
      return;
    }

    let targetName = undefined;
    if (targetType === 'CLASS') {
      targetName = targetValue;
    } else if (targetType === 'SPECIFIC_STUDENT') {
      const selectedStudent = students.find(
        (student) => normalizeIdentity(student.id) === normalizeIdentity(targetValue)
          || normalizeIdentity(student.nisn) === normalizeIdentity(targetValue)
      );
      targetName = selectedStudent ? `${selectedStudent.name} (${getStudentClassLabel(selectedStudent)})` : 'Siswa Tidak Dikenal';
    }

    const success = await sendNotification(
      title,
      message,
      targetType,
      targetValue,
      targetName,
      user?.name || 'Admin GAS'
    );

    if (success) {
      setTitle('');
      setMessage('');
      setTargetValue('');
      setStudentSearch('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const getTargetLabel = (type: NotificationTargetType, name?: string) => {
    switch (type) {
      case 'TEACHERS': return 'Semua Wali Kelas & Guru';
      case 'ALL_CLASSES': return 'Semua Kelas';
      case 'CLASS': return `Kelas ${name}`;
      case 'SPECIFIC_STUDENT': return `Siswa: ${name}`;
      case 'STUDENTS': return 'Semua Siswa'; // Fallback
      default: return type;
    }
  };

  const getTargetIcon = (type: NotificationTargetType) => {
    switch (type) {
      case 'ALL_CLASSES': return <School className="w-4 h-4" />;
      case 'STUDENTS': return <GraduationCap className="w-4 h-4" />;
      case 'SPECIFIC_STUDENT': return <User className="w-4 h-4" />;
      case 'TEACHERS': return <Users className="w-4 h-4" />;
      case 'CLASS': return <Users className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900/30 p-6 space-y-6 overflow-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-500" />
            Broadcast Notifikasi
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Kirim pengumuman penting ke wali kelas, siswa, atau kelas tertentu.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => void handleRefresh()}
            disabled={isLoading || loadingRecipients}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading || loadingRecipients ? 'animate-spin' : ''}`} />
            Muat Ulang
          </button>
          <Link
            href="/dashboard"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
          >
            Kembali ke Dashboard Satu Pintu
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchNotifications} className="underline hover:text-red-300">Coba Lagi</button>
        </div>
      )}

      {recipientsError && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm rounded-lg flex items-center justify-between">
          <span>{recipientsError}</span>
          <button onClick={() => void refreshRecipients()} className="underline hover:text-amber-200">Muat Ulang Referensi</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-effect-dark-card rounded-xl shadow-sm border border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Send className="w-5 h-5 text-slate-400" />
              Buat Pengumuman Baru
            </h2>

            {showSuccess && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4" />
                Notifikasi berhasil dikirim ke inbox penerima!
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-slate-100">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Judul Pengumuman</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-900/50 text-slate-100 placeholder:text-slate-500"
                  placeholder="Contoh: Pengumuman Upacara Senin"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Target Penerima</label>
                <select
                  value={targetType}
                  onChange={(e) => {
                    setTargetType(e.target.value as NotificationTargetType);
                    setTargetValue('');
                    setStudentSearch('');
                  }}
                  className="w-full px-3 py-2 border border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-900/50 text-slate-100"
                >
                  <option value="TEACHERS" className="bg-slate-800 text-slate-100">Wali Kelas</option>
                  <option value="SPECIFIC_STUDENT" className="bg-slate-800 text-slate-100">Siswa Tertentu</option>
                  <option value="CLASS" className="bg-slate-800 text-slate-100">Kelas Tertentu</option>
                  <option value="ALL_CLASSES" className="bg-slate-800 text-slate-100">Semua Kelas</option>
                </select>
              </div>

              {/* Class Selector */}
              {targetType === 'CLASS' && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Pilih Kelas</label>
                  <select
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-900/50 text-slate-100"
                    required
                  >
                    <option value="" className="text-slate-500">-- Pilih Kelas --</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.name} className="bg-slate-800 text-slate-100">{cls.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Student Selector */}
              {targetType === 'SPECIFIC_STUDENT' && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Cari Siswa</label>
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all mb-2 bg-slate-900/50 text-slate-100 placeholder:text-slate-500"
                    placeholder="Ketik nama, NISN, atau kelas..."
                  />
                  
                  {studentSearch && !targetValue && (
                    <div className="border border-slate-700 rounded-lg max-h-40 overflow-y-auto bg-slate-800">
                      {loadingRecipients ? (
                        <div className="p-3 text-sm text-slate-400 text-center">Memuat data siswa...</div>
                      ) : filteredStudents.length > 0 ? (
                        filteredStudents.map(s => (
                          <div 
                            key={s.id}
                            onClick={() => {
                              setTargetValue(s.id);
                              setStudentSearch(`${s.name} (${getStudentClassLabel(s)})`);
                            }}
                            className="p-2 text-sm cursor-pointer hover:bg-indigo-900/50 flex justify-between items-center text-slate-200 border-b border-slate-700 last:border-0"
                          >
                            <span>{s.name}</span>
                            <span className="text-xs text-slate-400">{getStudentClassLabel(s) || "-"}</span>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-sm text-slate-400 text-center">Tidak ada siswa ditemukan</div>
                      )}
                    </div>
                  )}
                  {targetValue && (
                     <div className="text-sm text-emerald-400 mt-2 flex items-center gap-1 bg-emerald-500/10 p-2 rounded-md border border-emerald-500/20">
                        <CheckCircle className="w-4 h-4" /> 
                        Siswa terpilih
                     </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Isi Pesan</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none bg-slate-900/50 text-slate-100 placeholder:text-slate-500"
                  placeholder="Tulis pesan lengkap di sini..."
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>Memproses...</>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Kirim Broadcast
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* History Section */}
        <div className="lg:col-span-2">
          <div className="glass-effect-dark-card rounded-xl shadow-sm border border-slate-700 flex flex-col h-full">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <History className="w-5 h-5 text-slate-400" />
                Riwayat Broadcast
              </h2>
              {notifications.length > 0 && (
                <button 
                  onClick={() => {
                    if (confirm('Hapus semua riwayat notifikasi secara permanen?')) {
                      void clearHistory();
                    }
                  }}
                  className="text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 px-3 py-1.5 rounded-md transition-colors"
                >
                  Hapus Semua
                </button>
              )}
            </div>

            <div className="flex-1 p-6 overflow-y-auto max-h-[600px] scrollbar-hide">
              {notifications.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4 border border-slate-700">
                    <Bell className="w-8 h-8 text-slate-500" />
                  </div>
                  <p className="text-slate-300 font-medium">Belum ada riwayat</p>
                  <p className="text-sm mt-1">Notifikasi yang Anda kirim akan muncul di sini.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="group flex gap-4 p-4 rounded-xl border border-slate-700 hover:border-slate-600 transition-all bg-slate-800/40 hover:bg-slate-800/60">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                          {getTargetIcon(notif.targetType)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-bold text-slate-200 truncate pr-4">{notif.title}</h3>
                          <span className="text-xs text-slate-400 whitespace-nowrap">
                            {new Date(notif.sentAt).toLocaleString('id-ID', { 
                              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
                            })}
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold text-indigo-400 mt-1 mb-2 flex items-center gap-1.5">
                          Kepada: {getTargetLabel(notif.targetType, notif.targetName || notif.targetValue)}
                          <span className="text-slate-600">•</span>
                          Dari: {notif.senderName}
                          {typeof notif.recipientCount === 'number' ? (
                            <>
                              <span className="text-slate-600">•</span>
                              Terkirim ke {notif.recipientCount} penerima
                            </>
                          ) : null}
                        </p>
                        <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                          {notif.message}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if(confirm('Hapus notifikasi ini dari riwayat?')) {
                            void deleteNotification(notif.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all self-start flex-shrink-0"
                        title="Hapus notifikasi ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
