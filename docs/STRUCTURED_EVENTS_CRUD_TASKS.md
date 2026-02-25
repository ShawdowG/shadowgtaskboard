# Structured Events + Efficient CRUD Updates (Kickoff)

## Objective
Implement a structured JSON event protocol and move ShadowGTaskBoard syncing from full-table upserts to efficient per-item CRUD updates.

## Workstreams

### Epsilon (design/spec)
- [ ] Define event envelope schema (`version`, `eventId`, `entity`, `action`, `actor`, `occurredAt`, `payload`)
- [ ] Define CRUD mutation model used by UI + sync layer
- [ ] Define idempotency/ordering expectations for client-side event queue

### ETA (implementation)
- [ ] Add `src/lib/board-protocol.ts` for typed event protocol
- [ ] Add `src/lib/board-crud.ts` with deterministic CRUD apply helper
- [ ] Refactor board mutations to use typed CRUD helper
- [ ] Replace full-list Supabase `upsert` effect with incremental pending upserts/deletes sync
- [ ] Emit structured events for create/update/comment/import actions

### Beta (integration/reliability)
- [ ] Add debounce/coalescing for pending sync queue
- [ ] Add optimistic rollback strategy for failed sync batches
- [ ] Add migration path for future server-side event ingestion endpoint

### Alpha (QA)
- [ ] Validate create/update lane move only sync changed records
- [ ] Validate comments/events stay consistent after reload
- [ ] Validate import path does not corrupt event ordering metadata
- [ ] Validate fallback to local cache when Supabase unavailable

## Created task IDs
- SGTB-EPS-001: Event envelope + mutation protocol spec
- SGTB-ETA-001: Protocol types + CRUD helper implementation
- SGTB-ETA-002: Incremental Supabase sync refactor
- SGTB-BETA-001: Sync queue coalescing + retry strategy
- SGTB-ALPHA-001: Regression matrix for structured events + CRUD
