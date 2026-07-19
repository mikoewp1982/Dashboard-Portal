"use client";

interface GasPetStatsTabProps {
  statGroups: Array<{
    key: string;
    title: string;
    highPercentage: number;
    mediumPercentage: number;
    lowPercentage: number;
  }>;
}

export function GasPetStatsTab({ statGroups }: GasPetStatsTabProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {statGroups.map((stat) => (
        <div key={stat.key} className="rounded-xl border border-slate-800 bg-[#111827]/80 p-6 shadow-sm">
          <h3 className="mb-4 font-bold capitalize text-slate-100">{stat.title}</h3>
          <div className="space-y-3">
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-medium text-green-500">High (70-100)</span>
                <span className="text-slate-400">{stat.highPercentage}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800">
                <div className="h-2 rounded-full bg-green-500" style={{ width: `${stat.highPercentage}%` }} />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-medium text-yellow-500">Medium (30-69)</span>
                <span className="text-slate-400">{stat.mediumPercentage}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800">
                <div className="h-2 rounded-full bg-yellow-500" style={{ width: `${stat.mediumPercentage}%` }} />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-medium text-red-500">Low (0-29)</span>
                <span className="text-slate-400">{stat.lowPercentage}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800">
                <div className="h-2 rounded-full bg-red-500" style={{ width: `${stat.lowPercentage}%` }} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
