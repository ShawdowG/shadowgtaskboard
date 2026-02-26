import useSWR, { mutate } from "swr";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export type WorkItem = {
  id: string;
  title: string;
  status: "backlog" | "working" | "review" | "done";
  assignee: string | null;
  depth: number;
  parent_id: string | null;
  sort_order: number;
  description: string | null;
  updated_at: string;
};

export type Project = {
  id: string;
  name: string;
  slug: string | null;
  created_at: string;
};

export type Comment = {
  id: string;
  body: string;
  author_id: string | null;
  created_at: string;
};

export type ActivityLog = {
  id: string;
  actor_id: string | null;
  event_type: string;
  event_payload: Record<string, unknown>;
  created_at: string;
};

async function fetchProjects(): Promise<Project[]> {
  const db = getSupabaseBrowserClient();
  const { data, error } = await db
    .from("projects")
    .select("id,name,slug,created_at")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

async function fetchBoardItems(projectId: string): Promise<WorkItem[]> {
  const db = getSupabaseBrowserClient();
  const { data, error } = await db
    .from("work_items")
    .select("id,title,status,assignee,depth,parent_id,sort_order,description,updated_at")
    .eq("project_id", projectId)
    .is("archived_at", null)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as WorkItem[];
}

async function fetchComments(itemId: string): Promise<Comment[]> {
  const db = getSupabaseBrowserClient();
  const { data, error } = await db
    .from("comments")
    .select("id,body,author_id,created_at")
    .eq("work_item_id", itemId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

async function fetchActivity(itemId: string): Promise<ActivityLog[]> {
  const db = getSupabaseBrowserClient();
  const { data, error } = await db
    .from("activity_logs")
    .select("id,actor_id,event_type,event_payload,created_at")
    .eq("work_item_id", itemId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export function useProjects() {
  return useSWR<Project[]>("projects", fetchProjects, { revalidateOnFocus: false });
}

export function useBoardItems(projectId: string | null) {
  return useSWR<WorkItem[]>(
    projectId ? ["board-items", projectId] : null,
    ([, id]) => fetchBoardItems(id as string),
    { revalidateOnFocus: false, dedupingInterval: 2000 },
  );
}

export function useComments(itemId: string | null) {
  return useSWR<Comment[]>(
    itemId ? ["comments", itemId] : null,
    ([, id]) => fetchComments(id as string),
  );
}

export function useActivity(itemId: string | null) {
  return useSWR<ActivityLog[]>(
    itemId ? ["activity", itemId] : null,
    ([, id]) => fetchActivity(id as string),
  );
}

// Helpers for optimistic updates
export function revalidateBoard(projectId: string) {
  mutate(["board-items", projectId]);
}

export function revalidateComments(itemId: string) {
  mutate(["comments", itemId]);
}
