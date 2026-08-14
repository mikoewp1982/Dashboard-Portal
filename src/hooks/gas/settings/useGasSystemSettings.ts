/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { rtdb } from "@/lib/firebase/client";
import { ref, onValue } from "firebase/database";
import { auth } from "@/lib/firebase/client";

export interface SchoolIdentity {
  name: string;
  address: string;
  email: string;
  phone: string;
  website: string;
}

export interface AcademicYear {
  id: string;
  name: string; // e.g., "2024/2025"
  semester: "Ganjil" | "Genap";
  isActive: boolean;
  startDate: string;
  endDate: string;
}

const DEFAULT_IDENTITY: SchoolIdentity = {
  name: "Nama Sekolah",
  address: "",
  email: "",
  phone: "",
  website: "",
};

export function useGasSystemSettings(schoolId: string) {
  const [identity, setIdentity] = useState<SchoolIdentity>(DEFAULT_IDENTITY);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [activeYearId, setActiveYearId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) return;
    const pathBase = `school_settings/${schoolId}/system`;
    const identityRef = ref(rtdb, `${pathBase}/identity`);
    const academicYearsRef = ref(rtdb, `${pathBase}/academic_years`);
    const activeYearRef = ref(rtdb, `${pathBase}/active_year_id`);

    let isIdentityLoaded = false;
    let isYearsLoaded = false;

    const checkLoaded = () => {
      if (isIdentityLoaded && isYearsLoaded) {
        setLoading(false);
      }
    };

    const unsubIdentity = onValue(identityRef, (snap) => {
      const data = snap.val();
      if (data) {
        setIdentity({ ...DEFAULT_IDENTITY, ...data });
      }
      isIdentityLoaded = true;
      checkLoaded();
    });

    let localActiveYearId: string | null = null;
    const unsubActiveYear = onValue(activeYearRef, (snap) => {
      localActiveYearId = snap.val();
      setActiveYearId(localActiveYearId);
    });

    const unsubYears = onValue(academicYearsRef, (snap) => {
      const data = snap.val();
      if (!data) {
        setAcademicYears([]);
      } else {
        const parsed = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
          isActive: key === localActiveYearId
        }));
        setAcademicYears(parsed);
      }
      isYearsLoaded = true;
      checkLoaded();
    });

    return () => {
      unsubIdentity();
      unsubYears();
      unsubActiveYear();
    };
  }, [schoolId]);

  const callApi = async (body: any) => {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch("/api/admin/system-settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Terjadi kesalahan server saat menyimpan pengaturan.");
    }
    return res.json();
  };

  const saveIdentity = async (newIdentity: SchoolIdentity) => {
    await callApi({
      action: "save-identity",
      schoolId,
      identity: newIdentity,
    });
  };

  const addAcademicYear = async (year: Omit<AcademicYear, "id" | "isActive"> & { id: string }) => {
    await callApi({
      action: "add-academic-year",
      schoolId,
      academicYear: year,
    });
  };

  const removeAcademicYear = async (id: string) => {
    await callApi({
      action: "remove-academic-year",
      schoolId,
      academicYearId: id,
    });
  };

  const setActiveYear = async (id: string) => {
    await callApi({
      action: "set-active-academic-year",
      schoolId,
      academicYearId: id,
    });
  };

  return {
    identity,
    academicYears,
    activeYearId,
    loading,
    saveIdentity,
    addAcademicYear,
    removeAcademicYear,
    setActiveYear,
  };
}

