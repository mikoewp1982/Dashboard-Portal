export interface DisciplineRule {
  id: number;
  ruleName: string;
  category: "VIOLATION" | "ACHIEVEMENT";
  points: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string | null;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export const DEFAULT_DISCIPLINE_RULES: DisciplineRule[] = [
  { id: 1, ruleName: "Terlambat Sekolah", category: "VIOLATION", points: 5, severity: "LOW", description: "Datang ke sekolah setelah bel masuk berbunyi (07.00 WIB)", isActive: true, createdAt: 1700000000000, updatedAt: 1700000000000 },
  { id: 2, ruleName: "Atribut Tidak Lengkap", category: "VIOLATION", points: 5, severity: "LOW", description: "Tidak memakai topi, dasi, atau kaos kaki sesuai ketentuan", isActive: true, createdAt: 1700000000000, updatedAt: 1700000000000 },
  { id: 3, ruleName: "Seragam Tidak Rapi", category: "VIOLATION", points: 5, severity: "LOW", description: "Baju tidak dimasukkan (putra) atau tidak sesuai jadwal", isActive: true, createdAt: 1700000000000, updatedAt: 1700000000000 },
  { id: 4, ruleName: "Rambut Panjang (Putra)", category: "VIOLATION", points: 10, severity: "LOW", description: "Rambut menyentuh kerah baju atau menutupi telinga/alis", isActive: true, createdAt: 1700000000000, updatedAt: 1700000000000 },
  { id: 5, ruleName: "Membuang Sampah Sembarangan", category: "VIOLATION", points: 5, severity: "LOW", description: "Tidak membuang sampah pada tempat yang disediakan", isActive: true, createdAt: 1700000000000, updatedAt: 1700000000000 },
  { id: 11, ruleName: "Bolos Pelajaran", category: "VIOLATION", points: 20, severity: "MEDIUM", description: "Meninggalkan kelas saat jam pelajaran tanpa ijin", isActive: true, createdAt: 1700000000000, updatedAt: 1700000000000 },
  { id: 12, ruleName: "Pulang Awal", category: "VIOLATION", points: 20, severity: "MEDIUM", description: "Pulang sebelum waktunya tanpa ijin resmi dari sekolah atau guru", isActive: true, createdAt: 1700000000000, updatedAt: 1700000000000 },
  { id: 13, ruleName: "Merusak Fasilitas Sekolah", category: "VIOLATION", points: 25, severity: "MEDIUM", description: "Mencoret meja/dinding atau merusak alat sekolah", isActive: true, createdAt: 1700000000000, updatedAt: 1700000000000 },
  { id: 14, ruleName: "Berkata Kotor/Kasar", category: "VIOLATION", points: 15, severity: "MEDIUM", description: "Mengucapkan kata-kata tidak pantas kepada teman/guru", isActive: true, createdAt: 1700000000000, updatedAt: 1700000000000 },
  { id: 21, ruleName: "Merokok/Vape", category: "VIOLATION", points: 50, severity: "HIGH", description: "Merokok atau membawa rokok/vape di lingkungan sekolah", isActive: true, createdAt: 1700000000000, updatedAt: 1700000000000 },
  { id: 22, ruleName: "Berkelahi", category: "VIOLATION", points: 75, severity: "HIGH", description: "Melakukan perkelahian fisik dengan teman", isActive: true, createdAt: 1700000000000, updatedAt: 1700000000000 },
  { id: 23, ruleName: "Bullying/Perundungan", category: "VIOLATION", points: 75, severity: "HIGH", description: "Melakukan perundungan fisik atau verbal", isActive: true, createdAt: 1700000000000, updatedAt: 1700000000000 },
  { id: 24, ruleName: "Membawa Senjata Tajam", category: "VIOLATION", points: 100, severity: "CRITICAL", description: "Membawa senjata tajam yang membahayakan", isActive: true, createdAt: 1700000000000, updatedAt: 1700000000000 },
  { id: 51, ruleName: "Juara Lomba Sekolah", category: "ACHIEVEMENT", points: 15, severity: "LOW", description: "Juara 1/2/3 lomba tingkat sekolah (Class Meeting dll)", isActive: true, createdAt: 1700000000000, updatedAt: 1700000000000 },
  { id: 52, ruleName: "Juara Lomba Kabupaten", category: "ACHIEVEMENT", points: 25, severity: "MEDIUM", description: "Mewakili sekolah dan juara di tingkat kabupaten", isActive: true, createdAt: 1700000000000, updatedAt: 1700000000000 },
  { id: 53, ruleName: "Petugas Upacara", category: "ACHIEVEMENT", points: 5, severity: "LOW", description: "Menjadi petugas upacara bendera hari Senin", isActive: true, createdAt: 1700000000000, updatedAt: 1700000000000 },
  { id: 54, ruleName: "Hafalan Al-Quran", category: "ACHIEVEMENT", points: 20, severity: "MEDIUM", description: "Menyelesaikan hafalan Juz 30 atau surat pilihan", isActive: true, createdAt: 1700000000000, updatedAt: 1700000000000 }
];

export interface DisciplineRecord {
  id: string;
  studentId: string;
  studentNameSnapshot?: string;
  classNameSnapshot?: string;
  ruleId: number;
  ruleNameSnapshot?: string;
  category: "VIOLATION" | "ACHIEVEMENT";
  points: number;
  date: number; // timestamp ms
  note: string | null;
  recordedBy: string;
  recordedByName?: string;
  reportedByRole?: "teacher" | "osis" | "admin";
  createdAt: number;
}
