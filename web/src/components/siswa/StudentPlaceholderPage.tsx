"use client";

import { ArrowLeft, Construction } from "lucide-react";
import { useRouter } from "next/navigation";

export default function StudentPlaceholderPage({
  title,
  description,
  icon,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-900 to-indigo-800 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">{title}</h1>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col items-center justify-center px-8 pb-32">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 mb-6">
          {icon || <Construction className="h-10 w-10 text-amber-400" />}
        </div>
        <h2 className="text-xl font-bold text-center mb-2">Segera Hadir</h2>
        <p className="text-sm text-indigo-200 text-center leading-relaxed max-w-xs">
          {description ||
            `Fitur ${title} sedang dalam pengembangan untuk versi web. Untuk saat ini, silakan gunakan fitur ini melalui aplikasi APK GAS Siswa di perangkat Android.`}
        </p>
      </div>
    </div>
  );
}
