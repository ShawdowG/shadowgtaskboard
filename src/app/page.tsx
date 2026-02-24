"use client";

import { createClient } from "@supabase/supabase-js";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";

type Status = "backlog" | "working" | "review" | "done";

type WorkItem = {
  id: string;
  title: string;
  description: string;
  assignee: string;
  status: Status;
  parentId: string | null;
  depth: 0 | 1 | 2;
  createdAt: string;
};

type Comment = {
  id: string;
  itemId: string;
  body: string;
  createdAt: string;
};

type Activity = {
  id: string;
  itemId: string;
  message: string;
  createdAt: string;
};

const STORAGE_KEY = "shadowg_items_v1";
const AUTH_KEY = "shadowg_auth_email_v1";
const storageKeyForEmail = (email: string) => `${STORAGE_KEY}_${email.toLowerCase()}`;

const LANES: { key: Status; label: string; icon: string; color: string; tint: string; emptyHint: string }[] = [
  { key: "backlog", label: "Backlog", icon: "○", color: "#dbe4ff", tint: "#f6f8ff", emptyHint: "Add ideas and upcoming tasks" },
  { key: "working", label: "Working", icon: "◔", color: "#bfdbfe", tint: "#f3f8ff", emptyHint: "Move active work here" },
  { key: "review", label: "Review", icon: "◑", color: "#fde68a", tint: "#fffcef", emptyHint: "Items waiting for feedback" },
  { key: "done", label: "Done", icon: "●", color: "#bbf7d0", tint: "#f2fdf6", emptyHint: "Completed work lands here" },
];

const seedItems: WorkItem[] = [
  {
    id: crypto.randomUUID(),
    title: "Set up auth allowlist",
    description: "Magic-link login + private domain allowlist",
    assignee: "eta",
    status: "backlog",
    parentId: null,
    depth: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    title: "Create board layout",
    description: "4-lane kanban + item cards",
    assignee: "eta",
    status: "working",
    parentId: null,
    depth: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    title: "Draft QA checklist",
    description: "Smoke checks for CRUD/CSV/move",
    assignee: "alpha",
    status: "review",
    parentId: null,
    depth: 0,
    createdAt: new Date().toISOString(),
  },
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const defaultAllowedEmails = ["kantasitms1@outlook.com"];

const allowedEmailSet = new Set(
  (process.env.NEXT_PUBLIC_ALLOWED_EMAILS ?? defaultAllowedEmails.join(","))
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean),
);
const allowedDomainSet = new Set(
  (process.env.NEXT_PUBLIC_ALLOWED_DOMAINS ?? "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean),
);

const isAllowedEmail = (email: string) => {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes("@")) return false;
  if (allowedEmailSet.has(normalized)) return true;
  const domain = normalized.split("@")[1];
  if (!domain) return false;
  return allowedDomainSet.has(domain);
};

const toCsv = (items: WorkItem[]) => {
  const head = "id,title,description,assignee,status,parentId,depth,createdAt";
  const rows = items.map((i) =>
    [i.id, i.title, i.description, i.assignee, i.status, i.parentId ?? "", i.depth, i.createdAt]
      .map((v) => `"${String(v).replaceAll('"', '""')}"`)
      .join(","),
  );
  return [head, ...rows].join("\n");
};

const parseCsv = (raw: string): WorkItem[] => {
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  return lines.slice(1).map((line) => {
    const cols = line
      .match(/("(?:[^"]|"")*"|[^,]+)/g)
      ?.map((c) => c.replace(/^"|"$/g, "").replaceAll('""', '"'));

    if (!cols || cols.length < 8) {
      throw new Error("Invalid CSV row");
    }

    const status = cols[4] as Status;
    if (!LANES.some((l) => l.key === status)) {
      throw new Error(`Invalid status: ${cols[4]}`);
    }

    const parsedDepth = Number(cols[6]);
    const depth = parsedDepth >= 0 && parsedDepth <= 2 ? (parsedDepth as 0 | 1 | 2) : 0;

    return {
      id: cols[0] || crypto.randomUUID(),
      title: cols[1],
      description: cols[2],
      assignee: cols[3],
      status,
      parentId: cols[5] || null,
      depth,
      createdAt: cols[7] || new Date().toISOString(),
    } satisfies WorkItem;
  });
};

const now = () => new Date().toLocaleString();

export default function Home() {
  const [items, setItems] = useState<WorkItem[]>(seedItems);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Status>("backlog");
  const [parentId, setParentId] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [search, setSearch] = useState("");
  const [csvText, setCsvText] = useState("");
  const [commentText, setCommentText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [syncState, setSyncState] = useState("Local only");
  const [hydrated, setHydrated] = useState(!supabase);
  const [authEmail, setAuthEmail] = useState(() => {
    if (typeof window === "undefined") return "";
    const cached = window.localStorage.getItem(AUTH_KEY) ?? "";
    return isAllowedEmail(cached) ? cached : "";
  });
  const [authInput, setAuthInput] = useState("");
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [dragOverLane, setDragOverLane] = useState<Status | null>(null);
  const [lastMovedItemId, setLastMovedItemId] = useState<string | null>(null);
  const [compactMode, setCompactMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showToolsModal, setShowToolsModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const addButtonRef = useRef<HTMLButtonElement | null>(null);

  const selectedItem = useMemo(() => items.find((i) => i.id === selectedId) ?? null, [items, selectedId]);

  useEffect(() => {
    if (!showAddModal && !showToolsModal && !showDetailModal) return;
    if (!lastFocusedRef.current) {
      lastFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setShowAddModal(false);
      setShowToolsModal(false);
      setShowDetailModal(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showAddModal, showToolsModal, showDetailModal]);

  useEffect(() => {
    if (showAddModal || showToolsModal || showDetailModal) return;
    if (lastFocusedRef.current) {
      lastFocusedRef.current.focus();
      lastFocusedRef.current = null;
      return;
    }
    addButtonRef.current?.focus();
  }, [showAddModal, showToolsModal, showDetailModal]);

  useEffect(() => {
    if (!supabase) return;

    const bootstrapAuth = async () => {
      const { data } = await supabase.auth.getSession();
      const sessionEmail = data.session?.user?.email?.toLowerCase() ?? "";
      if (sessionEmail && isAllowedEmail(sessionEmail)) {
        setAuthEmail(sessionEmail);
        localStorage.setItem(AUTH_KEY, sessionEmail);
      }
      setHydrated(true);
    };

    void bootstrapAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextEmail = session?.user?.email?.toLowerCase() ?? "";
      if (nextEmail && isAllowedEmail(nextEmail)) {
        setAuthEmail(nextEmail);
        localStorage.setItem(AUTH_KEY, nextEmail);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authEmail) return;

    const boot = async () => {
      if (supabase) {
        const { data, error: supaError } = await supabase
          .from("work_items")
          .select("id,title,description,assignee,status,parent_id,depth,created_at,owner_email")
          .eq("owner_email", authEmail)
          .order("created_at", { ascending: false });

        if (supaError) {
          setSyncState("Supabase unavailable, using local cache");
        } else if (data?.length) {
          setItems(
            data.map((row) => ({
              id: row.id,
              title: row.title,
              description: row.description ?? "",
              assignee: row.assignee ?? "unassigned",
              status: row.status as Status,
              parentId: row.parent_id,
              depth: (row.depth ?? 0) as 0 | 1 | 2,
              createdAt: row.created_at,
            })),
          );
          setSyncState("Supabase connected");
          return;
        }
      }

      const raw = localStorage.getItem(storageKeyForEmail(authEmail));
      if (raw) {
        try {
          setItems(JSON.parse(raw) as WorkItem[]);
        } catch {
          setItems(seedItems);
        }
      }
    };

    void boot();
  }, [authEmail]);

  useEffect(() => {
    if (!authEmail) return;
    localStorage.setItem(storageKeyForEmail(authEmail), JSON.stringify(items));

    const sync = async () => {
      if (!supabase) return;
      const payload = items.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        assignee: item.assignee,
        status: item.status,
        parent_id: item.parentId,
        depth: item.depth,
        created_at: item.createdAt,
        owner_email: authEmail,
      }));

      const { error: upsertError } = await supabase.from("work_items").upsert(payload);
      if (upsertError) {
        setSyncState("Supabase sync failed, local cache active");
      } else {
        setSyncState("Supabase connected");
      }
    };

    void sync();
  }, [items, authEmail]);

  const filteredItems = useMemo(() => {
    return items.filter((i) => {
      const byAssignee = filterAssignee ? i.assignee.toLowerCase().includes(filterAssignee.toLowerCase()) : true;
      const bySearch = search
        ? `${i.title} ${i.description}`.toLowerCase().includes(search.toLowerCase())
        : true;
      return byAssignee && bySearch;
    });
  }, [items, filterAssignee, search]);

  const getDepth = (pId: string | null): 0 | 1 | 2 => {
    if (!pId) return 0;
    const parent = items.find((i) => i.id === pId);
    if (!parent) return 0;
    return Math.min(2, parent.depth + 1) as 0 | 1 | 2;
  };

  const addActivity = (itemId: string, message: string) => {
    setActivity((prev) => [{ id: crypto.randomUUID(), itemId, message, createdAt: now() }, ...prev]);
  };

  const addItem = () => {
    setError(null);
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    const pId = parentId || null;
    const depth = getDepth(pId);

    if (pId) {
      const parent = items.find((i) => i.id === pId);
      if (!parent) {
        setError("Selected parent does not exist");
        return;
      }
      if (parent.depth >= 2) {
        setError("Max hierarchy depth reached (task -> subtask -> sub-subtask)");
        return;
      }
    }

    const newItem: WorkItem = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      assignee: assignee.trim() || "unassigned",
      status,
      parentId: pId,
      depth,
      createdAt: new Date().toISOString(),
    };

    setItems((prev) => [newItem, ...prev]);
    addActivity(newItem.id, `Created in ${status}`);
    setTitle("");
    setDescription("");
    setAssignee("");
    setParentId("");
    setShowAddModal(false);
  };

  const moveItem = (itemId: string, nextStatus: Status) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== itemId) return i;
        addActivity(itemId, `Moved ${i.status} -> ${nextStatus}`);
        return { ...i, status: nextStatus };
      }),
    );
    setLastMovedItemId(itemId);
    window.setTimeout(() => setLastMovedItemId((current) => (current === itemId ? null : current)), 320);
  };

  const addComment = () => {
    if (!selectedItem || !commentText.trim()) return;
    const comment: Comment = {
      id: crypto.randomUUID(),
      itemId: selectedItem.id,
      body: commentText.trim(),
      createdAt: now(),
    };
    setComments((prev) => [comment, ...prev]);
    addActivity(selectedItem.id, "Comment added");
    setCommentText("");
  };

  const exportCsv = () => setCsvText(toCsv(items));

  const importCsv = () => {
    try {
      const parsed = parseCsv(csvText);
      setItems(parsed);
      setSelectedId(null);
      setShowDetailModal(false);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid CSV import");
    }
  };

  const trapTabKey = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key !== "Tab") return;
    const root = event.currentTarget;
    const focusable = root.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const sendMagicLink = async () => {
    setAuthMessage(null);
    const email = authInput.trim().toLowerCase();

    const allowlistResponse = await fetch("/api/auth/allowlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!allowlistResponse.ok) {
      setAuthMessage("Allowlist check failed.");
      return;
    }

    const allowlistResult = (await allowlistResponse.json()) as { allowed?: boolean };
    if (!allowlistResult.allowed || !isAllowedEmail(email)) {
      setAuthMessage("Email not in allowlist.");
      return;
    }

    if (!supabase) {
      setAuthEmail(email);
      localStorage.setItem(AUTH_KEY, email);
      setAuthMessage("Allowed in local mode.");
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithOtp({ email });
    if (signInError) {
      setAuthMessage(`Magic link failed: ${signInError.message}`);
      return;
    }

    setAuthMessage("Magic link sent. Check inbox.");
  };

  const logout = async () => {
    setAuthEmail("");
    localStorage.removeItem(AUTH_KEY);
    if (supabase) await supabase.auth.signOut();
  };

  if (!hydrated) {
    return <main className="min-h-screen bg-slate-100 p-6 text-slate-700">Loading…</main>;
  }

  if (!authEmail) {
    return (
      <main className="min-h-screen bg-slate-100 p-5 text-slate-900">
        <div className="mx-auto mt-20 max-w-md space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h1 className="text-xl font-semibold">ShadowGTaskBoard</h1>
          <p className="text-sm text-slate-600">Sign in with an allowlisted email to access the board.</p>
          <input
            className="w-full rounded-lg border border-slate-200 p-2"
            placeholder="you@company.com"
            value={authInput}
            onChange={(e) => setAuthInput(e.target.value)}
          />
          <button className="w-full rounded-lg bg-slate-900 px-3 py-2 text-white" onClick={sendMagicLink}>
            Continue
          </button>
          {authMessage && <p className="text-xs text-slate-600">{authMessage}</p>}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 text-slate-900 md:p-6">
      <div className="mx-auto max-w-[1400px] space-y-5">
        <header className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur md:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">ShadowGTaskBoard</h1>
              <p className="text-sm text-slate-600">Focused Kanban workspace · 4 lanes · hierarchy depth 3 · comments/activity</p>
              <p className="mt-1 text-xs text-slate-500" aria-live="polite">Sync: {syncState}</p>
            </div>
            <div className="flex items-start gap-2">
              <button aria-haspopup="dialog" aria-expanded={showAddModal} ref={addButtonRef} className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white" onClick={() => setShowAddModal(true)}>
                + Add Item
              </button>
              <button aria-haspopup="dialog" aria-expanded={showToolsModal} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" onClick={() => setShowToolsModal(true)}>
                Filters & Tools
              </button>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-right">
                <p className="text-xs text-slate-500">{authEmail}</p>
                <button className="mt-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300" onClick={logout}>Sign out</button>
              </div>
            </div>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </header>

        <section className="-mx-1 overflow-x-auto px-1">
          <div className="grid min-w-[980px] gap-3 lg:min-w-0 lg:grid-cols-4">
            {LANES.map((lane) => (
              <div
                key={lane.key}
                className={`rounded-2xl border p-3 shadow-sm transition-all duration-150 ${dragOverLane === lane.key ? "-translate-y-0.5 border-slate-400 shadow-md" : "border-slate-200"}`}
                style={{ backgroundColor: lane.tint }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverLane(lane.key);
                }}
                onDragLeave={() => setDragOverLane((current) => (current === lane.key ? null : current))}
                onDrop={(e) => {
                  const itemId = e.dataTransfer.getData("text/plain");
                  if (itemId) moveItem(itemId, lane.key);
                  setDragOverLane(null);
                }}
              >
                <div className="sticky top-0 z-10 mb-2 flex items-center justify-between rounded-lg border border-white/70 px-2 py-1 text-sm font-semibold shadow-[0_1px_0_rgba(15,23,42,0.05)] backdrop-blur" style={{ backgroundColor: lane.color }}>
                  <span className="inline-flex items-center gap-1"><span className="text-slate-600">{lane.icon}</span>{lane.label}</span>
                  <span className="rounded-md bg-white/70 px-1.5 py-0.5 text-xs text-slate-600">
                    {filteredItems.filter((i) => i.status === lane.key).length}
                  </span>
                </div>
                <div className={`min-h-28 ${compactMode ? "space-y-1.5" : "space-y-2.5"}`}>
                  {filteredItems.filter((i) => i.status === lane.key).length === 0 && (
                    <p className="rounded-lg border border-dashed border-slate-200 px-2 py-3 text-center text-xs text-slate-400" style={{ backgroundColor: lane.color }}>
                      <span className="mb-1 block text-sm text-slate-500">{lane.icon}</span>
                      {lane.emptyHint}
                    </p>
                  )}
                  {filteredItems
                    .filter((i) => i.status === lane.key)
                    .map((item) => (
                      <article
                        key={item.id}
                        draggable
                        tabIndex={0}
                        role="button"
                        aria-haspopup="dialog"
                        aria-expanded={showDetailModal && selectedId === item.id}
                        onDragStart={(e) => e.dataTransfer.setData("text/plain", item.id)}
                        onDragEnd={() => setDragOverLane(null)}
                        className={`cursor-pointer rounded-lg border text-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 active:scale-[0.99] ${lastMovedItemId === item.id ? "ring-2 ring-emerald-200" : ""} ${compactMode ? "p-1.5" : "p-2.5"} border-slate-200 bg-white`}
                        onClick={() => {
                          setSelectedId(item.id);
                          setShowDetailModal(true);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedId(item.id);
                            setShowDetailModal(true);
                          }
                        }}
                      >
                        <h3 className={`font-semibold leading-snug tracking-tight ${compactMode ? "text-[12px]" : "text-[13px]"}`}>{"↳ ".repeat(item.depth)}{item.title}</h3>
                        <div className={compactMode ? "mt-0.5" : "mt-1"}>
                          <span className={`inline-flex items-center rounded-full border border-slate-200 bg-slate-50 font-medium uppercase tracking-wide text-slate-600 ${compactMode ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]"}`}>
                            {item.assignee}
                          </span>
                        </div>
                      </article>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/40 p-3 transition-opacity duration-150 motion-reduce:transition-none sm:items-center" onClick={() => setShowAddModal(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="add-item-title" className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-4 shadow-xl transition-all duration-150 motion-reduce:transition-none sm:translate-y-0" onClick={(e) => e.stopPropagation()} onKeyDown={trapTabKey}>
            <div className="mb-3 flex items-center justify-between">
              <h2 id="add-item-title" className="text-lg font-semibold">Add work item</h2>
              <button aria-label="Close add item modal" className="rounded-md border border-slate-200 px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300" onClick={() => setShowAddModal(false)}>Close</button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-6">
              <input autoFocus className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm md:col-span-2" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <input className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm" placeholder="Assignee" value={assignee} onChange={(e) => setAssignee(e.target.value)} />
              <select className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value as Status)}>
                {LANES.map((lane) => (
                  <option key={lane.key} value={lane.key}>{lane.label}</option>
                ))}
              </select>
              <select className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm md:col-span-2" value={parentId} onChange={(e) => setParentId(e.target.value)}>
                <option value="">No parent</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>{"-".repeat(item.depth)} {item.title}</option>
                ))}
              </select>
              <input className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm md:col-span-6" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
              <button className="h-10 rounded-lg bg-slate-900 px-3 text-sm text-white sm:col-span-2 md:col-span-6" onClick={() => { addItem(); setShowAddModal(false); }}>Add Work Item</button>
            </div>
          </div>
        </div>
      )}

      {showToolsModal && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/40 p-3 transition-opacity duration-150 motion-reduce:transition-none sm:items-center" onClick={() => setShowToolsModal(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="tools-title" className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-4 shadow-xl transition-all duration-150 motion-reduce:transition-none sm:translate-y-0" onClick={(e) => e.stopPropagation()} onKeyDown={trapTabKey}>
            <div className="mb-3 flex items-center justify-between">
              <h2 id="tools-title" className="text-lg font-semibold">Filters & board tools</h2>
              <button aria-label="Close filters and tools modal" className="rounded-md border border-slate-200 px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300" onClick={() => setShowToolsModal(false)}>Close</button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-6">
              <input autoFocus className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm" placeholder="Filter assignee" value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)} />
              <input className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm md:col-span-2" placeholder="Search title/description" value={search} onChange={(e) => setSearch(e.target.value)} />
              <button className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm" onClick={exportCsv}>Export CSV</button>
              <button className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm" onClick={importCsv}>Import CSV</button>
              <button className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm" onClick={() => setCompactMode((v) => !v)}>Density: {compactMode ? "Compact" : "Comfortable"}</button>
              <textarea className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm sm:col-span-2 md:col-span-6" rows={5} value={csvText} onChange={(e) => setCsvText(e.target.value)} placeholder="CSV payload" />
            </div>
          </div>
        </div>
      )}

      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/40 p-3 transition-opacity duration-150 motion-reduce:transition-none sm:items-center" onClick={() => setShowDetailModal(false)}>
          <aside role="dialog" aria-modal="true" aria-labelledby="detail-title" className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-4 shadow-xl transition-all duration-150 motion-reduce:transition-none sm:translate-y-0" onClick={(e) => e.stopPropagation()} onKeyDown={trapTabKey}>
            <div className="mb-2 flex items-center justify-between">
              <h2 id="detail-title" className="text-sm font-semibold uppercase tracking-wide text-slate-500">Item detail</h2>
              <button aria-label="Close item detail modal" className="rounded-md border border-slate-200 px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300" onClick={() => setShowDetailModal(false)}>Close</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="font-medium">{selectedItem.title}</p>
                <p className="text-slate-600">{selectedItem.description || "No description"}</p>
                <div className="mt-1">
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-600">
                    {selectedItem.assignee}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Comments (markdown text)</p>
                <textarea
                  autoFocus
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write comment..."
                />
                <button className="mt-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs" onClick={addComment}>
                  Add Comment
                </button>
                <div className="mt-2 space-y-1">
                  {comments
                    .filter((c) => c.itemId === selectedItem.id)
                    .map((c) => (
                      <div key={c.id} className="rounded-lg border border-slate-200 bg-white p-2 text-xs shadow-[0_1px_0_rgba(15,23,42,0.03)]">
                        <p className="text-slate-700">{c.body}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">{c.createdAt}</p>
                      </div>
                    ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Activity</p>
                <div className="space-y-1">
                  {activity
                    .filter((a) => a.itemId === selectedItem.id)
                    .map((a) => (
                      <div key={a.id} className="rounded-lg border border-slate-200 bg-white p-2 text-xs shadow-[0_1px_0_rgba(15,23,42,0.03)]">
                        <p className="text-slate-700">{a.message}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">{a.createdAt}</p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
