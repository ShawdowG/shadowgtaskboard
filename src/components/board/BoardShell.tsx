"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useBoardContext } from "./BoardContext";
import { useProjects } from "@/hooks/useBoard";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { ProjectSwitcher } from "./ProjectSwitcher";
import { BoardToolbar } from "./BoardToolbar";
import { KanbanBoard } from "./KanbanBoard";
import { SwimLaneBoard } from "./SwimLaneBoard";
import { ItemDetailDrawer } from "./ItemDetailDrawer";
import { CronView } from "./CronView";

export function BoardShell() {
  const pathname = usePathname();
  const isV2 = pathname?.startsWith("/v2");
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
      {/* ENG-1102: on /v2 the layout already exposes the main landmark via
          v2-board-region, so we treat the inner board as a labeled region
          instead of a second main. On the root (/) route, this remains the
          primary main landmark. */}
      <main
        className="flex-1 overflow-hidden"
        role={isV2 ? "region" : "main"}
        aria-label={isV2 ? "ShadowG /v2 board view" : "ShadowG board view"}
        data-testid={isV2 ? "v2-board-view" : undefined}
      >
        {viewMode === "cron" ? (
          <CronView />
        ) : viewMode === "kanban" ? (
          <KanbanBoard />
        ) : (
          <SwimLaneBoard />
        )}
      </main>
      <ItemDetailDrawer />
    </div>
  );
}
