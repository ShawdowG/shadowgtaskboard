"use client";

import { useMemo, useState } from "react";

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

const LANES: { key: Status; label: string; color: string }[] = [
  { key: "backlog", label: "Backlog", color: "#CBD5E1" },
  { key: "working", label: "Working", color: "#93C5FD" },
  { key: "review", label: "Review", color: "#FCD34D" },
  { key: "done", label: "Done", color: "#86EFAC" },
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

  const selectedItem = useMemo(() => items.find((i) => i.id === selectedId) ?? null, [items, selectedId]);

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
  };

  const moveItem = (itemId: string, nextStatus: Status) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== itemId) return i;
        addActivity(itemId, `Moved ${i.status} -> ${nextStatus}`);
        return { ...i, status: nextStatus };
      }),
    );
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
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid CSV import");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-5 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="rounded-xl bg-white p-4 shadow-sm">
          <h1 className="text-xl font-bold">ShadowGTaskBoard MVP</h1>
          <p className="text-sm text-slate-600">Single workspace · 4 lanes · max depth 3 · comments + activity · CSV import/export</p>
        </header>

        <section className="grid gap-3 rounded-xl bg-white p-4 shadow-sm md:grid-cols-6">
          <input className="rounded border p-2" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className="rounded border p-2" placeholder="Assignee" value={assignee} onChange={(e) => setAssignee(e.target.value)} />
          <select className="rounded border p-2" value={status} onChange={(e) => setStatus(e.target.value as Status)}>
            {LANES.map((lane) => (
              <option key={lane.key} value={lane.key}>
                {lane.label}
              </option>
            ))}
          </select>
          <select className="rounded border p-2" value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">No parent</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {"-".repeat(item.depth)} {item.title}
              </option>
            ))}
          </select>
          <input className="rounded border p-2 md:col-span-2" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <button className="rounded bg-slate-900 px-3 py-2 text-white md:col-span-6" onClick={addItem}>
            Add Work Item
          </button>
          {error && <p className="text-sm text-red-600 md:col-span-6">{error}</p>}
        </section>

        <section className="grid gap-3 rounded-xl bg-white p-4 shadow-sm md:grid-cols-6">
          <input className="rounded border p-2" placeholder="Filter assignee" value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)} />
          <input className="rounded border p-2 md:col-span-2" placeholder="Search title/description" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="rounded border px-3 py-2" onClick={exportCsv}>Export CSV</button>
          <button className="rounded border px-3 py-2" onClick={importCsv}>Import CSV</button>
          <textarea
            className="rounded border p-2 md:col-span-6"
            rows={5}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="CSV payload"
          />
        </section>

        <section className="grid gap-3 lg:grid-cols-5">
          <div className="grid gap-3 lg:col-span-4 lg:grid-cols-4">
            {LANES.map((lane) => (
              <div key={lane.key} className="rounded-xl border bg-white p-3 shadow-sm">
                <div className="mb-2 rounded px-2 py-1 text-sm font-semibold" style={{ backgroundColor: lane.color }}>
                  {lane.label}
                </div>
                <div className="space-y-2">
                  {filteredItems
                    .filter((i) => i.status === lane.key)
                    .map((item) => (
                      <article
                        key={item.id}
                        className={`cursor-pointer rounded border p-2 text-sm ${selectedId === item.id ? "border-slate-900" : "border-slate-200"}`}
                        onClick={() => setSelectedId(item.id)}
                      >
                        <h3 className="font-medium">{"↳ ".repeat(item.depth)}{item.title}</h3>
                        <p className="text-xs text-slate-500">{item.assignee}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {LANES.filter((l) => l.key !== item.status).map((l) => (
                            <button
                              key={l.key}
                              className="rounded border px-2 py-1 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveItem(item.id, l.key);
                              }}
                            >
                              Move to {l.label}
                            </button>
                          ))}
                        </div>
                      </article>
                    ))}
                </div>
              </div>
            ))}
          </div>

          <aside className="rounded-xl border bg-white p-3 shadow-sm">
            <h2 className="mb-2 font-semibold">Item Detail</h2>
            {!selectedItem && <p className="text-sm text-slate-500">Select a card to view details.</p>}
            {selectedItem && (
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium">{selectedItem.title}</p>
                  <p className="text-slate-600">{selectedItem.description || "No description"}</p>
                  <p className="text-xs text-slate-500">Assignee: {selectedItem.assignee}</p>
                </div>

                <div>
                  <p className="mb-1 font-medium">Comments (markdown text)</p>
                  <textarea
                    rows={3}
                    className="w-full rounded border p-2"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write comment..."
                  />
                  <button className="mt-1 rounded border px-2 py-1" onClick={addComment}>
                    Add Comment
                  </button>
                  <div className="mt-2 space-y-1">
                    {comments
                      .filter((c) => c.itemId === selectedItem.id)
                      .map((c) => (
                        <div key={c.id} className="rounded bg-slate-100 p-2 text-xs">
                          <p>{c.body}</p>
                          <p className="text-slate-500">{c.createdAt}</p>
                        </div>
                      ))}
                  </div>
                </div>

                <div>
                  <p className="mb-1 font-medium">Activity</p>
                  <div className="space-y-1">
                    {activity
                      .filter((a) => a.itemId === selectedItem.id)
                      .map((a) => (
                        <div key={a.id} className="rounded bg-slate-100 p-2 text-xs">
                          <p>{a.message}</p>
                          <p className="text-slate-500">{a.createdAt}</p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </aside>
        </section>
      </div>
    </main>
  );
}
