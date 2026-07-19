"use client";

import { useState, useMemo } from "react";
import { useGasSevenHabits, TeacherRubric } from "@/hooks/gas/seven-habits/useGasSevenHabits";
import { useGasStudents } from "@/hooks/gas/useGasStudents";
import { Loader2 } from "lucide-react";
import { exportToExcel } from "@/utils/export";
import { calculateHabitGrades } from "@/utils/grading7Habits";
import { useEffect } from "react";
import {
  DAYS,
  DEFAULT_TEACHER_RUBRIC,
  MONTHS,
  getClassGradeBucket,
  getTeacherRatingKeyCandidates,
  matchesStudentIdentity,
  normalizeIdentity,
} from "./sevenHabitsConfig";
import { SevenHabitsRubricModal } from "./SevenHabitsRubricModal";
import { SevenHabitsControls } from "./SevenHabitsControls";
import { SevenHabitsContent } from "./SevenHabitsContent";

export function Gas7HabitsPanel({ schoolId }: { schoolId: string }) {
  const { data: students, loading: studentsLoading } = useGasStudents(schoolId);
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedWeek, setSelectedWeek] = useState<number>(Math.ceil(currentDate.getDate() / 7));
  const [selectedDayName, setSelectedDayName] = useState<string>(DAYS[currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1]);
  const { logs, teacherRatings, loading: habitsLoading, setTeacherRating, refresh } = useGasSevenHabits(
    schoolId,
    selectedMonth,
    selectedYear
  );
  const [viewMode, setViewMode] = useState<'monitoring' | 'grading'>('monitoring');

  const [selectedGrade, setSelectedGrade] = useState<"VII" | "VIII" | "IX">("VII");
  const [selectedClassName, setSelectedClassName] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  const [isRubricModalOpen, setIsRubricModalOpen] = useState(false);
  const [currentStudentForRubric, setCurrentStudentForRubric] = useState<{id: string, name: string} | null>(null);
  const [rubricValues, setRubricValues] = useState<TeacherRubric>(DEFAULT_TEACHER_RUBRIC);
  const [isSubmittingRubric, setIsSubmittingRubric] = useState(false);

  const uniqueClasses = useMemo(() => {
    return Array.from(new Set(students.map((s: any) => s.kelas || s.class || "Unknown").filter(c => c !== "Unknown")));
  }, [students]);

  const gradeClasses = useMemo(() => {
    return uniqueClasses.filter(c => {
      return getClassGradeBucket(c) === selectedGrade;
    }).sort((a, b) => (a as string).localeCompare(b as string));
  }, [uniqueClasses, selectedGrade]);

  useEffect(() => {
    if (gradeClasses.length > 0 && !gradeClasses.includes(selectedClassName)) {
      setSelectedClassName(gradeClasses[0] as string);
    } else if (gradeClasses.length === 0) {
      setSelectedClassName("");
    }
  }, [gradeClasses, selectedClassName]);

  useEffect(() => {
    setSelectedStudentId("");
  }, [selectedClassName]);

  const classStudents = useMemo(() => {
    return students.filter((s: any) => (s.kelas || s.class) === selectedClassName);
  }, [students, selectedClassName]);

  const gradingData = useMemo(() => {
    return classStudents.map((student: any) => {
      const studentLogs = logs.filter((log) => {
        return (
          matchesStudentIdentity(student, log.studentId) &&
          log.month === selectedMonth &&
          log.year === selectedYear
        );
      });

      const storedRubric = getTeacherRatingKeyCandidates(student, selectedMonth, selectedYear)
        .map((key) => teacherRatings[key])
        .find(Boolean);
      const teacherRating = storedRubric?.total || 0;

      return {
        student,
        rubric: storedRubric || null,
        ...calculateHabitGrades(studentLogs, teacherRating),
      };
    });
  }, [classStudents, logs, selectedMonth, selectedYear, teacherRatings]);

  const openRubricModal = (studentId: string, studentName: string) => {
    const student = students.find((item: any) => normalizeIdentity(item.id) === normalizeIdentity(studentId));
    const existingRubric = getTeacherRatingKeyCandidates(
      { id: studentId, nisn: student?.nisn },
      selectedMonth,
      selectedYear
    ).map((key) => teacherRatings[key]).find(Boolean);
    
    if (existingRubric) {
      setRubricValues(existingRubric);
    } else {
      setRubricValues(DEFAULT_TEACHER_RUBRIC);
    }
    
    setCurrentStudentForRubric({ id: studentId, name: studentName });
    setIsRubricModalOpen(true);
  };

  const updateRubricValue = (field: keyof Omit<TeacherRubric, 'total'>, value: number) => {
    const newValue = Math.min(25, Math.max(0, value));
    setRubricValues(prev => {
      const updated = { ...prev, [field]: newValue };
      updated.total = updated.honesty + updated.behavior + updated.initiative + updated.commitment;
      return updated;
    });
  };

  const saveRubric = async () => {
    if (currentStudentForRubric) {
      setIsSubmittingRubric(true);
      try {
        await setTeacherRating(currentStudentForRubric.id, selectedMonth, selectedYear, rubricValues);
        alert("Nilai guru berhasil disimpan.");
        setIsRubricModalOpen(false);
      } catch (error: any) {
        alert(error?.message || "Gagal menyimpan nilai guru.");
      } finally {
        setIsSubmittingRubric(false);
      }
    }
  };

  const getStudentLogByDate = (studentId: string, date: number) => {
    const student = classStudents.find((item: any) => normalizeIdentity(item.id) === normalizeIdentity(studentId));
    if (!student) return undefined;

    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    return logs.find(l => matchesStudentIdentity(student, l.studentId) && l.date === dateStr);
  };

  const daysInSelectedMonth = useMemo(() => {
    return Array.from(
      { length: new Date(selectedYear, selectedMonth, 0).getDate() }, 
      (_, i) => i + 1
    );
  }, [selectedYear, selectedMonth]);

  const selectedStudent = useMemo(() => {
    return classStudents.find((student: any) => normalizeIdentity(student.id) === normalizeIdentity(selectedStudentId));
  }, [classStudents, selectedStudentId]);

  const selectedStudentGrading = useMemo(() => {
    return gradingData.find((item) => matchesStudentIdentity(item.student, selectedStudentId));
  }, [gradingData, selectedStudentId]);

  const handleExport = () => {
    if (viewMode === 'grading') {
      const exportData = gradingData.map((data) => {
        const student = data.student;
        return {
          'Nama Siswa': student.name,
          'NISN': student.nisn,
          'Kelas': student.kelas || student.class,
          'Periode': `${MONTHS[selectedMonth-1]} ${selectedYear}`,
          'Konsistensi Harian (40%)': data.dailyConsistency.toFixed(1),
          'Progress Mingguan (30%)': data.weeklyProgress.toFixed(1),
          'Pencapaian Bulanan (20%)': data.monthlyAchievement.toFixed(1),
          'Nilai Guru (10%)': data.teacherRating,
          'Nilai Akhir': data.finalScore.toFixed(1),
          'Predikat': data.predicate,
          'Kategori': data.category
        };
      });
      exportToExcel(exportData, `Nilai_7Habits_${selectedClassName}_${MONTHS[selectedMonth-1]}_${selectedYear}`);
      return;
    }

    const exportData = classStudents.map((student: any) => {
      const log = logs.find(l => {
        if (!matchesStudentIdentity(student, l.studentId)) return false;
        if (l.year !== selectedYear) return false;
        if (l.month !== selectedMonth) return false;
        if (l.week !== selectedWeek) return false;
        
        const [y, m, d] = l.date.split('-').map(Number);
        const logDate = new Date(y, m - 1, d);
        const dayIndex = logDate.getDay() === 0 ? 6 : logDate.getDay() - 1;
        return DAYS[dayIndex] === selectedDayName;
      });
      const habits = log?.habits;
      
      return {
        'Nama Siswa': student.name,
        'NISN': student.nisn,
        'Kelas': student.kelas || student.class,
        'Tanggal': `${selectedDayName}, ${selectedWeek} ${MONTHS[selectedMonth-1]} ${selectedYear}`,
        'Bangun Pagi': habits?.habit1 ? 'Ya' : 'Tidak',
        'Beribadah': habits?.habit2 ? 'Ya' : 'Tidak',
        'Berolahraga': habits?.habit3 ? 'Ya' : 'Tidak',
        'Makan Sehat': habits?.habit4 ? 'Ya' : 'Tidak',
        'Gemar Belajar': habits?.habit5 ? 'Ya' : 'Tidak',
        'Bermasyarakat': habits?.habit6 ? 'Ya' : 'Tidak',
        'Tidur Awal': habits?.habit7 ? 'Ya' : 'Tidak',
      };
    });

    exportToExcel(exportData, `Laporan_7Habits_${selectedClassName}_${selectedDayName}_${MONTHS[selectedMonth-1]}_${selectedYear}`);
  };

  const handlePrint = () => {
    window.print();
  };

  if (studentsLoading || habitsLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#0b1221]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-6 space-y-6 overflow-y-auto bg-[#0b1221]">
      <SevenHabitsControls
        viewMode={viewMode}
        habitsLoading={habitsLoading}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        selectedWeek={selectedWeek}
        selectedDayName={selectedDayName}
        selectedGrade={selectedGrade}
        gradeClasses={gradeClasses}
        selectedClassName={selectedClassName}
        classStudents={classStudents}
        selectedStudentId={selectedStudentId}
        onViewModeChange={setViewMode}
        onRefresh={() => void refresh()}
        onExport={handleExport}
        onPrint={handlePrint}
        onYearChange={setSelectedYear}
        onMonthChange={setSelectedMonth}
        onWeekChange={setSelectedWeek}
        onDayChange={setSelectedDayName}
        onGradeChange={setSelectedGrade}
        onClassChange={setSelectedClassName}
        onStudentChange={setSelectedStudentId}
      />

      <SevenHabitsContent
        viewMode={viewMode}
        selectedStudentId={selectedStudentId}
        selectedStudent={selectedStudent}
        selectedStudentGrading={selectedStudentGrading}
        selectedClassName={selectedClassName}
        selectedGrade={selectedGrade}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        selectedWeek={selectedWeek}
        selectedDayName={selectedDayName}
        classStudents={classStudents}
        logs={logs}
        gradingData={gradingData}
        daysInSelectedMonth={daysInSelectedMonth}
        getStudentLogByDate={getStudentLogByDate}
        onOpenRubricModal={openRubricModal}
      />

      <SevenHabitsRubricModal
        isOpen={isRubricModalOpen && !!currentStudentForRubric}
        studentName={currentStudentForRubric?.name || ""}
        rubricValues={rubricValues}
        isSubmitting={isSubmittingRubric}
        onClose={() => setIsRubricModalOpen(false)}
        onValueChange={updateRubricValue}
        onSave={saveRubric}
      />
    </div>
  );
}
