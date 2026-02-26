-- Migration 004: cron job definitions for scheduled agent tasks

CREATE TABLE IF NOT EXISTS public.cron_jobs (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id  uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  name        text NOT NULL,
  schedule    text NOT NULL,          -- human-readable, e.g. "every 1h", "daily at 09:00"
  assignee    text,                   -- which agent runs this job
  description text,
  enabled     boolean DEFAULT true,
  last_run_at timestamptz,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cron_jobs_project ON public.cron_jobs (project_id);

-- Disable RLS (internal tool, no auth on agent API)
ALTER TABLE public.cron_jobs DISABLE ROW LEVEL SECURITY;
