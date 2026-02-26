"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useBoardContext } from "./BoardContext";
import type { WorkItem } from "@/hooks/useBoard";

const ASSIGNEE_COLORS: Record<string, string> = {
  eta: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
  alpha: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
  beta: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  owner: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
};

interface WorkItemCardProps {
  item: WorkItem;
  allItems: WorkItem[];
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
}

export function WorkItemCard({ item, allItems, onDragStart, onDragEnd }: WorkItemCardProps) {
  const { setOpenItemId } = useBoardContext();
  const childCount = allItems.filter((i) => i.parent_id === item.id).length;
  const assigneeColor = item.assignee ? (ASSIGNEE_COLORS[item.assignee] ?? "bg-slate-100 text-slate-700") : "";

  return (
    <Card
      draggable
      data-item-id={item.id}
      className="cursor-grab active:cursor-grabbing select-none hover:shadow-md transition-shadow border border-border/60"
      onDragStart={(e) => onDragStart(e, item.id)}
      onDragEnd={onDragEnd}
      onClick={() => setOpenItemId(item.id)}
    >
      <CardContent className="p-3 space-y-2">
        <p className="text-sm font-medium leading-snug">{item.title}</p>
        <div className="flex items-center gap-2 flex-wrap">
          {item.assignee && (
            <Badge variant="secondary" className={`text-xs px-2 py-0 ${assigneeColor}`}>
              {item.assignee}
            </Badge>
          )}
          {childCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {childCount} sub-task{childCount > 1 ? "s" : ""}
            </span>
          )}
          {item.depth > 0 && (
            <span className="text-xs text-muted-foreground opacity-60">depth {item.depth}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
