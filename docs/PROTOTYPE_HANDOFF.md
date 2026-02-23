# ShadowGTaskBoard — Epsilon Prototype Handoff (for Figma)

## 1) Page Map
- Login (magic link)
- Project Dashboard
- Project Board (main)
- Item Detail Drawer (overlay)
- CSV Import/Export modal

## 2) Frame Specs (Low-fidelity)
### Desktop
- 1440x1024: Login
- 1440x1024: Project Dashboard
- 1440x1024: Board default
- 1440x1024: Board filtered (assignee + search)
- 1440x1024: Item Drawer open (task + subtask tree + comments/activity tabs)
- 1440x1024: CSV modal open

### Mobile
- 390x844: Login
- 390x844: Project list
- 390x844: Board lane-by-lane horizontal scroll
- 390x844: Item detail full-screen sheet

## 3) Components Inventory
- AppShell (topbar + project switcher)
- LaneColumn (Backlog/Working/Review/Done)
- WorkItemCard
- QuickAddItem
- ItemDetailDrawer
- SubitemTree (max depth: task -> subtask -> sub-subtask)
- CommentThread (markdown)
- ActivityTimeline
- FilterBar (assignee + search)
- ImportExportModal

## 4) Key Interaction Notes
- Drag card across lanes updates status immediately.
- Card click opens Item Detail Drawer.
- Subitems are created from parent drawer only (to keep board uncluttered).
- Parent status is manual (no automatic roll-up).
- Comments support markdown; activity log is immutable timeline.
- Single assignee per item for MVP.

## 5) Visual Tokens (MVP)
- Spacing scale: 4/8/12/16/24
- Radius: 10
- Font: Inter
- Lane colors (subtle):
  - Backlog: #CBD5E1
  - Working: #93C5FD
  - Review: #FCD34D
  - Done: #86EFAC

## 6) Figma Build Checklist (copy/paste)
1. Create pages: `01-Flows`, `02-Wireframes-Desktop`, `03-Wireframes-Mobile`, `04-Components`.
2. Add frame sizes listed above.
3. Build reusable components first: Card, Lane, Drawer, Tabs, Comment item.
4. Assemble board with 4 lanes and 6-10 mock cards.
5. Add 1 card with subtask + sub-subtask examples.
6. Prototype links:
   - Dashboard -> Board
   - Card -> Drawer
   - Import button -> CSV modal
7. Export clickable prototype link for review.

## 7) Open Blocking Need
- Figma file link + edit access needed if direct editing is required.
