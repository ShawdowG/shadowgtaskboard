# ENG-1104 – /v2 smoke test checklist

Use this file as a concrete implementation checklist when wiring the first `/v2` E2E tests.

## Routes
- [ ] `/v2` loads without auth redirect in local dev (localhost/127.0.0.1).
- [ ] `/` remains the primary non-v2 entry surface (no v2 `data-testid`s).

## Core v2 hooks on `/v2`
Assert all of these exist on the v2 route:
- [ ] `data-testid="v2-root"`
- [ ] `data-testid="v2-qa-banner"`
- [ ] `data-testid="v2-qa-label"`
- [ ] `data-testid="v2-beta-pill"`
- [ ] `data-testid="v2-back-to-main-link"` (desktop)
- [ ] `data-testid="v2-back-to-main-link-mobile"` (mobile helper)
- [ ] `data-testid="v2-mobile-helper"`
- [ ] `data-testid="v2-qa-description"`
- [ ] `data-testid="v2-board-region"`
- [ ] `data-testid="v2-board-view"`
- [ ] `data-testid="v2-skip-to-board-link"`

## Negative check on `/`
On the root route (`/`), assert that **none** of the above v2-only `data-testid`s are present.

## Landmarks & a11y wiring
- [ ] On `/v2`, `v2-board-region` has `role="main"`, an `aria-label`, and `tabIndex={-1}`.
- [ ] On `/v2`, `v2-board-view` has `role="region"` and `aria-label="ShadowG /v2 board view"`.
- [ ] On `/`, the board shell exposes a single `role="main"` landmark (no v2 test ids).
- [ ] `v2-qa-banner` has `role="banner"` and `aria-describedby="v2-qa-description"`.

## Skip link behavior (ENG-1103)
- [ ] Tabbing into the page reaches `v2-skip-to-board-link`.
- [ ] Activating the skip link moves focus to `#v2-board-main` (the `v2-board-region` element).

Keep this checklist in sync with `docs/ENG-1100-1103-v2-qa-hooks.md` as v2 evolves.
