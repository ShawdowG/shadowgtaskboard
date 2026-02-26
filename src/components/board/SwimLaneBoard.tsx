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

export function SwimLaneBoard() {
  const { projectId } = useBoardContext();
  const { data: items = [], isLoading } = useBoardItems(projectId);
  const { onDragStart, onDragOver, onDrop, onDragEnd } = useDragDrop(projectId);
  const [dragTarget, setDragTarget] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  // Collect unique assignees; unassigned goes last
  const assigneeSet = new Set(items.map((i) => i.assignee ?? "__unassigned__"));
  const assignees = [...assigneeSet].sort((a, b) => {
    if (a === "__unassigned__") return 1;
    if (b === "__unassigned__") return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="h-full overflow-y-auto divide-y divide-border">
      {assignees.map((assignee) => {
        const label = assignee === "__unassigned__" ? "Unassigned" : assignee;
        const laneItems = items.filter(
          (i) => (i.assignee ?? "__unassigned__") === assignee && i.depth === 0,
        );

        return (
          <div key={assignee}>
            {/* Swim lane header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-4 py-1.5 flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {label}
              </span>
              <span className="text-xs text-muted-foreground">
                ({laneItems.length} item{laneItems.length !== 1 ? "s" : ""})
              </span>
            </div>

            {/* Mini kanban for this assignee */}
            <div className="flex gap-3 p-3 overflow-x-auto">
              {LANES.map((lane) => (
                <LaneColumn
                  key={lane.id}
                  laneId={lane.id}
                  label={lane.label}
                  items={laneItems.filter((i) => i.status === lane.id)}
                  allItems={items}
                  onDragStart={onDragStart}
                  onDragEnd={() => { onDragEnd(); setDragTarget(null); }}
                  onDragOver={(e) => { onDragOver(e); setDragTarget(`${assignee}-${lane.id}`); }}
                  onDrop={(e, id) => { onDrop(e, id); setDragTarget(null); }}
                  isDragTarget={dragTarget === `${assignee}-${lane.id}`}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
