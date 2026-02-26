import { useCallback, useRef } from "react";
import { mutate } from "swr";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { WorkItem } from "./useBoard";

export function useDragDrop(projectId: string | null) {
  const draggingId = useRef<string | null>(null);

  const onDragStart = useCallback((e: React.DragEvent, itemId: string) => {
    draggingId.current = itemId;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", itemId);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    async (e: React.DragEvent, targetLane: string) => {
      e.preventDefault();
      const itemId = draggingId.current ?? e.dataTransfer.getData("text/plain");
      if (!itemId || !projectId) return;

      const key = ["board-items", projectId];

      // Optimistic update
      mutate(
        key,
        (current: WorkItem[] | undefined) =>
          (current ?? []).map((i) =>
            i.id === itemId ? { ...i, status: targetLane as WorkItem["status"] } : i,
          ),
        false,
      );

      const db = getSupabaseBrowserClient();
      await db
        .from("work_items")
        .update({ status: targetLane, updated_at: new Date().toISOString() })
        .eq("id", itemId);

      draggingId.current = null;
      mutate(key); // revalidate from server
    },
    [projectId],
  );

  const onDragEnd = useCallback(() => {
    draggingId.current = null;
  }, []);

  return { onDragStart, onDragOver, onDrop, onDragEnd };
}
