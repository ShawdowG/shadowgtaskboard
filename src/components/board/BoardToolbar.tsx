"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useBoardContext, type ViewMode } from "./BoardContext";
import { useBoardItems, useProjects, revalidateBoard } from "@/hooks/useBoard";
import { useCSV } from "@/hooks/useCSV";

export function BoardToolbar() {
  const { viewMode, setViewMode, projectId } = useBoardContext();
  const { data: items = [] } = useBoardItems(projectId);
  const { data: projects = [] } = useProjects();
  const { exportToCSV, importFromCSV } = useCSV();
  const fileRef = useRef<HTMLInputElement>(null);

  const activeProject = projects.find((p) => p.id === projectId);

  function handleExport() {
    if (!projectId || !activeProject) return;
    exportToCSV(items, activeProject.name);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !projectId) return;
    await importFromCSV(file, projectId, () => revalidateBoard(projectId));
    if (fileRef.current) fileRef.current.value = "";
  }

  const views: { id: ViewMode; label: string }[] = [
    { id: "kanban", label: "Kanban" },
    { id: "swimlane", label: "Swim Lanes" },
  ];

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b bg-background/80 backdrop-blur-sm">
      {/* View toggle */}
      <div className="flex rounded-md border overflow-hidden">
        {views.map((v) => (
          <button
            key={v.id}
            onClick={() => setViewMode(v.id)}
            className={`px-3 py-1 text-xs transition-colors ${
              viewMode === v.id
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      <Separator orientation="vertical" className="h-5" />

      {/* CSV tools */}
      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleExport} disabled={!projectId}>
        Export CSV
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs"
        onClick={() => fileRef.current?.click()}
        disabled={!projectId}
      >
        Import CSV
      </Button>
      <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
    </div>
  );
}
