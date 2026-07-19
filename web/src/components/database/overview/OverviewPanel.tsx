"use client";

import { DatabaseHeader } from "@/components/database/shared/DatabaseHeader";
import { DatabaseOverviewCards } from "@/components/database/shared/DatabaseOverviewCards";
import { useDatabaseOverviewRealtime } from "@/hooks/database/useDatabaseOverviewRealtime";

type OverviewPanelProps = {
  schoolId?: string;
};

export function OverviewPanel({ schoolId }: OverviewPanelProps) {
  const { overviewCounts, lastSyncTime } = useDatabaseOverviewRealtime(schoolId);

  return (
    <>
      <DatabaseHeader
        activeTab="Dashboard Overview"
        loading={false}
        lastSyncTime={lastSyncTime}
        canDeleteAll={false}
        isDeletingAll={false}
        onRefresh={() => undefined}
        onDeleteAll={() => undefined}
        onOpenAdd={() => undefined}
      />
      <div className="flex-1 overflow-auto p-8">
        <DatabaseOverviewCards overviewCounts={overviewCounts} />
      </div>
    </>
  );
}
