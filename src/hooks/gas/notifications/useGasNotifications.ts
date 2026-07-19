import { useState, useCallback } from "react";
import { waitForClientUser } from "@/lib/firebase/waitForClientUser";

export type NotificationTargetType = 'ALL_CLASSES' | 'CLASS' | 'STUDENTS' | 'SPECIFIC_STUDENT' | 'TEACHERS';

export interface GasNotification {
  id: string;
  title: string;
  message: string;
  targetType: NotificationTargetType;
  targetValue?: string;
  targetName?: string;
  senderId: string;
  senderName: string;
  schoolId: string;
  recipientCount?: number;
  recipientSummary?: Record<string, number>;
  sentAt: number;
}

export const useGasNotifications = (schoolId: string) => {
  const [notifications, setNotifications] = useState<GasNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!schoolId) return;
    setIsLoading(true);
    setError(null);

    try {
      const currentUser = await waitForClientUser(5000);
      if (!currentUser) throw new Error("Sesi tidak aktif. Silakan login ulang.");
      
      const token = await currentUser.getIdToken();
      const res = await fetch(`/api/admin/notifications?schoolId=${schoolId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Gagal mengambil riwayat notifikasi.");
      }

      const data = result.data || {};
      const parsedData: GasNotification[] = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      })).sort((a, b) => b.sentAt - a.sentAt); // Newest first

      setNotifications(parsedData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Gagal memuat notifikasi.");
    } finally {
      setIsLoading(false);
    }
  }, [schoolId]);

  const sendNotification = useCallback(async (
    title: string,
    message: string,
    targetType: NotificationTargetType,
    targetValue?: string,
    targetName?: string,
    senderName?: string
  ) => {
    if (!schoolId) return false;
    setIsLoading(true);
    
    try {
      const currentUser = await waitForClientUser(5000);
      if (!currentUser) throw new Error("Sesi tidak aktif. Silakan login ulang.");
      
      const token = await currentUser.getIdToken();
      const payload = { schoolId, title, message, targetType, targetValue, targetName, senderName };

      const res = await fetch(`/api/admin/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Gagal mengirim notifikasi.");
      }

      // Add to local state
      setNotifications(prev => [result.data, ...prev]);
      return true;
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Gagal mengirim notifikasi.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [schoolId]);

  const deleteNotification = useCallback(async (id: string) => {
    if (!schoolId) return false;
    
    try {
      const currentUser = await waitForClientUser(5000);
      if (!currentUser) throw new Error("Sesi tidak aktif. Silakan login ulang.");
      
      const token = await currentUser.getIdToken();

      const res = await fetch(`/api/admin/notifications?schoolId=${schoolId}&id=${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Gagal menghapus notifikasi.");
      }

      setNotifications(prev => prev.filter(n => n.id !== id));
      return true;
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Gagal menghapus notifikasi.");
      return false;
    }
  }, [schoolId]);

  const clearHistory = useCallback(async () => {
    if (!schoolId) return false;
    
    try {
      const currentUser = await waitForClientUser(5000);
      if (!currentUser) throw new Error("Sesi tidak aktif. Silakan login ulang.");
      
      const token = await currentUser.getIdToken();

      const res = await fetch(`/api/admin/notifications?schoolId=${schoolId}&clearAll=true`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Gagal menghapus riwayat.");
      }

      setNotifications([]);
      return true;
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Gagal menghapus riwayat.");
      return false;
    }
  }, [schoolId]);

  return {
    notifications,
    isLoading,
    error,
    fetchNotifications,
    sendNotification,
    deleteNotification,
    clearHistory
  };
};
