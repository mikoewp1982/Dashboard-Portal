"use client";

import { DisciplineTable } from "./DisciplineTable";

interface DisciplineRecordsSectionProps {
  selectedClassFilter: string;
  selectedMonth: number;
  selectedYear: number;
  searchQuery: string;
  classOptions: string[];
  monthOptions: string[];
  startYear: number;
  endYear: number;
  dropdownClassName: string;
  dropdownStyle: React.CSSProperties;
  dropdownOptionStyle: React.CSSProperties;
  recordsLoading: boolean;
  rulesLoading: boolean;
  filteredRecords: any[];
  onClassFilterChange: (value: string) => void;
  onMonthChange: (value: number) => void;
  onYearChange: (value: number) => void;
  onSearchChange: (value: string) => void;
  onDeleteRecord: (recordId: string) => Promise<void> | void;
}

export function DisciplineRecordsSection(props: DisciplineRecordsSectionProps) {
  const {
    selectedClassFilter,
    selectedMonth,
    selectedYear,
    searchQuery,
    classOptions,
    monthOptions,
    startYear,
    endYear,
    dropdownClassName,
    dropdownStyle,
    dropdownOptionStyle,
    recordsLoading,
    rulesLoading,
    filteredRecords,
    onClassFilterChange,
    onMonthChange,
    onYearChange,
    onSearchChange,
    onDeleteRecord,
  } = props;

  return (
    <div className="glass-effect-dark-card rounded-3xl p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kelas</p>
          <select
            value={selectedClassFilter}
            onChange={(e) => onClassFilterChange(e.target.value)}
            className={dropdownClassName}
            style={dropdownStyle}
          >
            <option value="">Semua Kelas</option>
            {classOptions.map((name, index) => (
              <option key={`${name}-${index}`} value={name}>{name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bulan</p>
          <select
            value={selectedMonth}
            onChange={(e) => onMonthChange(Number(e.target.value))}
            className={dropdownClassName}
            style={dropdownStyle}
          >
            {monthOptions.map((label, index) => (
              <option key={label} value={index + 1}>{label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tahun</p>
          <select
            value={selectedYear}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className={dropdownClassName}
            style={dropdownStyle}
          >
            {Array.from({ length: endYear - startYear + 1 }).map((_, index) => (
              <option key={startYear + index} value={startYear + index}>{startYear + index}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pencarian</p>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari nama siswa..."
            className="w-full px-4 py-3 border border-slate-700 rounded-2xl text-sm font-medium text-slate-200 bg-slate-900/60 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-200">Riwayat Catatan</h2>
        {recordsLoading || rulesLoading ? (
          <div className="py-20 text-center text-slate-400 font-semibold">Memuat riwayat kedisiplinan...</div>
        ) : (
          <DisciplineTable records={filteredRecords} onDelete={onDeleteRecord} />
        )}
      </div>
    </div>
  );
}
