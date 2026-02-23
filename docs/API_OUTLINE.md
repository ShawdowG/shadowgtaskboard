# ShadowGTaskBoard MVP API Outline

## Auth
- Private/internal access only.
- Magic link login.
- Public signup disabled.

## Projects
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:id`
- `PATCH /api/projects/:id`

## Work Items
- `GET /api/projects/:id/work-items?status=&assignee=&q=`
- `POST /api/work-items`
- `PATCH /api/work-items/:id`
- `DELETE /api/work-items/:id` (soft archive)

## Comments
- `GET /api/work-items/:id/comments`
- `POST /api/work-items/:id/comments`

## Activity
- `GET /api/work-items/:id/activity`

## CSV
- `POST /api/projects/:id/import-csv`
- `GET /api/projects/:id/export-csv`
