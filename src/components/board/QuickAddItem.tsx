"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useBoardContext } from "./BoardContext";
import { revalidateBoard } from "@/hooks/useBoard";

interface QuickAddItemProps {
  laneId: string;
}

export function QuickAddItem({ laneId }: QuickAddItemProps) {
  const { projectId } = useBoardContext();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !projectId) return;
    setSaving(true);
    await fetch("/api/v1/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId, title: title.trim(), status: laneId }),
    });
    setTitle("");
    setOpen(false);
    setSaving(false);
    revalidateBoard(projectId);
  }

  if (!open) {
    return (
      <button
        className="w-full text-left text-xs text-muted-foreground px-3 py-2 hover:text-foreground hover:bg-muted/60 rounded-b-lg transition-colors"
        onClick={() => setOpen(true)}
      >
        + Add item
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-2 space-y-2">
      <Input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Item title..."
        className="text-sm"
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={saving || !title.trim()}>
          Add
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
