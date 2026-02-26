"use client";

import { useEffect } from "react";
import { useBoardContext } from "./BoardContext";
import { useProjects } from "@/hooks/useBoard";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { ProjectSwitcher } from "./ProjectSwitcher";
import { BoardToolbar } from "./BoardToolbar";
import { KanbanBoard } from "./KanbanBoard";
import { SwimLaneBoard } from "./SwimLaneBoard";
import { ItemDetailDrawer } from "./ItemDetailDrawer";

export function BoardShell() {
  const { projectId, setProjectId, viewMode } = useBoardContext();
  const { data: projects } = useProjects();

  // Auth gate — skip on localhost for easy local dev
  useEffect(() => {
    const isLocal =
      window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (isLocal) return;
    void (async () => {
      const db = getSupabaseBrowserClient();
      const { data } = await db.auth.getSession();
      if (!data.session) window.location.href = "/login";
    })();
  }, []);

  // Auto-select first project
  useEffect(() => {
    if (projects?.length && !projectId) {
      setProjectId(projects[0].id);
    }
  }, [projects, projectId, setProjectId]);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <ProjectSwitcher />
      <BoardToolbar />
      <main className="flex-1 overflow-hidden">
        {viewMode === "kanban" ? <KanbanBoard /> : <SwimLaneBoard />}
      </main>
      <ItemDetailDrawer />
    </div>
  );
}
