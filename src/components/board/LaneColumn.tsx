"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { WorkItemCard } from "./WorkItemCard";
import { QuickAddItem } from "./QuickAddItem";
import type { WorkItem } from "@/hooks/useBoard";

const LANE_STYLES: Record<string, string> = {
  backlog: "border-t-slate-400",
  working: "border-t-blue-400",
  review: "border-t-yellow-400",
  done: "border-t-green-400",
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
  return (
    <div
      className={`flex flex-col w-72 shrink-0 bg-muted/40 rounded-lg border-t-2 ${LANE_STYLES[laneId] ?? "border-t-border"} transition-colors ${isDragTarget ? "bg-muted/70 ring-1 ring-border" : ""}`}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, laneId)}
    >
      {/* Lane header */}
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-xs text-muted-foreground bg-background rounded-full px-2 py-0.5 border">
          {items.length}
        </span>
      </div>

      {/* Cards */}
      <ScrollArea className="flex-1 px-2">
        <div className="flex flex-col gap-2 pb-2 min-h-8">
          {items.map((item) => (
            <WorkItemCard
              key={item.id}
              item={item}
              allItems={allItems}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Quick add */}
      <QuickAddItem laneId={laneId} />
    </div>
  );
}
