"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type ViewMode = "kanban" | "swimlane" | "cron";

export interface BoardContextValue {
  projectId: string | null;
  setProjectId: (id: string) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  openItemId: string | null;
  setOpenItemId: (id: string | null) => void;
}

const BoardContext = createContext<BoardContextValue | null>(null);

export function BoardProvider({ children }: { children: ReactNode }) {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [openItemId, setOpenItemId] = useState<string | null>(null);

  return (
    <BoardContext.Provider
      value={{ projectId, setProjectId, viewMode, setViewMode, openItemId, setOpenItemId }}
    >
      {children}
    </BoardContext.Provider>
  );
}

export function useBoardContext() {
  const ctx = useContext(BoardContext);
  if (!ctx) throw new Error("useBoardContext must be used within BoardProvider");
  return ctx;
}
