"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useBoardContext } from "./BoardContext";

type CronJob = {
  id: string;
  name: string;
  schedule: string;
  assignee: string | null;
  description: string | null;
  enabled: boolean;
  last_run_at: string | null;
  created_at: string;
};

async function fetchCrons(projectId: string): Promise<CronJob[]> {
  const res = await fetch(`/api/v1/projects/${projectId}/crons`);
  if (!res.ok) return [];
  return res.json();
}

function revalidateCrons(projectId: string) {
  mutate(["crons", projectId]);
}

const ASSIGNEE_COLORS: Record<string, string> = {
  eta:     "bg-violet-100 text-violet-800",
  alpha:   "bg-sky-100 text-sky-800",
  beta:    "bg-emerald-100 text-emerald-800",
  owner:   "bg-amber-100 text-amber-800",
  epsilon: "bg-pink-100 text-pink-800",
};

export function CronPanel() {
  const { projectId } = useBoardContext();
  const { data: crons = [], isLoading } = useSWR<CronJob[]>(
    projectId ? ["crons", projectId] : null,
    ([, id]) => fetchCrons(id as string),
    { revalidateOnFocus: false },
  );

  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSchedule, setNewSchedule] = useState("");
  const [newAssignee, setNewAssignee] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newSchedule.trim() || !projectId) return;
    setSaving(true);
    await fetch(`/api/v1/projects/${projectId}/crons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName.trim(),
        schedule: newSchedule.trim(),
        assignee: newAssignee.trim() || null,
      }),
    });
    setNewName("");
    setNewSchedule("");
    setNewAssignee("");
    setShowForm(false);
    setSaving(false);
    revalidateCrons(projectId);
  }

  async function handleToggle(cron: CronJob) {
    await fetch(`/api/v1/crons/${cron.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !cron.enabled }),
    });
    if (projectId) revalidateCrons(projectId);
  }

  async function handleDelete(cronId: string) {
    await fetch(`/api/v1/crons/${cronId}`, { method: "DELETE" });
    if (projectId) revalidateCrons(projectId);
  }

  return (
    <div className="flex flex-col h-full border-l bg-muted/20 w-64 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-purple-400" />
          <span className="text-sm font-semibold text-purple-700">CRON</span>
        </div>
        <span className="text-xs text-muted-foreground bg-white/60 rounded-full px-2 py-0.5 border border-border/40">
          {crons.length}
        </span>
      </div>

      <ScrollArea className="flex-1 px-2 py-2">
        {isLoading && (
          <p className="text-xs text-muted-foreground px-1">Loading...</p>
        )}
        {!isLoading && crons.length === 0 && (
          <p className="text-xs text-muted-foreground px-1">No scheduled jobs yet.</p>
        )}
        <div className="space-y-2">
          {crons.map((cron) => (
            <div
              key={cron.id}
              className={`rounded-md border px-3 py-2 text-xs space-y-1 transition-opacity ${
                cron.enabled ? "bg-white border-purple-100" : "bg-muted/40 border-border/40 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-1">
                <span className="font-medium leading-snug flex-1">{cron.name}</span>
                <button
                  onClick={() => handleDelete(cron.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors shrink-0 mt-0.5"
                  title="Delete"
                >
                  ×
                </button>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {cron.schedule}
                </span>
                {cron.assignee && (
                  <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${ASSIGNEE_COLORS[cron.assignee] ?? "bg-slate-100 text-slate-700"}`}>
                    {cron.assignee}
                  </Badge>
                )}
              </div>
              {cron.last_run_at && (
                <p className="text-[10px] text-muted-foreground">
                  Last: {new Date(cron.last_run_at).toLocaleString()}
                </p>
              )}
              <button
                onClick={() => handleToggle(cron)}
                className={`text-[10px] font-medium transition-colors ${
                  cron.enabled ? "text-green-600 hover:text-red-500" : "text-muted-foreground hover:text-green-600"
                }`}
              >
                {cron.enabled ? "● Active" : "○ Paused"}
              </button>
            </div>
          ))}
        </div>
      </ScrollArea>

      <Separator />

      {/* Add form */}
      <div className="px-2 py-2">
        {!showForm ? (
          <Button
            size="sm"
            variant="ghost"
            className="w-full h-7 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setShowForm(true)}
            disabled={!projectId}
          >
            + Add job
          </Button>
        ) : (
          <form onSubmit={handleCreate} className="space-y-1.5">
            <Input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Job name"
              className="h-7 text-xs"
            />
            <Input
              value={newSchedule}
              onChange={(e) => setNewSchedule(e.target.value)}
              placeholder="Schedule (e.g. every 1h)"
              className="h-7 text-xs font-mono"
            />
            <Input
              value={newAssignee}
              onChange={(e) => setNewAssignee(e.target.value)}
              placeholder="Assignee (e.g. eta)"
              className="h-7 text-xs"
            />
            <div className="flex gap-1">
              <Button type="submit" size="sm" className="h-7 text-xs flex-1" disabled={saving || !newName.trim() || !newSchedule.trim()}>
                {saving ? "..." : "Save"}
              </Button>
              <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
