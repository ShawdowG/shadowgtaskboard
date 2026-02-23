-- ShadowGTaskBoard MVP schema
create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type public.work_status as enum ('backlog', 'working', 'review', 'done');

create table if not exists public.work_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  parent_id uuid references public.work_items(id) on delete restrict,
  depth int not null default 0 check (depth between 0 and 2),
  title text not null,
  description text,
  assignee_id uuid,
  status public.work_status not null default 'backlog',
  sort_order numeric(12,4) not null default 0,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  work_item_id uuid not null references public.work_items(id) on delete cascade,
  author_id uuid,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  work_item_id uuid not null references public.work_items(id) on delete cascade,
  actor_id uuid,
  event_type text not null,
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_work_items_project on public.work_items(project_id);
create index if not exists idx_work_items_parent on public.work_items(parent_id);
create index if not exists idx_work_items_status on public.work_items(status);
create index if not exists idx_comments_item on public.comments(work_item_id);
create index if not exists idx_activity_item on public.activity_logs(work_item_id);

-- MVP constraint helper: parent/child must share project
create or replace function public.enforce_parent_project_match()
returns trigger language plpgsql as $$
begin
  if new.parent_id is not null then
    if exists (
      select 1 from public.work_items p
      where p.id = new.parent_id and p.project_id <> new.project_id
    ) then
      raise exception 'parent item must belong to same project';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_parent_project_match on public.work_items;
create trigger trg_parent_project_match
before insert or update on public.work_items
for each row execute function public.enforce_parent_project_match();
