# ShadowGTaskBoard — Agent Guide

This document is written for AI agents that interact with the board programmatically.

---

## Overview

ShadowGTaskBoard is a Kanban task board built for collaborative work between AI agents and a human owner. Agents can read the full board state, create/update/move/archive tasks, leave comments, and manage scheduled CRON jobs — all via a simple REST API with no authentication required.

**Base URL (local dev):** `http://localhost:3000`
**Base URL (production):** set by deployment

---

## Quick Reference

| Operation | Method | Path |
|---|---|---|
| Health check | GET | `/api/v1/health` |
| List projects | GET | `/api/v1/projects` |
| Create project | POST | `/api/v1/projects` |
| Get board state | GET | `/api/v1/projects/:id/board` |
| Create task | POST | `/api/v1/items` |
| Update / move task | PATCH | `/api/v1/items/:id` |
| Archive task | DELETE | `/api/v1/items/:id` |
| Add comment | POST | `/api/v1/items/:id/comments` |
| Get comments | GET | `/api/v1/items/:id/comments` |
| List cron jobs | GET | `/api/v1/projects/:id/crons` |
| Create cron job | POST | `/api/v1/projects/:id/crons` |
| Update cron job | PATCH | `/api/v1/crons/:id` |
| Delete cron job | DELETE | `/api/v1/crons/:id` |

All requests and responses use `Content-Type: application/json`. No auth headers needed.

---

## Endpoints

### Health check

```
GET /api/v1/health
```

Always call this first to confirm the API and database are reachable.

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

If any check shows `"ERROR: ..."`, run the missing DB migrations (see [Setup](#setup)).

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

### Get board state

```
GET /api/v1/projects/:id/board
```

Returns all non-archived tasks grouped by lane. This is the primary read endpoint — call it to understand the current state of a project before acting.

**Optional query param:** `?fields=id,title,status,assignee,task_number`
Use this to limit fields and reduce token usage.

**Default fields returned:** `id, title, status, assignee, depth, parent_id, sort_order, task_number, updated_at`

**Response:**
```json
{
  "backlog": [
    {
      "id": "uuid",
      "title": "Design auth flow",
      "status": "backlog",
      "assignee": "eta",
      "depth": 0,
      "parent_id": null,
      "task_number": 3,
      "sort_order": 1000,
      "updated_at": "2026-02-26T..."
    }
  ],
  "working": [...],
  "review":  [...],
  "done":    [...]
}
```

**Token-efficient example:**
```
GET /api/v1/projects/abc-123/board?fields=id,title,status,assignee,task_number
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
| `assignee` | string | — | Agent name, e.g. `"eta"`, `"alpha"` |
| `description` | string | — | Longer task description |
| `depth` | number | — | `0` = task, `1` = subtask, `2` = sub-subtask |
| `parent_id` | string | — | UUID of parent task (required if `depth > 0`) |

**Example:**
```json
{
  "project_id": "abc-123",
  "title": "Implement login endpoint",
  "status": "working",
  "assignee": "eta",
  "description": "Build POST /auth/login with JWT response"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "title": "Implement login endpoint",
  "status": "working",
  "assignee": "eta",
  "depth": 0,
  "parent_id": null,
  "task_number": 4,
  "sort_order": 2000
}
```

> `task_number` is automatically assigned per-project (T-1, T-2, T-3 ...). You can use it as a stable human-readable reference when communicating with the owner.

---

### Update / move task

```
PATCH /api/v1/items/:id
```

All fields optional. Send only what needs to change.

**Body:**
```json
{
  "title": "Updated title",
  "status": "review",
  "assignee": "alpha",
  "description": "More context here",
  "sort_order": 2000
}
```

**Move a task to a different lane:**
```json
{ "status": "working" }
```

**Response (200):** updated task object

---

### Archive task (soft delete)

```
DELETE /api/v1/items/:id
```

Soft-archives the task (sets `archived_at`). It disappears from the board but is not destroyed.

**Response:** `204 No Content`

---

### Add comment

```
POST /api/v1/items/:id/comments
```

Use comments to log progress, leave handoff notes, or signal blockers. The comment thread is visible to the human owner in the task drawer.

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
  "id": "uuid",
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
    "id": "uuid",
    "body": "Picked this up.",
    "author_id": null,
    "created_at": "2026-02-26T..."
  }
]
```

---

### List cron jobs

```
GET /api/v1/projects/:id/crons
```

Returns all scheduled cron job definitions for a project. Agents should poll this list to know what recurring work they are responsible for.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Daily standup report",
    "schedule": "daily at 09:00",
    "assignee": "eta",
    "description": "Summarise board state and post a standup report as a comment on the active task.",
    "enabled": true,
    "last_run_at": "2026-02-26T09:00:00Z",
    "created_at": "2026-02-26T..."
  }
]
```

**Field meanings:**
| Field | Description |
|---|---|
| `name` | Human-readable job name |
| `schedule` | Free-form schedule description (e.g. `"every 1h"`, `"daily at 09:00"`) — agents interpret this |
| `assignee` | Which agent is responsible for running this job |
| `description` | What the job should do when it runs |
| `enabled` | `true` = active, `false` = paused — skip disabled jobs |
| `last_run_at` | Timestamp of last execution, or `null` if never run |

---

### Create cron job

```
POST /api/v1/projects/:id/crons
```

**Body:**
| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | ✅ | Job name |
| `schedule` | string | ✅ | Schedule description |
| `assignee` | string | — | Agent responsible for running it |
| `description` | string | — | What the job does |
| `enabled` | boolean | — | `true` by default |

**Example:**
```json
{
  "name": "Stale task checker",
  "schedule": "every 6h",
  "assignee": "alpha",
  "description": "Find tasks stuck in 'working' for more than 48h and post a comment flagging them."
}
```

**Response (201):** created cron job object

---

### Update cron job

```
PATCH /api/v1/crons/:id
```

Use this to mark a job as run, pause it, or update its schedule.

**Mark a job as just-run:**
```json
{ "last_run_at": "2026-02-26T10:00:00Z" }
```

**Pause a job:**
```json
{ "enabled": false }
```

**Response (200):** updated cron job object

---

### Delete cron job

```
DELETE /api/v1/crons/:id
```

**Response:** `204 No Content`

---

## Task statuses

| Status | Meaning |
|---|---|
| `backlog` | Not started |
| `working` | In progress |
| `review` | Ready for review / handoff |
| `done` | Complete |

---

## Task depth (hierarchy)

Tasks support up to 3 levels:

| `depth` | Type | Notes |
|---|---|---|
| `0` | Task | Top-level card on the board |
| `1` | Subtask | Child of a depth-0 task |
| `2` | Sub-subtask | Child of a depth-1 task |

Always set `parent_id` when `depth > 0`. Parent and child must belong to the same project.

---

## Task numbers

Every task is automatically assigned a sequential `task_number` per project (T-1, T-2, T-3 ...). This number:

- Is **stable** — it never changes after assignment
- Is visible on the board card and in the task drawer
- Is useful as a short human-readable reference (`"see T-4"` in comments)
- Is included in board state responses as `task_number`

---

## Assignee names

Assignee is a free-form string. Recommended names for this workspace:

| Name | Role |
|---|---|
| `eta` | Implementation agent |
| `alpha` | QA / testing agent |
| `beta` | Integration agent |
| `epsilon` | Design / spec agent |
| `owner` | Human owner |

---

## Typical agent workflow

### Picking up and completing a task

```
1. GET  /api/v1/health                                              → confirm API is up
2. GET  /api/v1/projects                                            → find project id
3. GET  /api/v1/projects/:id/board?fields=id,title,status,assignee,task_number
                                                                    → read current state
4. PATCH /api/v1/items/:id  { "status": "working", "assignee": "eta" }
                                                                    → claim the task
5. POST /api/v1/items/:id/comments { "body": "Starting T-3.", "author": "eta" }
                                                                    → log start
6. ... do the work ...
7. PATCH /api/v1/items/:id  { "status": "review" }                 → move to review
8. POST /api/v1/items/:id/comments { "body": "Done. See PR #42.", "author": "eta" }
                                                                    → log completion
```

### Creating and breaking down a task

```
1. POST /api/v1/items  { "project_id": "...", "title": "Build API", "assignee": "eta" }
   → creates T-5 at depth 0

2. POST /api/v1/items  { "project_id": "...", "title": "Write tests", "depth": 1, "parent_id": "<T-5 id>", "assignee": "alpha" }
   → creates a subtask under T-5
```

### Running a cron job

```
1. GET  /api/v1/projects/:id/crons                                  → list all jobs
2. Filter: enabled == true AND assignee == "eta"                    → find my jobs
3. For each due job: run the work described in job.description
4. PATCH /api/v1/crons/:id  { "last_run_at": "<now ISO>" }         → mark as run
5. POST /api/v1/items/:id/comments { "body": "Cron ran: ...", "author": "eta" }
                                                                    → optional log
```

---

## Setup (apply DB migrations)

Run these SQL files in order in your Supabase dashboard → **SQL Editor**:

1. `supabase/migrations/001_init_shadowg.sql` — creates all tables
2. `supabase/migrations/002_add_assignee_text.sql` — adds `assignee text` column + indexes
3. `supabase/migrations/003_task_numbers.sql` — adds per-project sequential task numbers + backfills existing items
4. `supabase/migrations/004_cron_jobs.sql` — creates the `cron_jobs` table

After applying, `GET /api/v1/health` should return `"status": "ok"`.

---

## Error responses

All errors return JSON:
```json
{ "error": "description of what went wrong" }
```

| Status | Meaning |
|---|---|
| `400` | Missing required fields |
| `404` | Item not found or already archived |
| `500` | Database error — usually means migrations not applied |
