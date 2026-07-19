/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { rtdb } from "@/lib/firebase/client";
import { ref, onValue } from "firebase/database";
import { DailySchedule, Holiday, SchoolLocation } from "@/types/gasSettings";
import { auth } from "@/lib/firebase/client";

export function useGasSettings(schoolId: string) {
  const [schedules, setSchedules] = useState<DailySchedule[]>([
    { dayId: 1, dayName: "Senin", isEnabled: true, entryTime: "07:00", exitTime: "13:30" },
    { dayId: 2, dayName: "Selasa", isEnabled: true, entryTime: "07:00", exitTime: "13:30" },
    { dayId: 3, dayName: "Rabu", isEnabled: true, entryTime: "07:00", exitTime: "13:30" },
    { dayId: 4, dayName: "Kamis", isEnabled: true, entryTime: "07:00", exitTime: "13:30" },
    { dayId: 5, dayName: "Jumat", isEnabled: true, entryTime: "07:00", exitTime: "11:00" },
    { dayId: 6, dayName: "Sabtu", isEnabled: true, entryTime: "07:00", exitTime: "12:00" },
    { dayId: 0, dayName: "Minggu", isEnabled: false, entryTime: "00:00", exitTime: "00:00" },
  ]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [location, setLocation] = useState<SchoolLocation>({ latitude: -7.6698, longitude: 112.5432, radius: 50 });

  useEffect(() => {
    if (!schoolId) return;
    const pathBase = `school_settings/${schoolId}/attendance`;
    const schedulesRef = ref(rtdb, `${pathBase}/schedules`);
    const holidaysRef = ref(rtdb, `${pathBase}/holidays`);
    const locationRef = ref(rtdb, `${pathBase}/school_location`);

    const unsubSchedules = onValue(schedulesRef, (snap) => {
      const data = snap.val();
      if (!data) return;
      setSchedules((prev) =>
        prev.map((s) => {
          const remoteData = data[String(s.dayId + 1)];
          if (remoteData) {
            return {
              ...s,
              entryTime: remoteData.startTime || s.entryTime,
              exitTime: remoteData.endTime || s.exitTime,
              isEnabled: !remoteData.isHoliday,
            };
          }
          return s;
        })
      );
    });

    const unsubHolidays = onValue(holidaysRef, (snap) => {
      const data = snap.val();
      if (!data) {
        setHolidays([]);
        return;
      }
      const parsed = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
      setHolidays(parsed);
    });

    const unsubLoc = onValue(locationRef, (snap) => {
      const data = snap.val();
      if (data) {
        setLocation({
          latitude: data.latitude,
          longitude: data.longitude,
          radius: data.radius,
        });
      }
    });

    return () => {
      unsubSchedules();
      unsubHolidays();
      unsubLoc();
    };
  }, [schoolId]);

  const callApi = async (body: any) => {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch("/api/admin/attendance-settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Terjadi kesalahan server.");
    }
    return res.json();
  };

  const saveSchedules = async (newSchedules: DailySchedule[]) => {
    await callApi({
      action: "save-attendance-schedules",
      schoolId,
      schedules: newSchedules,
    });
  };

  const addHoliday = async (holiday: Omit<Holiday, "id">) => {
    await callApi({
      action: "add-holiday",
      schoolId,
      holiday,
    });
  };

  const removeHoliday = async (id: string) => {
    await callApi({
      action: "remove-holiday",
      schoolId,
      holiday: { id },
    });
  };

  const saveLocation = async (loc: SchoolLocation) => {
    await callApi({
      action: "save-school-location",
      schoolId,
      location: loc,
    });
  };

  return {
    schedules,
    holidays,
    location,
    saveSchedules,
    addHoliday,
    removeHoliday,
    saveLocation,
  };
}

