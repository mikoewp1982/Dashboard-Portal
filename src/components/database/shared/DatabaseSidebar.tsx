"use client";

import { DatabaseTab, databaseMenuItems } from "./databaseConfig";

type DatabaseSidebarProps = {
  activeTab: DatabaseTab;
  onTabChange: (tab: DatabaseTab) => void;
};

export function DatabaseSidebar({ activeTab, onTabChange }: DatabaseSidebarProps) {
  return (
    <div className="flex w-64 flex-col gap-6 border-r border-white/10 bg-[#080d1e] p-6">
      <div>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
          MENU DATABASE
        </h2>
        <div className="flex flex-col gap-2">
          {databaseMenuItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex cursor-pointer items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition ${
                activeTab === item.id
                  ? "border border-blue-500/30 bg-blue-600/20 text-blue-400"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.label}
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/20 text-[10px]">
                {index + 1}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
