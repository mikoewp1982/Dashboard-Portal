import Link from "next/link";
import React from "react";

export type StudentFeatureCardProps = {
  title: string;
  icon: React.ReactNode;
  href: string;
  onClick?: () => void;
  badgeCount?: number;
  disabled?: boolean;
};

export function StudentFeatureCard({
  title,
  icon,
  href,
  onClick,
  badgeCount = 0,
  disabled = false,
}: StudentFeatureCardProps) {
  const content = (
    <div className="flex flex-col items-center justify-start w-full cursor-pointer group">
      {/* Box 64dp */}
      <div
        className={`relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 transition-transform duration-200 group-hover:scale-105 ${
          disabled ? "bg-white/5 opacity-50 grayscale" : "bg-white/10 shadow-lg shadow-black/20"
        }`}
      >
        {/* Icon 36dp (passed as children typically, styled appropriately) */}
        <div className="text-white">
          {icon}
        </div>

        {badgeCount > 0 && (
          <div className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white shadow ring-2 ring-slate-900">
            {badgeCount > 99 ? "99+" : badgeCount}
          </div>
        )}
      </div>

      {/* Tulisan kecil label di bawah (polos, tanpa wadah pill shape) */}
      <span
        className={`mt-2 text-center text-[10px] font-medium leading-tight ${
          disabled ? "text-slate-500" : "text-slate-200 group-hover:text-white"
        }`}
      >
        {title}
      </span>
    </div>
  );

  if (disabled) {
    return <div className="w-full">{content}</div>;
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="w-full outline-none">
        {content}
      </button>
    );
  }

  return (
    <Link href={href} className="w-full outline-none">
      {content}
    </Link>
  );
}
