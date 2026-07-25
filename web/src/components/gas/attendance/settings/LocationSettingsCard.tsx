/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { MapPin, Info, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { SchoolLocation } from "@/types/gasSettings";

interface Props {
  location: SchoolLocation;
  saveLocation: (loc: SchoolLocation) => Promise<void>;
  mushollaLocation?: SchoolLocation;
  saveMushollaLocation?: (loc: SchoolLocation) => Promise<void>;
  mode?: "school" | "prayer" | "all";
}

const defaultSchoolLoc: SchoolLocation = { latitude: -7.6698, longitude: 112.5432, radius: 50 };
const defaultMushollaLoc: SchoolLocation = { latitude: -7.6698, longitude: 112.5432, radius: 25 };

export function LocationSettingsCard({
  location,
  saveLocation,
  mushollaLocation,
  saveMushollaLocation,
  mode = "all",
}: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [localState, setLocalState] = useState<SchoolLocation>(() => location || defaultSchoolLoc);

  const [isSavingMusholla, setIsSavingMusholla] = useState(false);
  const [mushollaState, setMushollaState] = useState<SchoolLocation>(
    () => mushollaLocation || defaultMushollaLoc
  );

  useEffect(() => {
    if (location) {
      setLocalState(location);
    }
  }, [location]);

  useEffect(() => {
    if (mushollaLocation) {
      setMushollaState(mushollaLocation);
    }
  }, [mushollaLocation]);

  const parseInputNumber = (raw: string): number | null => {
    const normalized = String(raw || "").trim().replace(",", ".");
    if (!normalized) return null;
    const value = Number.parseFloat(normalized);
    if (!Number.isFinite(value)) return null;
    return value;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const parsed = parseInputNumber(value);
    if (parsed === null) return;
    setLocalState((prev) => ({ ...prev, [name]: parsed }));
  };

  const handleMushollaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const parsed = parseInputNumber(value);
    if (parsed === null) return;
    setMushollaState((prev) => ({ ...prev, [name]: parsed }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveLocation(localState);
      alert("Pengaturan lokasi sekolah berhasil disimpan ke Database!");
    } catch (error) {
      console.error("Failed to save location", error);
      const message = (error as any)?.message ? String((error as any).message) : String(error);
      alert(`Gagal menyimpan lokasi sekolah. ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveMusholla = async () => {
    if (!saveMushollaLocation) return;
    setIsSavingMusholla(true);
    try {
      await saveMushollaLocation(mushollaState);
      alert("Pengaturan lokasi Musholla (Presensi Sholat) berhasil disimpan ke Database!");
    } catch (error) {
      console.error("Failed to save musholla location", error);
      const message = (error as any)?.message ? String((error as any).message) : String(error);
      alert(`Gagal menyimpan lokasi musholla. ${message}`);
    } finally {
      setIsSavingMusholla(false);
    }
  };

  return (
    <div className="rounded-lg bg-slate-900/50 p-6 shadow border border-slate-700/60 text-slate-200 space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium leading-6 text-slate-100">Pengaturan Lokasi</h3>
        <MapPin className="h-5 w-5 text-blue-400" />
      </div>

      {/* LOKASI SEKOLAH */}
      {(mode === "school" || mode === "all") && (
        <div className="rounded-lg border border-slate-700/40 bg-slate-900/30 p-4">
          <div className="text-sm font-semibold text-slate-100">Lokasi Sekolah (Absensi Datang/Pulang)</div>
          <div className="mt-3 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <label htmlFor="latitude" className="block text-sm font-medium text-slate-300">Latitude</label>
              <input
                type="number"
                step="any"
                name="latitude"
                id="latitude"
                value={localState.latitude}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-slate-600 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 sm:text-sm border p-2 text-slate-100 bg-slate-900/50"
              />
            </div>
            <div>
              <label htmlFor="longitude" className="block text-sm font-medium text-slate-300">Longitude</label>
              <input
                type="number"
                step="any"
                name="longitude"
                id="longitude"
                value={localState.longitude}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-slate-600 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 sm:text-sm border p-2 text-slate-100 bg-slate-900/50"
              />
            </div>
            <div>
              <label htmlFor="radius" className="block text-sm font-medium text-slate-300">Radius (Meter)</label>
              <input
                type="number"
                name="radius"
                id="radius"
                value={localState.radius}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-slate-600 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 sm:text-sm border p-2 text-slate-100 bg-slate-900/50"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between border-t border-slate-700/50 pt-4 gap-4">
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${localState.latitude},${localState.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:text-blue-300 hover:underline inline-flex items-center gap-1"
            >
              Buka Lokasi di Google Maps &rarr;
            </a>
            
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Menyimpan..." : "Simpan Lokasi Sekolah"}
            </button>
          </div>
        </div>
      )}

      {/* LOKASI MUSHOLLA */}
      {(mode === "prayer" || mode === "all") && (
        <div className="rounded-lg border border-emerald-700/40 bg-slate-900/30 p-4">
          <div className="text-sm font-semibold text-emerald-400">🕌 Lokasi Musholla (Presensi Sholat)</div>
          <div className="mt-3 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <label htmlFor="musholla_latitude" className="block text-sm font-medium text-slate-300">Latitude</label>
              <input
                type="number"
                step="any"
                name="latitude"
                id="musholla_latitude"
                value={mushollaState.latitude}
                onChange={handleMushollaChange}
                className="mt-1 block w-full rounded-md border-slate-600 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 sm:text-sm border p-2 text-slate-100 bg-slate-900/50"
              />
            </div>
            <div>
              <label htmlFor="musholla_longitude" className="block text-sm font-medium text-slate-300">Longitude</label>
              <input
                type="number"
                step="any"
                name="longitude"
                id="musholla_longitude"
                value={mushollaState.longitude}
                onChange={handleMushollaChange}
                className="mt-1 block w-full rounded-md border-slate-600 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 sm:text-sm border p-2 text-slate-100 bg-slate-900/50"
              />
            </div>
            <div>
              <label htmlFor="musholla_radius" className="block text-sm font-medium text-slate-300">Radius Musholla (Meter)</label>
              <input
                type="number"
                name="radius"
                id="musholla_radius"
                value={mushollaState.radius}
                onChange={handleMushollaChange}
                className="mt-1 block w-full rounded-md border-slate-600 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 sm:text-sm border p-2 text-slate-100 bg-slate-900/50"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between border-t border-slate-700/50 pt-4 gap-4">
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${mushollaState.latitude},${mushollaState.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-emerald-400 hover:text-emerald-300 hover:underline inline-flex items-center gap-1"
            >
              Buka Lokasi Musholla di Google Maps &rarr;
            </a>
            
            <button
              onClick={handleSaveMusholla}
              disabled={isSavingMusholla || !saveMushollaLocation}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-emerald-700 hover:to-teal-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSavingMusholla ? "Menyimpan..." : "Simpan Lokasi Musholla"}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-md bg-blue-900/30 p-4 border border-blue-700/30">
        <div className="flex">
          <div className="flex-shrink-0">
            <Info className="h-5 w-5 text-blue-400" aria-hidden="true" />
          </div>
          <div className="ml-3 flex-1 md:flex md:justify-between">
            <p className="text-sm text-blue-300">
              Pastikan koordinat sesuai dengan titik lokasi di Google Maps. Siswa hanya dapat melakukan presensi jika berada
              dalam radius yang ditentukan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

