"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

export function CronView() {
  const { projectId } = useBoardContext();
  const { data: crons = [], isLoading } = useSWR<CronJob[]>(
    projectId ? ["crons", projectId] : null,
    ([, id]) => fetchCrons(id as string),
    { revalidateOnFocus: false },
  );

  const [showAdd, setShowAdd] = useState(false);

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
    <div className="flex flex-col h-full overflow-hidden" aria-label="Cron job schedule board" role="region">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-purple-400" />
          <h2 className="text-sm font-semibold text-purple-700 tracking-wide uppercase">Cron Jobs</h2>
          <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
            {crons.length}
          </span>
        </div>
        <Button
          size="sm"
          className="h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white"
          onClick={() => setShowAdd(true)}
          disabled={!projectId}
          aria-label="Open cron job creation dialog"
        >
          + New Job
        </Button>
      </div>

      {/* Job grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-lg border bg-muted/30 h-36 animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && crons.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 text-muted-foreground">
            <span className="text-4xl">⏱</span>
            <p className="text-sm font-medium">No cron jobs yet</p>
            <p className="text-xs max-w-xs">
              Schedule recurring tasks for your agents. They can poll this list and execute jobs on schedule.
            </p>
            <p className="text-[11px] max-w-xs text-muted-foreground/90">
              Tip: use short, human-readable schedules like
              <span className="font-mono"> every 10m</span> or
              <span className="font-mono"> daily at 09:00</span> so they map cleanly back to your task IDs (ENG-1100..1106).
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => setShowAdd(true)}
              disabled={!projectId}
            >
              + Create first job
            </Button>
          </div>
        )}

        {!isLoading && crons.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {crons.map((cron) => (
              <CronCard
                key={cron.id}
                cron={cron}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add job dialog */}
      <AddCronDialog
        open={showAdd}
        onClose={() => setShowAdd(false)}
        projectId={projectId}
        onCreated={() => {
          if (projectId) revalidateCrons(projectId);
          setShowAdd(false);
        }}
      />
    </div>
  );
}

function CronCard({
  cron,
  onToggle,
  onDelete,
}: {
  cron: CronJob;
  onToggle: (c: CronJob) => void;
  onDelete: (id: string) => void;
}) {
  const assigneeColor = cron.assignee
    ? (ASSIGNEE_COLORS[cron.assignee] ?? "bg-slate-100 text-slate-700")
    : "";

  return (
    <div
      className={`flex flex-col rounded-lg border p-4 gap-3 transition-opacity ${
        cron.enabled
          ? "bg-white border-purple-100 shadow-sm"
          : "bg-muted/30 border-border/40 opacity-60"
      }`}
    >
      {/* Top row: name + delete */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-snug flex-1">{cron.name}</p>
        <button
          type="button"
          onClick={() => onDelete(cron.id)}
          className="text-muted-foreground hover:text-destructive transition-colors text-base leading-none shrink-0 mt-0.5"
          title="Delete job"
          aria-label={`Delete cron job ${cron.name}`}
        >
          ×
        </button>
      </div>

      {/* Schedule badge */}
      <div className="flex flex-wrap gap-1.5">
        <span className="font-mono text-[11px] bg-purple-50 text-purple-700 border border-purple-100 rounded px-2 py-0.5">
          {cron.schedule}
        </span>
        {cron.assignee && (
          <Badge variant="secondary" className={`text-[11px] px-1.5 py-0 ${assigneeColor}`}>
            {cron.assignee}
          </Badge>
        )}
      </div>

      {/* Description */}
      {cron.description && (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
          {cron.description}
        </p>
      )}

      {/* Footer: last run + toggle */}
      <div className="flex items-center justify-between mt-auto pt-1 border-t border-border/30">
        <span className="text-[10px] text-muted-foreground">
          {cron.last_run_at
            ? `Last: ${new Date(cron.last_run_at).toLocaleDateString()}`
            : "Never run"}
        </span>
        <button
          onClick={() => onToggle(cron)}
          className={`flex items-center gap-1 text-[11px] font-medium rounded-full px-2.5 py-0.5 transition-colors border ${
            cron.enabled
              ? "bg-green-50 text-green-700 border-green-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
              : "bg-muted text-muted-foreground border-border hover:bg-green-50 hover:text-green-700 hover:border-green-200"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${cron.enabled ? "bg-green-500" : "bg-muted-foreground"}`} />
          {cron.enabled ? "Active" : "Paused"}
        </button>
      </div>
    </div>
  );
}

function AddCronDialog({
  open,
  onClose,
  projectId,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string | null;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [schedule, setSchedule] = useState("");
  const [assignee, setAssignee] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !schedule.trim() || !projectId) return;
    setSaving(true);
    await fetch(`/api/v1/projects/${projectId}/crons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        schedule: schedule.trim(),
        assignee: assignee.trim() || null,
        description: description.trim() || null,
      }),
    });
    setSaving(false);
    setName("");
    setSchedule("");
    setAssignee("");
    setDescription("");
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New Cron Job</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Name</label>
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Daily standup report"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Schedule</label>
            <Input
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              placeholder="e.g. every 1h, daily at 09:00"
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Assignee</label>
            <Input
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="e.g. eta, alpha"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this job do?"
              rows={3}
              className="text-sm resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button
              type="submit"
              disabled={saving || !name.trim() || !schedule.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {saving ? "Creating..." : "Create Job"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
