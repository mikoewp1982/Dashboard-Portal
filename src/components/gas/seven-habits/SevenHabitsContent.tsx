"use client";

import { Check, Edit } from "lucide-react";
import { DAYS, MONTHS, WEEKS, matchesStudentIdentity, normalizeIdentity } from "./sevenHabitsConfig";

interface SevenHabitsContentProps {
  viewMode: "monitoring" | "grading";
  selectedStudentId: string;
  selectedStudent: any;
  selectedStudentGrading: any;
  selectedClassName: string;
  selectedGrade: "VII" | "VIII" | "IX";
  selectedMonth: number;
  selectedYear: number;
  selectedWeek: number;
  selectedDayName: string;
  classStudents: any[];
  logs: any[];
  gradingData: any[];
  daysInSelectedMonth: number[];
  getStudentLogByDate: (studentId: string, date: number) => any;
  onOpenRubricModal: (studentId: string, studentName: string) => void;
}

export function SevenHabitsContent(props: SevenHabitsContentProps) {
  const {
    viewMode,
    selectedStudentId,
    selectedStudent,
    selectedStudentGrading,
    selectedClassName,
    selectedGrade,
    selectedMonth,
    selectedYear,
    selectedWeek,
    selectedDayName,
    classStudents,
    logs,
    gradingData,
    daysInSelectedMonth,
    getStudentLogByDate,
    onOpenRubricModal,
  } = props;

  return (
    <>
      <div className="mb-8 hidden print:block">
        <div className="mb-4 border-b-2 border-gray-800 pb-4 text-center">
          <h1 className="text-xl font-bold uppercase">Pemerintah Kabupaten Mojokerto</h1>
          <h2 className="text-2xl font-bold uppercase">UPT SMP Negeri 3 Pacet</h2>
          <p className="text-sm">Jl. Raya Pacet No. 12, Kec. Pacet, Kab. Mojokerto, Jawa Timur</p>
          <p className="text-sm italic">Website: www.smpn3pacet.sch.id | Email: info@smpn3pacet.sch.id</p>
        </div>
        <div className="mb-6 text-center">
          <h3 className="text-lg font-bold underline">LAPORAN CAPAIAN 7 KEBIASAAN ANAK INDONESIA HEBAT (7 KAIH)</h3>
          {!selectedStudentId ? (
            <p className="mt-1 text-sm">
              Kelas: {selectedClassName || selectedGrade} | Periode: {MONTHS[selectedMonth - 1]} {selectedYear}
              {viewMode === "monitoring" ? ` - ${WEEKS.find((w) => w.value === selectedWeek)?.label} (${selectedDayName})` : ""}
            </p>
          ) : (
            <div className="mt-2 text-sm">
              <p className="text-lg font-bold">{selectedStudent?.name}</p>
              <p>NISN: {selectedStudent?.nisn} | Kelas: {selectedStudent?.kelas || selectedStudent?.class}</p>
              <p>Periode: {MONTHS[selectedMonth - 1]} {selectedYear}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#111827]/80 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {selectedStudentId ? (
            viewMode === "monitoring" ? (
              <table className="w-full">
                <thead className="bg-slate-900/40 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Tanggal</th>
                    <th className="px-3 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Bangun Pagi</th>
                    <th className="px-3 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Beribadah</th>
                    <th className="px-3 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Berolahraga</th>
                    <th className="px-3 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Makan Sehat</th>
                    <th className="px-3 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Gemar Belajar</th>
                    <th className="px-3 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Bermasyarakat</th>
                    <th className="px-3 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Tidur Awal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {daysInSelectedMonth.map((date) => {
                    const log = getStudentLogByDate(selectedStudentId, date);
                    const habits = log?.habits;
                    const dateObj = new Date(selectedYear, selectedMonth - 1, date);
                    const dayName = DAYS[dateObj.getDay() === 0 ? 6 : dateObj.getDay() - 1];

                    return (
                      <tr key={date} className="hover:bg-slate-900/30 transition-colors">
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-slate-100">
                          {date} {MONTHS[selectedMonth - 1]} <span className="text-slate-500 font-medium">({dayName})</span>
                        </td>
                        {[1, 2, 3, 4, 5, 6, 7].map((habitIndex) => (
                          <td key={habitIndex} className="whitespace-nowrap px-3 py-4 text-center">
                            {habits?.[`habit${habitIndex}`] ? (
                              <Check className="mx-auto h-5 w-5 text-green-500" />
                            ) : (
                              <span className="text-slate-700">-</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="p-8">
                {!selectedStudentGrading ? (
                  <div className="text-slate-500 text-center py-8">Data siswa tidak ditemukan</div>
                ) : !selectedStudent ? (
                  <div className="text-slate-500 text-center py-8">Identitas siswa tidak ditemukan</div>
                ) : (
                  <div className="bg-slate-900/50 rounded-2xl p-8 border border-slate-700/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <div className="mb-8">
                          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Siswa</p>
                          <p className="text-2xl font-bold text-slate-100">{selectedStudent.name}</p>
                          <p className="text-slate-400 font-medium">{selectedStudent.nisn} • {selectedStudent.kelas || selectedStudent.class}</p>
                        </div>

                        <div className="space-y-4">
                          <div className="flex justify-between items-center bg-slate-800/30 p-4 rounded-xl border border-slate-700/30">
                            <span className="text-slate-300 font-medium">Predikat</span>
                            <span className={`inline-flex items-center rounded-lg px-3 py-1 text-sm font-bold ${
                              selectedStudentGrading.predicate.startsWith("A") ? "bg-green-500/20 text-green-400" :
                              selectedStudentGrading.predicate.startsWith("B") ? "bg-blue-500/20 text-blue-400" :
                              selectedStudentGrading.predicate.startsWith("C") ? "bg-yellow-500/20 text-yellow-400" :
                              "bg-red-500/20 text-red-400"
                            }`}>
                              {selectedStudentGrading.predicate}
                            </span>
                          </div>
                          <div className="flex justify-between items-center bg-slate-800/30 p-4 rounded-xl border border-slate-700/30">
                            <span className="text-slate-300 font-medium">Nilai Akhir</span>
                            <span className="text-3xl font-black text-blue-400">{selectedStudentGrading.finalScore.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Komponen Nilai</h3>
                        <div className="flex justify-between items-center border-b border-slate-700/50 pb-3">
                          <span className="text-slate-400 font-medium">Konsistensi Harian (40%)</span>
                          <span className="font-bold text-slate-100">{selectedStudentGrading.dailyConsistency.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-700/50 pb-3">
                          <span className="text-slate-400 font-medium">Progress Mingguan (30%)</span>
                          <span className="font-bold text-slate-100">{selectedStudentGrading.weeklyProgress.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-700/50 pb-3">
                          <span className="text-slate-400 font-medium">Pencapaian Bulanan (20%)</span>
                          <span className="font-bold text-slate-100">{selectedStudentGrading.monthlyAchievement.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                          <div>
                            <span className="text-slate-400 font-medium block">Nilai Guru (10%)</span>
                            <span className="text-xs text-slate-500">Berdasarkan rubrik penilaian</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-xl text-slate-100">{selectedStudentGrading.teacherRating}</span>
                            <button
                              onClick={() => onOpenRubricModal(normalizeIdentity(selectedStudent.id), selectedStudent.name || "Tanpa Nama")}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white transition-all border border-blue-500/30 cursor-pointer"
                            >
                              <Edit className="w-4 h-4" />
                              {selectedStudentGrading.teacherRating > 0 ? "Edit" : "Input"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          ) : (
            <table className="min-w-full divide-y divide-gray-300 print:divide-gray-900 print:border print:border-gray-900">
              <thead className="bg-slate-900/30 print:bg-slate-800/50">
                <tr>
                  <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-100 sm:pl-6 print:border print:border-gray-900">No</th>
                  <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-100 sm:pl-6 print:border print:border-gray-900">Nama Siswa</th>
                  {viewMode === "monitoring" ? (
                    <>
                      <th className="px-3 py-3.5 text-center text-sm font-semibold text-slate-100 print:border print:border-gray-900">Bangun Pagi</th>
                      <th className="px-3 py-3.5 text-center text-sm font-semibold text-slate-100 print:border print:border-gray-900">Beribadah</th>
                      <th className="px-3 py-3.5 text-center text-sm font-semibold text-slate-100 print:border print:border-gray-900">Berolahraga</th>
                      <th className="px-3 py-3.5 text-center text-sm font-semibold text-slate-100 print:border print:border-gray-900">Makan Sehat</th>
                      <th className="px-3 py-3.5 text-center text-sm font-semibold text-slate-100 print:border print:border-gray-900">Gemar Belajar</th>
                      <th className="px-3 py-3.5 text-center text-sm font-semibold text-slate-100 print:border print:border-gray-900">Bermasyarakat</th>
                      <th className="px-3 py-3.5 text-center text-sm font-semibold text-slate-100 print:border print:border-gray-900">Tidur Awal</th>
                    </>
                  ) : (
                    <>
                      <th className="px-3 py-3.5 text-center text-sm font-semibold text-slate-100">Konsistensi Harian</th>
                      <th className="px-3 py-3.5 text-center text-sm font-semibold text-slate-100">Progress Mingguan</th>
                      <th className="px-3 py-3.5 text-center text-sm font-semibold text-slate-100">Pencapaian Bulanan</th>
                      <th className="px-3 py-3.5 text-center text-sm font-semibold text-slate-100">Nilai Guru</th>
                      <th className="px-3 py-3.5 text-center text-sm font-semibold text-slate-100">Nilai Akhir</th>
                      <th className="px-3 py-3.5 text-center text-sm font-semibold text-slate-100">Predikat</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 glass-effect-dark-card print:divide-gray-900">
                {classStudents.length === 0 ? (
                  <tr>
                    <td colSpan={viewMode === "monitoring" ? 9 : 8} className="px-6 py-12 text-center text-slate-500 font-medium">
                      Pilih kelas atau belum ada data siswa.
                    </td>
                  </tr>
                ) : classStudents.map((student: any, index: number) => {
                  if (viewMode === "monitoring") {
                    const log = logs.find((item) => {
                      if (!matchesStudentIdentity(student, item.studentId)) return false;
                      if (item.year !== selectedYear || item.month !== selectedMonth || item.week !== selectedWeek) return false;
                      const [y, m, d] = item.date.split("-").map(Number);
                      const logDate = new Date(y, m - 1, d);
                      const dayIndex = logDate.getDay() === 0 ? 6 : logDate.getDay() - 1;
                      return DAYS[dayIndex] === selectedDayName;
                    });
                    const habits = log?.habits;

                    return (
                      <tr key={student.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-100 sm:pl-6 print:border print:border-gray-900">{index + 1}</td>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-100 sm:pl-6 print:border print:border-gray-900">
                          <div className="font-bold text-slate-100">{student.name}</div>
                          <div className="text-xs font-semibold text-slate-400">{student.nisn}</div>
                        </td>
                        {[1, 2, 3, 4, 5, 6, 7].map((habitIndex) => (
                          <td key={habitIndex} className="whitespace-nowrap px-3 py-4 text-sm text-slate-400 text-center print:border print:border-gray-900">
                            {habits?.[`habit${habitIndex}`] ? (
                              <Check className="mx-auto h-5 w-5 text-green-500 print:text-black" />
                            ) : (
                              <span className="text-gray-300 print:text-gray-200">-</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  }

                  const data = gradingData.find((item) => matchesStudentIdentity(item.student, student.id) || matchesStudentIdentity(item.student, student.nisn));
                  if (!data) return null;

                  return (
                    <tr key={student.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-500">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-slate-100">{student.name}</div>
                        <div className="text-xs font-semibold text-slate-400">{student.nisn}</div>
                      </td>
                      <td className="px-3 py-4 text-center font-medium text-slate-300">{data.dailyConsistency.toFixed(1)}</td>
                      <td className="px-3 py-4 text-center font-medium text-slate-300">{data.weeklyProgress.toFixed(1)}</td>
                      <td className="px-3 py-4 text-center font-medium text-slate-300">{data.monthlyAchievement.toFixed(1)}</td>
                      <td className="px-3 py-4 text-center font-bold text-slate-100">{data.teacherRating}</td>
                      <td className="px-3 py-4 text-center font-black text-blue-400">{data.finalScore.toFixed(1)}</td>
                      <td className="px-3 py-4 text-center">
                        <span className={`inline-flex items-center rounded-lg px-3 py-1 text-xs font-bold ${
                          data.predicate.startsWith("A") ? "bg-green-500/20 text-green-400" :
                          data.predicate.startsWith("B") ? "bg-blue-500/20 text-blue-400" :
                          data.predicate.startsWith("C") ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-red-500/20 text-red-400"
                        }`}>
                          {data.predicate}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="hidden print:flex justify-between mt-8 px-8 text-black">
        <div className="text-center w-64">
          <p className="mb-20">Mengetahui,<br />Orang Tua/Wali Murid</p>
          <p className="font-bold underline">.............................................</p>
        </div>
        <div className="text-center w-64">
          <p className="mb-20">
            Pacet, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            <br />
            Wali Kelas {selectedClassName || "-"}
          </p>
          <p className="font-bold underline">.............................................</p>
          <p>NIP. .............................................</p>
        </div>
      </div>
    </>
  );
}
