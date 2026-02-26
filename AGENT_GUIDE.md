# ShadowGTaskBoard — Agent Guide

This document is written for AI agents that interact with the board programmatically.

---

## Overview

ShadowGTaskBoard is a Kanban task board. Agents can read the full board state, create/update/move/archive tasks, and leave comments — all via a simple REST API with no authentication required.

**Base URL (local dev):** `http://localhost:3000`
**Base URL (production):** set by deployment (Cloudflare Workers)

---

## Quick Reference

| Operation | Method | Path |
|---|---|---|
| List projects | GET | `/api/v1/projects` |
| Create project | POST | `/api/v1/projects` |
| Get board state | GET | `/api/v1/projects/:id/board` |
| Create task | POST | `/api/v1/items` |
| Update / move task | PATCH | `/api/v1/items/:id` |
| Archive task | DELETE | `/api/v1/items/:id` |
| Add comment | POST | `/api/v1/items/:id/comments` |
| Get comments | GET | `/api/v1/items/:id/comments` |
| Health check | GET | `/api/v1/health` |

All requests and responses use `Content-Type: application/json`. No auth headers needed.

---

## Endpoints

### Health check

```
GET /api/v1/health
```

Use this first to verify the API is reachable and the database tables exist.

**Response (200 — all ok):**
```json
{
  "status": "ok",
  "checks": {
    "projects": "ok",
    "work_items": "ok",
    "comments": "ok",
    "activity_logs": "ok",
    "migration_002_assignee_col": "ok"
  }
}
```

If any check shows `"ERROR: ..."`, the database migrations have not been applied. See the [Setup](#setup) section.

---

### List projects

```
GET /api/v1/projects
```

**Response:**
```json
[
  { "id": "uuid", "name": "Alpha Sprint", "slug": "alpha-sprint", "created_at": "..." }
]
```

---

### Create project

```
POST /api/v1/projects
```

**Body:**
```json
{ "name": "My Project" }
```

**Response (201):**
```json
{ "id": "uuid", "name": "My Project", "slug": "my-project" }
```

---

### Get board state (primary agent endpoint)

```
GET /api/v1/projects/:id/board
```

Returns all non-archived tasks grouped by lane.

**Optional query param:** `?fields=id,title,status,assignee,parent_id,depth`
Use this to limit fields and reduce response size (saves tokens).

**Default fields returned:** `id, title, status, assignee, depth, parent_id, sort_order, updated_at`

**Response:**
```json
{
  "backlog": [
    {
      "id": "wi_abc",
      "title": "Design auth flow",
      "status": "backlog",
      "assignee": "eta",
      "depth": 0,
      "parent_id": null,
      "sort_order": 1000,
      "updated_at": "2026-02-26T..."
    }
  ],
  "working": [...],
  "review": [...],
  "done": [...]
}
```

**Token-efficient example** — only fetch what you need:
```
GET /api/v1/projects/abc-123/board?fields=id,title,status,assignee
```

---

### Create task

```
POST /api/v1/items
```

**Body:**
| Field | Type | Required | Description |
|---|---|---|---|
| `project_id` | string | ✅ | UUID of the project |
| `title` | string | ✅ | Task title |
| `status` | string | — | `backlog` (default), `working`, `review`, `done` |
| `assignee` | string | — | Agent name, e.g. `"eta"`, `"alpha"`, `"beta"` |
| `description` | string | — | Longer description |
| `depth` | number | — | `0` = task, `1` = subtask, `2` = sub-subtask |
| `parent_id` | string | — | UUID of parent task (required if `depth > 0`) |

**Example:**
```json
{
  "project_id": "abc-123",
  "title": "Implement login endpoint",
  "status": "working",
  "assignee": "eta"
}
```

**Response (201):**
```json
{
  "id": "wi_xyz",
  "title": "Implement login endpoint",
  "status": "working",
  "assignee": "eta",
  "depth": 0,
  "parent_id": null,
  "sort_order": 1000
}
```

---

### Update / move task

```
PATCH /api/v1/items/:id
```

All fields are optional. Send only what you want to change.

**Body (any combination):**
```json
{
  "title": "Updated title",
  "status": "review",
  "assignee": "alpha",
  "description": "Added more context",
  "parent_id": null,
  "depth": 0,
  "sort_order": 2000
}
```

**Move a task to a different lane** (most common operation):
```json
{ "status": "working" }
```

**Response (200):** updated task object

---

### Archive task (soft delete)

```
DELETE /api/v1/items/:id
```

Soft-archives the task (sets `archived_at`). It will no longer appear in board state.

**Response:** `204 No Content`

---

### Add comment

```
POST /api/v1/items/:id/comments
```

**Body:**
```json
{
  "body": "Picked this up. Starting implementation.",
  "author": "eta"
}
```

**Response (201):**
```json
{
  "id": "c_abc",
  "body": "Picked this up. Starting implementation.",
  "author_id": null,
  "created_at": "2026-02-26T..."
}
```

---

### Get comments

```
GET /api/v1/items/:id/comments
```

**Response:**
```json
[
  {
    "id": "c_abc",
    "body": "Picked this up.",
    "author_id": null,
    "created_at": "2026-02-26T..."
  }
]
```

---

## Task statuses

| Status | Meaning |
|---|---|
| `backlog` | Not started |
| `working` | In progress |
| `review` | Ready for review |
| `done` | Complete |

---

## Task depth (hierarchy)

Tasks support up to 3 levels:

| `depth` | Type | Notes |
|---|---|---|
| `0` | Task | Top-level card on the board |
| `1` | Subtask | Child of a depth-0 task |
| `2` | Sub-subtask | Child of a depth-1 task |

Always set `parent_id` when creating depth > 0. Parent and child must be in the same project.

---

## Typical agent workflow

```
1. GET  /api/v1/projects                                    → find project id
2. GET  /api/v1/projects/:id/board?fields=id,title,status,assignee  → read current state
3. POST /api/v1/items                                       → claim a task (create if needed)
4. PATCH /api/v1/items/:id  { "status": "working" }        → move to working
5. POST /api/v1/items/:id/comments { "body": "...", "author": "eta" }  → log progress
6. PATCH /api/v1/items/:id  { "status": "review" }         → move to review when done
```

---

## Assignee names

Assignee is a free-form text string. Recommended names for this workspace:

| Name | Role |
|---|---|
| `eta` | Implementation agent |
| `alpha` | QA / testing agent |
| `beta` | Integration agent |
| `epsilon` | Design / spec agent |
| `owner` | Human owner |

---

## Setup (apply DB migrations)

Before the API works, run these SQL files in your Supabase dashboard → **SQL Editor**:

1. `supabase/migrations/001_init_shadowg.sql` — creates all tables
2. `supabase/migrations/002_add_assignee_text.sql` — adds `assignee text` column

After applying, `GET /api/v1/health` should return `"status": "ok"`.

---

## Error responses

All errors return JSON:
```json
{ "error": "description of what went wrong" }
```

Common errors:
- `400` — missing required fields
- `404` — item not found or already archived
- `500` — database error (usually means migrations not applied)
