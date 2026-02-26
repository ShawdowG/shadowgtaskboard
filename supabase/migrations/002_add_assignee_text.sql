-- Migration 002: add assignee text column for agent name strings
-- Keeps assignee_id uuid for future human-user linking

ALTER TABLE public.work_items
  ADD COLUMN IF NOT EXISTS assignee text;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS slug text;

-- Efficient swim-lane grouping queries
CREATE INDEX IF NOT EXISTS idx_work_items_assignee
  ON public.work_items (project_id, assignee)
  WHERE assignee IS NOT NULL;

-- Efficient kanban lane queries
CREATE INDEX IF NOT EXISTS idx_work_items_project_status
  ON public.work_items (project_id, status, sort_order);
