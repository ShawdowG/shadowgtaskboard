"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useBoardContext } from "./BoardContext";
import { useProjects } from "@/hooks/useBoard";
import { mutate } from "swr";

export function ProjectSwitcher() {
  const { projectId, setProjectId } = useBoardContext();
  const { data: projects = [] } = useProjects();
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/v1/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const created = await res.json();
    setNewName("");
    setShowNew(false);
    setCreating(false);
    mutate("projects");
    if (created.id) setProjectId(created.id);
  }

  if (projects.length === 0) {
    return (
      <div className="border-b px-4 py-2 flex items-center gap-3">
        <span className="text-sm text-muted-foreground">No projects yet.</span>
        <Button size="sm" variant="outline" onClick={() => setShowNew(true)}>
          + New project
        </Button>
        <NewProjectDialog
          open={showNew}
          onClose={() => setShowNew(false)}
          name={newName}
          setName={setNewName}
          creating={creating}
          onSubmit={handleCreate}
        />
      </div>
    );
  }

  return (
    <div className="border-b px-4 py-2 flex items-center gap-3">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide shrink-0">
        Projects
      </span>
      <Tabs value={projectId ?? ""} onValueChange={setProjectId}>
        <TabsList className="h-8">
          {projects.map((p) => (
            <TabsTrigger key={p.id} value={p.id} className="text-xs h-7 px-3">
              {p.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setShowNew(true)}>
        + New
      </Button>
      <NewProjectDialog
        open={showNew}
        onClose={() => setShowNew(false)}
        name={newName}
        setName={setNewName}
        creating={creating}
        onSubmit={handleCreate}
      />
    </div>
  );
}

function NewProjectDialog({
  open, onClose, name, setName, creating, onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  name: string;
  setName: (v: string) => void;
  creating: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3 mt-2">
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Project name"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={creating || !name.trim()}>
              {creating ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
