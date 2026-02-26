"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useBoardContext } from "./BoardContext";
import type { WorkItem } from "@/hooks/useBoard";

const ASSIGNEE_COLORS: Record<string, string> = {
  eta: "bg-violet-100 text-violet-800",
  alpha: "bg-sky-100 text-sky-800",
  beta: "bg-emerald-100 text-emerald-800",
  owner: "bg-amber-100 text-amber-800",
};

// Card tint per lane — low opacity so cards are distinct but clearly belong to the lane
export const LANE_CARD_BG: Record<string, string> = {
  backlog: "bg-slate-50 border-slate-200",
  working: "bg-blue-50 border-blue-200",
  review:  "bg-amber-50 border-amber-200",
  done:    "bg-green-50 border-green-200",
};

const STATUS_BADGE: Record<string, string> = {
  backlog: "bg-slate-100 text-slate-600",
  working: "bg-blue-100 text-blue-700",
  review:  "bg-amber-100 text-amber-700",
  done:    "bg-green-100 text-green-700",
};

interface WorkItemCardProps {
  item: WorkItem;
  allItems: WorkItem[];
  laneId: string;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  depth?: number; // visual indent level (0 = top-level)
}

export function WorkItemCard({
  item,
  allItems,
  laneId,
  onDragStart,
  onDragEnd,
  depth = 0,
}: WorkItemCardProps) {
  const { setOpenItemId } = useBoardContext();
  const children = allItems.filter((i) => i.parent_id === item.id);
  const [expanded, setExpanded] = useState(false);

  const cardBg = LANE_CARD_BG[laneId] ?? "bg-white border-border";
  const assigneeColor = item.assignee
    ? (ASSIGNEE_COLORS[item.assignee] ?? "bg-slate-100 text-slate-700")
    : "";

  return (
    <div className={depth > 0 ? "pl-3 border-l-2 border-border/40" : ""}>
      <Card
        draggable={depth === 0}
        data-item-id={item.id}
        className={`select-none transition-shadow border ${cardBg} ${
          depth === 0
            ? "cursor-grab active:cursor-grabbing hover:shadow-md"
            : "cursor-pointer hover:shadow-sm"
        }`}
        onDragStart={depth === 0 ? (e) => onDragStart(e, item.id) : undefined}
        onDragEnd={depth === 0 ? onDragEnd : undefined}
        onClick={(e) => {
          e.stopPropagation();
          setOpenItemId(item.id);
        }}
      >
        <CardContent className={`space-y-1.5 ${depth > 0 ? "p-2" : "p-3"}`}>
          {depth === 0 && (
            <div className="flex items-center">
              <span className="text-[10px] font-mono font-semibold text-muted-foreground bg-muted/60 border border-border/50 rounded px-1.5 py-0.5 leading-none">
                {item.task_number != null ? `T-${item.task_number}` : "T-?"}
              </span>
            </div>
          )}
          <p className={`font-medium leading-snug ${depth > 0 ? "text-xs" : "text-sm"}`}>
            {item.title}
          </p>
          <div className="flex items-center gap-1.5 flex-wrap">
            {item.assignee && (
              <Badge variant="secondary" className={`text-xs px-1.5 py-0 ${assigneeColor}`}>
                {item.assignee}
              </Badge>
            )}
            {/* Show status badge on child cards since they may differ from the lane */}
            {depth > 0 && (
              <span className={`text-xs rounded-full px-1.5 py-0 ${STATUS_BADGE[item.status] ?? ""}`}>
                {item.status}
              </span>
            )}
            {/* Expand/collapse toggle for items with children */}
            {children.length > 0 && (
              <button
                className="text-xs text-muted-foreground hover:text-foreground ml-auto flex items-center gap-0.5"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded((v) => !v);
                }}
              >
                <span>{expanded ? "▾" : "▸"}</span>
                <span>{children.length} sub-task{children.length > 1 ? "s" : ""}</span>
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Inline child items */}
      {expanded && children.length > 0 && (
        <div className="mt-1 space-y-1">
          {children.map((child) => (
            <WorkItemCard
              key={child.id}
              item={child}
              allItems={allItems}
              laneId={child.status} // child uses its own status for color
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
