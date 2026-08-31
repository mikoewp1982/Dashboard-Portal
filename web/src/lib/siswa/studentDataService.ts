import { ref, onValue, off, get, set, update, push, serverTimestamp, type DataSnapshot } from "firebase/database";
import { rtdb } from "@/lib/firebase/client";

export interface AttendanceRecord {
  status: string | null;
  checkInTime?: string;
  checkOutTime?: string;
  isEffectiveDay: boolean;
  hasWindowEnded: boolean;
}

export interface PrayerRecord {
  status: "PRAY" | "PERMIT" | "HALANGAN" | "NOT_PRAY" | null;
  timestamp?: number;
  prayerName?: string;
  note?: string;
}

export interface HabitDayLog {
  id: string;
  studentId: string;
  schoolId: string;
  date: string; // YYYY-MM-DD
  habits: Record<string, boolean>;
  updatedAt: number;
}

export interface StudentVirtualPet {
  id: string;
  studentId: string;
  schoolId: string;
  petName: string;
  level: number;
  experiencePoints: number;
  coins: number;
  health: number;
  happiness: number;
  hunger: number;
  energy: number;
  intelligence: number;
  social: number;
  status: "SEHAT" | "BAHAGIA" | "SEKARAT" | "SEDIH" | "DEAD";
  lastFed: number;
  lastPlayed: number;
  lastQuestReset: number;
  updatedAt: number;
}

export interface DisciplineRecord {
  id: string;
  studentId: string;
  studentName?: string;
  ruleId: number;
  category: string;
  points: number;
  description: string;
  date: number;
  reportedBy: string;
}

export interface BullyingReport {
  id: string;
  studentId: string;
  studentName: string;
  schoolId: string;
  category: string;
  description: string;
  location?: string;
  incidentDate?: string;
  isAnonymous: boolean;
  status: "PENDING" | "INVESTIGATING" | "RESOLVED";
  createdAt: number;
  response?: string;
}

export interface StudentNotification {
  id: string;
  title: string;
  message: string;
  category: string;
  createdAt: number;
  isRead?: boolean;
}

export const HABIT_DEFINITIONS = [
  { key: "habit_1", title: "Bangun Pagi", subtitle: "Bangun sebelum subuh/fajar dengan segar", icon: "Sun", color: "#F59E0B" },
  { key: "habit_2", title: "Beribadah", subtitle: "Melaksanakan ibadah tepat waktu dan khusyuk", icon: "HeartHandshake", color: "#10B981" },
  { key: "habit_3", title: "Berolahraga", subtitle: "Aktivitas fisik, senam, atau olahraga ringan", icon: "Activity", color: "#3B82F6" },
  { key: "habit_4", title: "Makan Sehat & Bergizi", subtitle: "Sarapan dan makan bergizi seimbang", icon: "Utensils", color: "#EC4899" },
  { key: "habit_5", title: "Gemar Membaca", subtitle: "Membaca buku/literasi minimal 15-30 menit", icon: "BookOpen", color: "#8B5CF6" },
  { key: "habit_6", title: "Bermasyarakat & Peduli", subtitle: "Membantu orang tua/teman & peduli lingkungan", icon: "Users", color: "#14B8A6" },
  { key: "habit_7", title: "Tidur Tepat Waktu", subtitle: "Istirahat cukup dan tidak begadang", icon: "Moon", color: "#6366F1" },
];

export function getTodayDateStr(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function formatTimeAgo(timestamp: number): string {
  if (!timestamp) return "-";
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit yang lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam yang lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari yang lalu`;
}

// ----------------------------------------------------
// 1. Sholat Dzuhur API
// ----------------------------------------------------
export function listenPrayerRecord(
  studentId: string,
  schoolId: string,
  dateStr: string,
  callback: (record: PrayerRecord | null) => void
) {
  const recordId = `${studentId}_${dateStr}`;
  const schoolScope = schoolId.trim().toLowerCase();
  const prayerRef = schoolScope
    ? ref(rtdb, `prayer_attendance_by_school/${schoolScope}/${recordId}`)
    : ref(rtdb, `prayer_attendance/${recordId}`);

  const unsubscribe = onValue(prayerRef, (snapshot: DataSnapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      callback({
        status: data.status || null,
        timestamp: data.timestamp || data.createdAt || Date.now(),
        prayerName: data.prayerName || "Dzuhur",
        note: data.note || "",
      });
    } else {
      callback(null);
    }
  });

  return () => off(prayerRef);
}

export async function submitPrayerRecord(
  studentId: string,
  studentName: string,
  schoolId: string,
  dateStr: string,
  status: "PRAY" | "PERMIT" | "HALANGAN",
  note: string = ""
) {
  const recordId = `${studentId}_${dateStr}`;
  const schoolScope = schoolId.trim().toLowerCase();
  const payload = {
    id: recordId,
    studentId: studentId.trim(),
    studentName: studentName.trim(),
    schoolId: schoolScope,
    date: dateStr,
    prayerName: "Dzuhur",
    status,
    note,
    timestamp: Date.now(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const updates: Record<string, any> = {
    [`prayer_attendance/${recordId}`]: payload,
  };
  if (schoolScope) {
    updates[`prayer_attendance_by_school/${schoolScope}/${recordId}`] = payload;
  }

  await update(ref(rtdb), updates);
}

// ----------------------------------------------------
// 2. Sholat Dhuha & Jum'at API
// ----------------------------------------------------
export function listenPrayerV2Record(
  studentId: string,
  schoolId: string,
  dateStr: string,
  prayerType: "dhuha" | "jumat",
  callback: (record: PrayerRecord | null) => void
) {
  const recordId = `${studentId}_${dateStr}_${prayerType}`;
  const schoolScope = schoolId.trim().toLowerCase();
  const prayerRef = schoolScope
    ? ref(rtdb, `prayer_attendance_v2_by_school/${schoolScope}/${recordId}`)
    : ref(rtdb, `prayer_attendance_v2/${recordId}`);

  const unsubscribe = onValue(prayerRef, (snapshot: DataSnapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      callback({
        status: data.status || null,
        timestamp: data.timestamp || data.createdAt || Date.now(),
        prayerName: prayerType === "dhuha" ? "Sholat Dhuha" : "Sholat Jum'at",
        note: data.note || "",
      });
    } else {
      callback(null);
    }
  });

  return () => off(prayerRef);
}

export async function submitPrayerV2Record(
  studentId: string,
  studentName: string,
  schoolId: string,
  dateStr: string,
  prayerType: "dhuha" | "jumat",
  status: "PRAY" | "PERMIT" | "HALANGAN",
  note: string = ""
) {
  const recordId = `${studentId}_${dateStr}_${prayerType}`;
  const schoolScope = schoolId.trim().toLowerCase();
  const payload = {
    id: recordId,
    studentId: studentId.trim(),
    studentName: studentName.trim(),
    schoolId: schoolScope,
    date: dateStr,
    prayerType,
    prayerName: prayerType === "dhuha" ? "Sholat Dhuha" : "Sholat Jum'at",
    status,
    note,
    timestamp: Date.now(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const updates: Record<string, any> = {
    [`prayer_attendance_v2/${recordId}`]: payload,
  };
  if (schoolScope) {
    updates[`prayer_attendance_v2_by_school/${schoolScope}/${recordId}`] = payload;
  }

  await update(ref(rtdb), updates);
}

// ----------------------------------------------------
// 3. 7 KAIH API
// ----------------------------------------------------
export function listen7HabitsLogs(
  studentId: string,
  schoolId: string,
  callback: (logs: Record<string, HabitDayLog>) => void
) {
  const schoolScope = schoolId.trim().toLowerCase();
  const habitsRef = schoolScope
    ? ref(rtdb, `seven_habits_logs_by_school/${schoolScope}/${studentId.trim()}`)
    : ref(rtdb, `seven_habits_logs/${studentId.trim()}`);

  const unsubscribe = onValue(habitsRef, (snapshot: DataSnapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const logs: Record<string, HabitDayLog> = {};
      Object.keys(data).forEach((key) => {
        const item = data[key];
        logs[item.date || key] = {
          id: item.id || `${studentId}_${item.date || key}`,
          studentId: item.studentId || studentId,
          schoolId: item.schoolId || schoolScope,
          date: item.date || key,
          habits: item.habits || {},
          updatedAt: item.updatedAt || Date.now(),
        };
      });
      callback(logs);
    } else {
      callback({});
    }
  });

  return () => off(habitsRef);
}

export async function toggle7HabitItem(
  studentId: string,
  schoolId: string,
  dateStr: string,
  habitKey: string,
  isChecked: boolean,
  currentHabits: Record<string, boolean> = {}
) {
  const schoolScope = schoolId.trim().toLowerCase();
  const updatedHabits = { ...currentHabits, [habitKey]: isChecked };
  const payload = {
    id: `${studentId}_${dateStr}`,
    studentId: studentId.trim(),
    schoolId: schoolScope,
    date: dateStr,
    habits: updatedHabits,
    updatedAt: Date.now(),
  };

  const updates: Record<string, any> = {
    [`seven_habits_logs/${studentId}/${dateStr}`]: payload,
  };
  if (schoolScope) {
    updates[`seven_habits_logs_by_school/${schoolScope}/${studentId}/${dateStr}`] = payload;
  }

  await update(ref(rtdb), updates);
}

// ----------------------------------------------------
// 4. Reading Duration & Lentera Digital API
// ----------------------------------------------------
export function listenReadingDuration(
  studentId: string,
  dateStr: string,
  callback: (durationMillis: number) => void
) {
  const readingRef = ref(rtdb, `student_activities/${studentId.trim()}/reading_log/${dateStr}`);

  const unsubscribe = onValue(readingRef, (snapshot: DataSnapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const duration = typeof data === "number" ? data : data.durationMillis || data.duration || 0;
      callback(Number(duration));
    } else {
      callback(0);
    }
  });

  return () => off(readingRef);
}

export async function addReadingTime(
  studentId: string,
  dateStr: string,
  additionalMillis: number
) {
  const readingRef = ref(rtdb, `student_activities/${studentId.trim()}/reading_log/${dateStr}`);
  const snap = await get(readingRef);
  let current = 0;
  if (snap.exists()) {
    const val = snap.val();
    current = typeof val === "number" ? val : val.durationMillis || 0;
  }
  const nextVal = current + additionalMillis;
  await set(readingRef, {
    durationMillis: nextVal,
    updatedAt: Date.now(),
  });
  return nextVal;
}

// ----------------------------------------------------
// 5. Virtual Pet API
// ----------------------------------------------------
export function listenVirtualPet(
  studentId: string,
  schoolId: string,
  callback: (pet: StudentVirtualPet | null) => void
) {
  const schoolScope = schoolId.trim().toLowerCase();
  const petRef = ref(rtdb, `virtual_pets/${studentId.trim()}`);

  const unsubscribe = onValue(petRef, (snapshot: DataSnapshot) => {
    if (snapshot.exists()) {
      const p = snapshot.val();
      callback({
        id: p.id || studentId,
        studentId: p.studentId || studentId,
        schoolId: p.schoolId || schoolScope,
        petName: p.petName || "Sahabat Belajar",
        level: p.level || 1,
        experiencePoints: p.experiencePoints || 0,
        coins: p.coins || 0,
        health: p.health ?? 0,
        happiness: p.happiness ?? 100,
        hunger: p.hunger ?? 100,
        energy: p.energy ?? 0,
        intelligence: p.intelligence || 50,
        social: p.social || 50,
        status: p.status || "SEHAT",
        lastFed: p.lastFed || Date.now(),
        lastPlayed: p.lastPlayed || Date.now(),
        lastQuestReset: p.lastQuestReset || Date.now(),
        updatedAt: p.updatedAt || Date.now(),
      });
    } else {
      // Default new pet
      callback({
        id: studentId,
        studentId,
        schoolId: schoolScope,
        petName: "Sahabat Belajar",
        level: 1,
        experiencePoints: 50,
        coins: 100,
        health: 0,
        happiness: 100,
        hunger: 100,
        energy: 0,
        intelligence: 50,
        social: 50,
        status: "SEHAT",
        lastFed: Date.now(),
        lastPlayed: Date.now(),
        lastQuestReset: Date.now(),
        updatedAt: Date.now(),
      });
    }
  });

  return () => off(petRef);
}

// ----------------------------------------------------
// 6. Kedisiplinan API
// ----------------------------------------------------
export function listenDisciplineRecords(
  studentId: string,
  schoolId: string,
  callback: (records: DisciplineRecord[], totalPenalty: number) => void
) {
  const discRef = ref(rtdb, "discipline_records");

  const unsubscribe = onValue(discRef, (snapshot: DataSnapshot) => {
    if (!snapshot.exists()) {
      callback([], 0);
      return;
    }
    const list: DisciplineRecord[] = [];
    let penaltySum = 0;
    const sId = studentId.trim().toLowerCase();

    snapshot.forEach((child) => {
      const item = child.val();
      const recStudentId = String(item.studentId || item.nisn || "").trim().toLowerCase();
      if (recStudentId === sId) {
        const points = Number(item.points || item.penaltyPoints || 0);
        penaltySum += points;
        list.push({
          id: child.key || item.id || "",
          studentId: item.studentId || studentId,
          studentName: item.studentName || "",
          ruleId: Number(item.ruleId || 0),
          category: item.category || "Pelanggaran",
          points,
          description: item.description || item.reason || "Pelanggaran tata tertib",
          date: Number(item.date || item.createdAt || Date.now()),
          reportedBy: item.reportedBy || item.teacherName || "Guru BK",
        });
      }
    });

    list.sort((a, b) => b.date - a.date);
    callback(list, penaltySum);
  });

  return () => off(discRef);
}

// ----------------------------------------------------
// 7. Bullying & Aduan API
// ----------------------------------------------------
export function listenBullyingReports(
  studentId: string,
  callback: (reports: BullyingReport[]) => void
) {
  const reportsRef = ref(rtdb, "bullying_reports");

  const unsubscribe = onValue(reportsRef, (snapshot: DataSnapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const list: BullyingReport[] = [];
    const sId = studentId.trim().toLowerCase();

    snapshot.forEach((child) => {
      const item = child.val();
      if (String(item.studentId || "").trim().toLowerCase() === sId) {
        list.push({
          id: child.key || item.id || "",
          studentId: item.studentId || studentId,
          studentName: item.studentName || "Siswa",
          schoolId: item.schoolId || "",
          category: item.category || "Aduan Umum",
          description: item.description || "",
          location: item.location || "",
          incidentDate: item.incidentDate || "",
          isAnonymous: Boolean(item.isAnonymous),
          status: item.status || "PENDING",
          createdAt: Number(item.createdAt || Date.now()),
          response: item.response || "",
        });
      }
    });

    list.sort((a, b) => b.createdAt - a.createdAt);
    callback(list);
  });

  return () => off(reportsRef);
}

export async function submitBullyingReport(report: Omit<BullyingReport, "id" | "createdAt" | "status">) {
  const reportsRef = ref(rtdb, "bullying_reports");
  const newReportRef = push(reportsRef);
  const payload: BullyingReport = {
    ...report,
    id: newReportRef.key || String(Date.now()),
    status: "PENDING",
    createdAt: Date.now(),
  };
  await set(newReportRef, payload);
}

// ----------------------------------------------------
// 8. Notifications API
// ----------------------------------------------------
export function listenStudentNotifications(
  schoolId: string,
  callback: (notifications: StudentNotification[]) => void
) {
  const notifRef = ref(rtdb, "notifications");

  const unsubscribe = onValue(notifRef, (snapshot: DataSnapshot) => {
    if (!snapshot.exists()) {
      // Fallback notifications if none in RTDB
      callback([
        {
          id: "welcome",
          title: "Selamat Datang di GAS Siswa PWA!",
          message: "Aplikasi portal siswa siap digunakan untuk absensi, sholat, 7KAIH, lentera, dan virtual pet.",
          category: "Sistem",
          createdAt: Date.now() - 3600000,
        },
        {
          id: "pet_reminder",
          title: "Rawat Virtual Pet Kamu!",
          message: "Jangan lupa selesaikan membaca 30 menit dan sholat Dzuhur sebelum jam 15:00 agar pet tetap sehat.",
          category: "Virtual Pet",
          createdAt: Date.now() - 7200000,
        },
      ]);
      return;
    }

    const list: StudentNotification[] = [];
    snapshot.forEach((child) => {
      const item = child.val();
      list.push({
        id: child.key || item.id || "",
        title: item.title || "Pengumuman",
        message: item.message || item.body || "",
        category: item.category || "Sekolah",
        createdAt: Number(item.createdAt || item.timestamp || Date.now()),
      });
    });

    list.sort((a, b) => b.createdAt - a.createdAt);
    callback(list);
  });

  return () => off(notifRef);
}
