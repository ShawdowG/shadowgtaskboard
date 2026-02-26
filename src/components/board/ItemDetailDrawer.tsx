"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useBoardContext } from "./BoardContext";
import { useBoardItems, revalidateBoard } from "@/hooks/useBoard";
import { CommentThread } from "./CommentThread";
import { ActivityLog } from "./ActivityLog";
import { LANE_CARD_BG } from "./WorkItemCard";
import { getSupabaseBrowserClient } from "@/lib/supabase";

const STATUS_OPTIONS = ["backlog", "working", "review", "done"] as const;

export function ItemDetailDrawer() {
  const { openItemId, setOpenItemId, projectId } = useBoardContext();
  const { data: items = [] } = useBoardItems(projectId);
  const item = items.find((i) => i.id === openItemId) ?? null;
  const children = items.filter((i) => i.parent_id === openItemId);

  const [syncedItemId, setSyncedItemId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAssignee, setEditAssignee] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"subtasks" | "comments" | "activity">("subtasks");

  // Quick-add subtask state
  const [newSubtask, setNewSubtask] = useState("");
  const [addingSubtask, setAddingSubtask] = useState(false);

  // Reset edit fields when a different item is opened (setState-during-render pattern)
  if (item && item.id !== syncedItemId) {
    setSyncedItemId(item.id);
    setEditTitle(item.title);
    setEditAssignee(item.assignee ?? "");
    setEditDescription(item.description ?? "");
  }

  async function handleSave() {
    if (!item || !projectId) return;
    setSaving(true);
    const db = getSupabaseBrowserClient();
    await db
      .from("work_items")
      .update({
        title: editTitle.trim() || item.title,
        assignee: editAssignee.trim() || null,
        description: editDescription.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);
    setSaving(false);
    revalidateBoard(projectId);
  }

  async function handleStatusChange(newStatus: string) {
    if (!item || !projectId) return;
    const db = getSupabaseBrowserClient();
    await db
      .from("work_items")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", item.id);
    revalidateBoard(projectId);
  }

  async function handleArchive() {
    if (!item || !projectId) return;
    await fetch(`/api/v1/items/${item.id}`, { method: "DELETE" });
    setOpenItemId(null);
    revalidateBoard(projectId);
  }

  async function handleAddSubtask(e: React.FormEvent) {
    e.preventDefault();
    if (!newSubtask.trim() || !item || !projectId) return;
    setAddingSubtask(true);
    await fetch("/api/v1/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        title: newSubtask.trim(),
        status: "backlog",
        depth: Math.min(item.depth + 1, 2),
        parent_id: item.id,
        assignee: item.assignee ?? null,
      }),
    });
    setNewSubtask("");
    setAddingSubtask(false);
    revalidateBoard(projectId);
  }

  return (
    <Sheet open={!!openItemId} onOpenChange={(open) => !open && setOpenItemId(null)}>
      <SheetContent className="w-[480px] sm:w-[540px] overflow-y-auto flex flex-col gap-0 p-0">
        {item ? (
          <>
            <SheetHeader className="px-6 pt-6 pb-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Task ID</span>
                <span className="text-xs font-mono font-semibold text-muted-foreground bg-muted/60 border border-border/50 rounded px-1.5 py-0.5">
                  {item.task_number != null ? `T-${item.task_number}` : "T-?"}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Title</span>
                <SheetTitle className="text-base">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="text-base font-semibold border-0 p-0 h-auto shadow-none focus-visible:ring-0"
                    onBlur={handleSave}
                  />
                </SheetTitle>
              </div>
            </SheetHeader>

            <div className="px-6 space-y-4 flex-1">
              {/* Meta row */}
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <Select value={item.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="h-7 text-xs w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s} className="text-xs">
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Assignee</span>
                  <Input
                    value={editAssignee}
                    onChange={(e) => setEditAssignee(e.target.value)}
                    placeholder="e.g. eta"
                    className="h-7 text-xs w-24"
                    onBlur={handleSave}
                  />
                </div>

                <Badge variant="outline" className="text-xs">
                  depth {item.depth}
                </Badge>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Description</span>
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Add a description..."
                  rows={3}
                  className="text-sm resize-none"
                  onBlur={handleSave}
                />
              </div>

              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button size="sm" variant="destructive" onClick={handleArchive}>
                  Archive
                </Button>
              </div>

              <Separator />

              {/* Tabs */}
              <div className="flex gap-4 border-b">
                {([
                  ["subtasks", `Sub-tasks${children.length ? ` (${children.length})` : ""}`],
                  ["comments", "Comments"],
                  ["activity", "Activity"],
                ] as const).map(([tab, label]) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-2 text-sm transition-colors ${
                      activeTab === tab
                        ? "border-b-2 border-primary font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="pb-6">
                {activeTab === "subtasks" && (
                  <div className="space-y-2">
                    {/* Existing subtasks */}
                    {children.length === 0 && (
                      <p className="text-xs text-muted-foreground">No sub-tasks yet.</p>
                    )}
                    {children.map((child) => (
                      <div
                        key={child.id}
                        className={`flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer hover:shadow-sm transition-shadow ${LANE_CARD_BG[child.status] ?? "bg-white border-border"}`}
                        onClick={() => setOpenItemId(child.id)}
                      >
                        <span className="flex-1 text-sm">{child.title}</span>
                        <span className="text-xs text-muted-foreground shrink-0">{child.status}</span>
                        {child.assignee && (
                          <span className="text-xs bg-white/60 border rounded-full px-2 py-0 shrink-0">
                            {child.assignee}
                          </span>
                        )}
                      </div>
                    ))}

                    {/* Add subtask form — only available if depth < 2 */}
                    {item.depth < 2 && (
                      <form onSubmit={handleAddSubtask} className="flex gap-2 mt-2">
                        <Input
                          value={newSubtask}
                          onChange={(e) => setNewSubtask(e.target.value)}
                          placeholder="Add sub-task..."
                          className="text-sm h-8"
                          disabled={addingSubtask}
                        />
                        <Button type="submit" size="sm" className="h-8" disabled={addingSubtask || !newSubtask.trim()}>
                          Add
                        </Button>
                      </form>
                    )}
                  </div>
                )}
                {activeTab === "comments" && <CommentThread itemId={item.id} />}
                {activeTab === "activity" && <ActivityLog itemId={item.id} />}
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Select an item to view details.
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
