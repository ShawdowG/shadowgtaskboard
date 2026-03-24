"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { WorkItemCard } from "./WorkItemCard";
import { QuickAddItem } from "./QuickAddItem";
import type { WorkItem } from "@/hooks/useBoard";

// Lane column background + header accent
const LANE_STYLES: Record<string, { column: string; header: string; dot: string }> = {
  backlog: {
    column: "bg-slate-50/80 border-t-slate-400",
    header: "text-slate-600",
    dot:    "bg-slate-400",
  },
  working: {
    column: "bg-blue-50/80 border-t-blue-400",
    header: "text-blue-700",
    dot:    "bg-blue-400",
  },
  review: {
    column: "bg-amber-50/80 border-t-amber-400",
    header: "text-amber-700",
    dot:    "bg-amber-400",
  },
  done: {
    column: "bg-green-50/80 border-t-green-400",
    header: "text-green-700",
    dot:    "bg-green-400",
  },
};

interface LaneColumnProps {
  laneId: string;
  label: string;
  items: WorkItem[];
  allItems: WorkItem[];
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, laneId: string) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  isDragTarget?: boolean;
}

export function LaneColumn({
  laneId,
  label,
  items,
  allItems,
  onDragOver,
  onDrop,
  onDragStart,
  onDragEnd,
  isDragTarget,
}: LaneColumnProps) {
  const style = LANE_STYLES[laneId] ?? {
    column: "bg-muted/40 border-t-border",
    header: "text-foreground",
    dot: "bg-border",
  };

  return (
    <div
      className={`flex flex-col w-72 shrink-0 rounded-lg border border-border/50 border-t-2 transition-all
        ${style.column}
        ${isDragTarget ? "ring-2 ring-primary/30 scale-[1.01]" : ""}
      `}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, laneId)}
    >
      {/* Lane header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${style.dot}`} />
          <span className={`text-sm font-semibold ${style.header}`}>{label}</span>
        </div>
        <span className="text-xs text-muted-foreground bg-white/60 rounded-full px-2 py-0.5 border border-border/40">
          {items.length}
        </span>
      </div>

      {/* Cards */}
      <ScrollArea className="flex-1 px-2">
        <div className="flex flex-col gap-2 pb-2 min-h-8">
          {items.length === 0 ? (
            <p className="mx-1 mt-1 rounded-md bg-white/70 px-2 py-1 text-[11px] text-muted-foreground border border-dashed border-border/50">
              No items yet in this lane – use quick add below to create one.
            </p>
          ) : (
            items.map((item) => (
              <WorkItemCard
                key={item.id}
                item={item}
                allItems={allItems}
                laneId={laneId}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Quick add */}
      <QuickAddItem laneId={laneId} />
    </div>
  );
}
