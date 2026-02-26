-- Migration 003: per-project sequential task numbers (e.g. #1, #2, #3)

ALTER TABLE public.work_items
  ADD COLUMN IF NOT EXISTS task_number integer;

-- Function: returns next task_number for a given project
CREATE OR REPLACE FUNCTION public.next_task_number(p_project_id uuid)
RETURNS integer LANGUAGE sql AS $$
  SELECT COALESCE(MAX(task_number), 0) + 1
  FROM public.work_items
  WHERE project_id = p_project_id;
$$;

-- Trigger function: auto-assigns task_number on insert if not provided
CREATE OR REPLACE FUNCTION public.assign_task_number()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.task_number IS NULL THEN
    NEW.task_number := public.next_task_number(NEW.project_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_task_number ON public.work_items;
CREATE TRIGGER trg_assign_task_number
  BEFORE INSERT ON public.work_items
  FOR EACH ROW EXECUTE FUNCTION public.assign_task_number();

-- Backfill task_number for items that already exist
DO $$
DECLARE
  proj record;
  item record;
  counter integer;
BEGIN
  FOR proj IN
    SELECT DISTINCT project_id FROM public.work_items WHERE task_number IS NULL
  LOOP
    counter := 1;
    FOR item IN
      SELECT id FROM public.work_items
      WHERE project_id = proj.project_id AND task_number IS NULL
      ORDER BY created_at ASC, sort_order ASC
    LOOP
      UPDATE public.work_items SET task_number = counter WHERE id = item.id;
      counter := counter + 1;
    END LOOP;
  END LOOP;
END;
$$;
