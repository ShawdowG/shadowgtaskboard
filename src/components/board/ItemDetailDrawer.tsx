"use client";

import { useState, useEffect } from "react";
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
import { getSupabaseBrowserClient } from "@/lib/supabase";

const STATUS_OPTIONS = ["backlog", "working", "review", "done"] as const;

export function ItemDetailDrawer() {
  const { openItemId, setOpenItemId, projectId } = useBoardContext();
  const { data: items = [] } = useBoardItems(projectId);
  const item = items.find((i) => i.id === openItemId) ?? null;

  const [editTitle, setEditTitle] = useState("");
  const [editAssignee, setEditAssignee] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"comments" | "activity">("comments");

  useEffect(() => {
    if (item) {
      setEditTitle(item.title);
      setEditAssignee(item.assignee ?? "");
      setEditDescription(item.description ?? "");
    }
  }, [item?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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

  return (
    <Sheet open={!!openItemId} onOpenChange={(open) => !open && setOpenItemId(null)}>
      <SheetContent className="w-[480px] sm:w-[540px] overflow-y-auto flex flex-col gap-0 p-0">
        {item ? (
          <>
            <SheetHeader className="px-6 pt-6 pb-4">
              <SheetTitle className="text-base">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-base font-semibold border-0 p-0 h-auto shadow-none focus-visible:ring-0"
                  onBlur={handleSave}
                />
              </SheetTitle>
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
                {(["comments", "activity"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-2 text-sm capitalize transition-colors ${
                      activeTab === tab
                        ? "border-b-2 border-primary font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="pb-6">
                {activeTab === "comments" ? (
                  <CommentThread itemId={item.id} />
                ) : (
                  <ActivityLog itemId={item.id} />
                )}
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
