import { useState, useCallback, useEffect } from "react";
import { db, rtdb } from "@/lib/firebase/client";
import { collection, query, getDocs, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { ref as rtdbRef, get, update } from "firebase/database";
import { LibraryTask } from "@/types/library";
import { callAdminApi } from "@/lib/callAdminApi";
import { isSessionInactiveError } from "@/lib/firebase/waitForClientUser";

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
    const collRef = collection(db, `schools/${schoolId}/library_tasks`);
    const q = query(collRef);

    try {
      const snapshot = await getDocs(q);
      const result: LibraryTask[] = [];
      snapshot.forEach(doc => {
        const data = doc.data() as LibraryTask;
        if (!selectedClass || data.className === selectedClass) {
          result.push({ ...data, id: doc.id });
        }
      });
      setTasks(result.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      console.error("Error fetching library tasks:", error);
    } finally {
      setLoading(false);
    }
  }, [schoolId, selectedClass]);

  const fetchLiteracyLogs = useCallback(async () => {
    if (!schoolId) {
      setLiteracyLogs([]);
      return;
    }

    try {
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
      const booksSnap = await get(rtdbRef(rtdb, `gas/schools/${schoolId}/library/books`));
      const borrowSnap = await get(rtdbRef(rtdb, `gas/schools/${schoolId}/library/borrowRecords`));
      
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
      const classesSnap = await get(rtdbRef(rtdb, `gas/schools/${schoolId}/classes`));
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
    const docRef = doc(collection(db, `schools/${schoolId}/library_tasks`));
    const newTask = { ...task, id: docRef.id };
    await setDoc(docRef, newTask);
    setTasks(prev => [newTask as LibraryTask, ...prev]);
  };

  const updateTaskStatus = async (taskId: string, newStatus: "ACTIVE" | "CLOSED") => {
    if (!schoolId) return;
    const docRef = doc(db, `schools/${schoolId}/library_tasks/${taskId}`);
    await updateDoc(docRef, { status: newStatus, updatedAt: Date.now() });
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus, updatedAt: Date.now() } : t));
  };

  const deleteTask = async (taskId: string) => {
    if (!schoolId) return;
    const docRef = doc(db, `schools/${schoolId}/library_tasks/${taskId}`);
    await deleteDoc(docRef);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const updateLiteracyLogStatus = async (logId: string, status: "GRADED" | "REJECTED", grade: string, feedback: string) => {
    if (!schoolId) return;
    try {
      const logRef = rtdbRef(rtdb, `literacy_logs/${logId}`);
      await update(logRef, { status, grade, feedback, gradedAt: Date.now() });
      setLiteracyLogs(prev => prev.map(l => l.id === logId ? { ...l, status, grade, feedback } : l));
    } catch(e) {
      console.error("Gagal menilai laporan literasi:", e);
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
    updateLiteracyLogStatus
  };
}
