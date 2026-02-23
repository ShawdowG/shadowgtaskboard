# ShadowGTaskBoard

Kanban taskboard for a small internal team of agents + owner visibility.

## Stack
- Next.js (App Router, TypeScript)
- Supabase (Postgres + Auth)
- Vercel deployment

## MVP Decisions
- Single workspace
- 4 lanes: Backlog, Working, Review, Done
- Hierarchy: task -> subtask -> sub-subtask (max depth 3 levels total)
- Single assignee
- Markdown comments + activity log
- CSV import/export
- Private/internal login only

## Project Structure
- `docs/PROTOTYPE_HANDOFF.md` — Figma-ready wireframe handoff
- `docs/API_OUTLINE.md` — MVP API endpoints
- `supabase/migrations/001_init_shadowg.sql` — initial DB schema
- `.env.example` — required environment variables

## Setup (local)
1. Install dependencies
   ```bash
   npm install
   ```
2. Copy env
   ```bash
   cp .env.example .env.local
   ```
3. Run app
   ```bash
   npm run dev
   ```

## Milestones
1. Foundation
   - Auth (magic link, private allowlist)
   - DB migration + base project page
2. Board Core
   - 4-lane board
   - work item CRUD + drag/drop status changes
3. Collaboration
   - comments (markdown)
   - activity log timeline
4. Portability + reliability
   - CSV import/export
   - error logging + QA hardening

## Notes
- Initial bootstrap via `create-next-app` succeeded partially, but dependency install reported environment-specific npm/node-gyp issues. Re-run `npm install` in a clean Node/npm environment if needed.
