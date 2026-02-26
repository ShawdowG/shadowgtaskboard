"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useComments, revalidateComments } from "@/hooks/useBoard";

interface CommentThreadProps {
  itemId: string;
}

export function CommentThread({ itemId }: CommentThreadProps) {
  const { data: comments = [], isLoading } = useComments(itemId);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSaving(true);
    await fetch(`/api/v1/items/${itemId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: body.trim(), author: "owner" }),
    });
    setBody("");
    setSaving(false);
    revalidateComments(itemId);
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold">Comments</h4>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground">No comments yet.</p>
      ) : (
        <div className="space-y-2">
          {comments.map((c) => (
            <div key={c.id} className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
              <p className="whitespace-pre-wrap">{c.body}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(c.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment..."
          rows={2}
          className="text-sm resize-none"
        />
        <Button type="submit" size="sm" disabled={saving || !body.trim()}>
          {saving ? "Saving..." : "Comment"}
        </Button>
      </form>
    </div>
  );
}
