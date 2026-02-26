"use client";

import { useState } from "react";
import { useBoardContext } from "./BoardContext";
import { useBoardItems } from "@/hooks/useBoard";
import { useDragDrop } from "@/hooks/useDragDrop";
import { LaneColumn } from "./LaneColumn";
import { Skeleton } from "@/components/ui/skeleton";

const LANES = [
  { id: "backlog", label: "Backlog" },
  { id: "working", label: "Working" },
  { id: "review", label: "Review" },
  { id: "done", label: "Done" },
] as const;

export function KanbanBoard() {
  const { projectId } = useBoardContext();
  const { data: items = [], isLoading } = useBoardItems(projectId);
  const { onDragStart, onDragOver, onDrop, onDragEnd } = useDragDrop(projectId);
  const [dragTarget, setDragTarget] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex gap-3 p-4">
        {LANES.map((l) => (
          <div key={l.id} className="w-72 space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full gap-3 p-4 overflow-x-auto">
      {LANES.map((lane) => (
        <LaneColumn
          key={lane.id}
          laneId={lane.id}
          label={lane.label}
          items={items.filter((i) => i.status === lane.id && i.depth === 0)}
          allItems={items}
          onDragStart={onDragStart}
          onDragEnd={() => { onDragEnd(); setDragTarget(null); }}
          onDragOver={(e) => { onDragOver(e); setDragTarget(lane.id); }}
          onDrop={(e, id) => { onDrop(e, id); setDragTarget(null); }}
          isDragTarget={dragTarget === lane.id}
        />
      ))}
    </div>
  );
}
