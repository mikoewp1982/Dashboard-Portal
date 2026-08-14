"use client";

type GradeFilterProps = {
  selectedGrade: number;
  onChange: (grade: number) => void;
};

export function GradeFilter({ selectedGrade, onChange }: GradeFilterProps) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      {[7, 8, 9].map((grade) => (
        <button
          key={grade}
          type="button"
          onClick={() => onChange(grade)}
          className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
            selectedGrade === grade
              ? "bg-indigo-600/40 text-indigo-200 ring-1 ring-indigo-500/40"
              : "bg-white/5 text-slate-300 ring-1 ring-white/10 hover:bg-white/10"
          }`}
        >
          Kelas {grade}
        </button>
      ))}
    </div>
  );
}
