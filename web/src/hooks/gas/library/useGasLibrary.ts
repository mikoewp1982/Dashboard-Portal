import { useState, useCallback, useEffect } from "react";
import { db, rtdb } from "@/lib/firebase/client";
import { doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { ref as rtdbRef, get, update, push, set, remove } from "firebase/database";
import { LibraryTask } from "@/types/library";
import { callAdminApi } from "@/lib/callAdminApi";
import { isSessionInactiveError } from "@/lib/firebase/waitForClientUser";
import { getSchoolIdVariants, normalizeSchoolId } from "@/lib/gas/schoolId";

export interface LiteracyLog {
  id: string;
  studentId: string;
  schoolId: string;
  nisn?: string;
  studentName?: string;
  studentClass?: string;
  taskId?: string;
  taskTitle?: string;
  bookTitle?: string;
  author?: string;
  summary?: string;
  status?: string;
  grade?: string;
  feedback?: string;
  timestamp?: number;
}

export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  category: string;
  stock: number;
  available: number;
}

export interface BorrowRecord {
  id: string;
  studentId: string;
  bookId: string;
  schoolId: string;
  borrowDate: number;
  returnDate: number | null;
  status: 'BORROWED' | 'RETURNED' | 'OVERDUE';
}

export function useGasLibrary(schoolId: string | undefined, selectedClass: string) {
  const [tasks, setTasks] = useState<LibraryTask[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [literacyLogs, setLiteracyLogs] = useState<LiteracyLog[]>([]);
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [borrowRecords, setBorrowRecords] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!schoolId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const scopeVariants = new Set(getSchoolIdVariants(schoolId));

    try {
      const snapshot = await get(rtdbRef(rtdb, "literacy_tasks"));
      const result: LibraryTask[] = [];
      const val = snapshot.val();
      if (val) {
        Object.entries<any>(val).forEach(([id, item]) => {
          const rawScope = normalizeSchoolId(item.schoolId);
          const scopeCandidates = new Set(getSchoolIdVariants(rawScope));
          const matches = Array.from(scopeCandidates).some((candidate) => scopeVariants.has(candidate));
          if (matches) {
            const taskClassName = item.className || "Semua Kelas";
            if (!selectedClass || taskClassName === selectedClass) {
              result.push({
                id,
                title: item.title || "",
                description: item.description || "",
                className: taskClassName,
                assignedBy: item.assignedBy || "admin",
                assignedByName: item.assignedByName || "",
                status: item.isActive === false || item.status === "CLOSED" ? "CLOSED" : "ACTIVE",
                points: item.points || 30,
                durationMinutes: item.durationMinutes || 45,
                createdAt: item.createdAt || Date.now(),
                updatedAt: item.updatedAt || item.createdAt || Date.now(),
              });
            }
          }
        });
      }
      setTasks(result.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      console.error("Error fetching literacy tasks from RTDB:", error);
    } finally {
      setLoading(false);
    }
  }, [schoolId, selectedClass]);

  const fetchLiteracyLogs = useCallback(async () => {
    if (!schoolId) {
      setLiteracyLogs([]);
      return;
    }

    const variants = getSchoolIdVariants(schoolId);

    try {
      const merged: Record<string, any> = {};
      for (const variant of variants) {
        const snap = await get(rtdbRef(rtdb, `literacy_logs_by_school/${variant}`));
        if (snap.exists()) {
          Object.assign(merged, snap.val() || {});
        }
      }

      if (Object.keys(merged).length > 0) {
        const logsList: LiteracyLog[] = Object.entries<any>(merged)
          .map(([id, val]) => ({
            id,
            ...val
          }))
          .sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0));
        setLiteracyLogs(logsList);
        return;
      }

      // Fallback via Admin API if node by school is not populated yet
      const result = await callAdminApi(`/api/admin/library-monitoring?schoolId=${schoolId}`, "GET");
      setLiteracyLogs(Array.isArray(result?.literacyLogs) ? result.literacyLogs as LiteracyLog[] : []);
    } catch (error) {
      if (!isSessionInactiveError(error)) {
        console.error("Error fetching literacy logs:", error);
      }
      setLiteracyLogs([]);
    }
  }, [schoolId]);

  const fetchBooksAndRecords = useCallback(async () => {
    if (!schoolId) return;
    try {
      const canonicalSchoolId = normalizeSchoolId(schoolId);
      const booksSnap = await get(rtdbRef(rtdb, `gas/schools/${canonicalSchoolId}/library/books`));
      const borrowSnap = await get(rtdbRef(rtdb, `gas/schools/${canonicalSchoolId}/library/borrowRecords`));
      
      const bData = booksSnap.val();
      if (bData) setBooks(Object.entries(bData).map(([id, val]: any) => ({ id, ...val })));
      
      const rData = borrowSnap.val();
      if (rData) setBorrowRecords(Object.entries(rData).map(([id, val]: any) => ({ id, ...val })));
    } catch (error) {
      console.error("Error fetching library books:", error);
    }
  }, [schoolId]);

  const fetchClasses = useCallback(async () => {
    if (!schoolId) return;
    try {
      const canonicalSchoolId = normalizeSchoolId(schoolId);
      const classesSnap = await get(rtdbRef(rtdb, `gas/schools/${canonicalSchoolId}/classes`));
      const cData = classesSnap.val();
      if (cData) {
        setClasses(Object.entries(cData).map(([id, val]: any) => ({ id, ...val })));
      }
    } catch (error) {
      console.error("Error fetching library classes:", error);
    }
  }, [schoolId]);

  useEffect(() => {
    fetchClasses();
    fetchBooksAndRecords();
  }, [fetchClasses, fetchBooksAndRecords]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    void fetchLiteracyLogs();
  }, [fetchLiteracyLogs]);

  const refresh = useCallback(async () => {
    await Promise.all([fetchTasks(), fetchLiteracyLogs()]);
  }, [fetchTasks, fetchLiteracyLogs]);

  const addTask = async (task: Omit<LibraryTask, "id">) => {
    if (!schoolId) return;
    const normalizedSchoolId = normalizeSchoolId(schoolId);
    
    // Write to RTDB literacy_tasks (Primary source of truth for Mobile & Web)
    const newTaskRef = push(rtdbRef(rtdb, "literacy_tasks"));
    const taskId = newTaskRef.key || Date.now().toString();

    const rtdbPayload = {
      id: taskId,
      title: task.title,
      description: task.description,
      points: task.points || 30,
      durationMinutes: task.durationMinutes || 45,
      isActive: task.status === "ACTIVE",
      status: task.status,
      schoolId: normalizedSchoolId,
      className: task.className || "Semua Kelas",
      assignedBy: task.assignedBy || "admin",
      assignedByName: task.assignedByName || "",
      createdAt: task.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    await set(newTaskRef, rtdbPayload);

    // Mirror to Firestore for web backwards compatibility
    try {
      const docRef = doc(db, `schools/${normalizedSchoolId}/library_tasks/${taskId}`);
      await setDoc(docRef, { ...task, id: taskId, schoolId: normalizedSchoolId });
    } catch (e) {
      console.warn("Firestore mirror failed for library task:", e);
    }

    const createdTask: LibraryTask = {
      ...task,
      id: taskId,
    };
    setTasks(prev => [createdTask, ...prev]);
  };

  const updateTaskStatus = async (taskId: string, newStatus: "ACTIVE" | "CLOSED") => {
    if (!schoolId) return;
    const taskRef = rtdbRef(rtdb, `literacy_tasks/${taskId}`);
    await update(taskRef, { status: newStatus, isActive: newStatus === "ACTIVE", updatedAt: Date.now() });

    try {
      const docRef = doc(db, `schools/${normalizeSchoolId(schoolId)}/library_tasks/${taskId}`);
      await updateDoc(docRef, { status: newStatus, updatedAt: Date.now() });
    } catch {}

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus, updatedAt: Date.now() } : t));
  };

  const deleteTask = async (taskId: string) => {
    if (!schoolId) return;
    const taskRef = rtdbRef(rtdb, `literacy_tasks/${taskId}`);
    await remove(taskRef);

    try {
      const docRef = doc(db, `schools/${normalizeSchoolId(schoolId)}/library_tasks/${taskId}`);
      await deleteDoc(docRef);
    } catch {}

    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const updateLiteracyLogStatus = async (logId: string, status: "GRADED" | "REJECTED", grade: string, feedback: string) => {
    if (!schoolId) return;
    const variants = getSchoolIdVariants(schoolId);
    try {
      const updates: Record<string, any> = {};
      updates[`literacy_logs/${logId}/status`] = status;
      updates[`literacy_logs/${logId}/grade`] = grade;
      updates[`literacy_logs/${logId}/feedback`] = feedback;
      updates[`literacy_logs/${logId}/gradedAt`] = Date.now();

      for (const variant of variants) {
        updates[`literacy_logs_by_school/${variant}/${logId}/status`] = status;
        updates[`literacy_logs_by_school/${variant}/${logId}/grade`] = grade;
        updates[`literacy_logs_by_school/${variant}/${logId}/feedback`] = feedback;
        updates[`literacy_logs_by_school/${variant}/${logId}/gradedAt`] = Date.now();
      }

      await update(rtdbRef(rtdb), updates);
      setLiteracyLogs(prev => prev.map(l => l.id === logId ? { ...l, status, grade, feedback } : l));
    } catch(e) {
      console.error("Gagal menilai laporan literasi:", e);
      throw e;
    }
  };

  const deleteLiteracyLog = async (logId: string, logSchoolId?: string) => {
    if (!schoolId) return;
    const variants = new Set([
      ...getSchoolIdVariants(schoolId),
      ...getSchoolIdVariants(logSchoolId),
    ]);

    try {
      const updates: Record<string, null> = {
        [`literacy_logs/${logId}`]: null,
      };

      for (const variant of variants) {
        updates[`literacy_logs_by_school/${variant}/${logId}`] = null;
      }

      await update(rtdbRef(rtdb), updates);
      setLiteracyLogs(prev => prev.filter((log) => log.id !== logId));
    } catch (e) {
      console.error("Gagal menghapus laporan literasi:", e);
      throw e;
    }
  };

  return {
    tasks,
    classes,
    literacyLogs,
    books,
    borrowRecords,
    loading,
    refresh,
    addTask,
    updateTaskStatus,
    deleteTask,
    updateLiteracyLogStatus,
    deleteLiteracyLog
  };
}
