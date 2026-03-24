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

  const boardViews: { id: ViewMode; label: string }[] = [
    { id: "kanban", label: "Kanban" },
    { id: "swimlane", label: "Swim Lanes" },
  ];

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b bg-background/80 backdrop-blur-sm">
      {/* Board view toggle — only shown when not in cron view */}
      {viewMode !== "cron" && (
        <div className="flex rounded-md border overflow-hidden">
          {boardViews.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setViewMode(v.id)}
              className={`px-3 py-1 text-xs transition-colors outline-none focus-visible:ring-1 focus-visible:ring-primary/60 focus-visible:z-10 ${
                viewMode === v.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground"
              }`}
              aria-pressed={viewMode === v.id}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}

      {viewMode !== "cron" && <Separator orientation="vertical" className="h-5" />}

      {/* CSV tools — only when on board views */}
      {viewMode !== "cron" && (
        <>
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
        </>
      )}

      {/* CRON tab — pushed to the right */}
      <div className="ml-auto">
        <button
          type="button"
          onClick={() => setViewMode(viewMode === "cron" ? "kanban" : "cron")}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md border transition-colors ${
            viewMode === "cron"
              ? "bg-purple-600 text-white border-purple-600"
              : "text-muted-foreground border-border hover:bg-muted hover:text-foreground"
          }`}
          aria-pressed={viewMode === "cron"}
          aria-label={viewMode === "cron" ? "Back to board view" : "Open CRON schedule view"}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${viewMode === "cron" ? "bg-white" : "bg-purple-400"}`} />
          <span className="hidden sm:inline">CRON</span>
          <span className="sm:hidden">Cron</span>
        </button>
      </div>
    </div>
  );
}
