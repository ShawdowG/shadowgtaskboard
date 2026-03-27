# ENG-1100–ENG-1103: /v2 QA + a11y hooks

This note documents the current QA/a11y contract for the `/v2` surface.

## Layout entrypoint (`src/app/v2/layout.tsx`)

- Root shell
  - `<div data-testid="v2-root" aria-label="ShadowG TaskBoard v2 shell">`
- Skip link (ENG-1103)
  - `<a data-testid="v2-skip-to-board-link" href="#v2-board-main">Skip to v2 board</a>`
- QA banner (ENG-1100/ENG-1101/ENG-1102)
  - `<div data-testid="v2-qa-banner" role="banner" aria-label="ShadowG TaskBoard v2 QA surface (ENG-1100–ENG-1106)" aria-describedby="v2-qa-description">`
  - Label text: `<span data-testid="v2-qa-label">ENG-1100–ENG-1106 · v2 UI QA surface</span>`
  - Beta pill: `<span data-testid="v2-beta-pill">Beta</span>` (always visible, mobile+desktop)
  - Back link: `<Link data-testid="v2-back-to-main-link" href="/">Back to main board</Link>`
  - Mobile helper copy: `<span data-testid="v2-mobile-helper">This is the v2 QA surface…</span>` (mobile-only)
  - SR-only description: `<span id="v2-qa-description" className="sr-only">…</span>`
- Main board region (ENG-1101/ENG-1102/ENG-1103)
  - `<div id="v2-board-main" data-testid="v2-board-region" role="main" aria-label="ShadowG TaskBoard v2 board" tabIndex={-1}>`

## Intended QA checks

- `/v2` renders with all of the following present:
  - `v2-root`, `v2-qa-banner`, `v2-qa-label`, `v2-beta-pill`, `v2-back-to-main-link`, `v2-mobile-helper`, `v2-board-region`, `v2-skip-to-board-link`.
- Skip link behavior:
  - When the skip link receives keyboard focus and is activated, focus moves to `#v2-board-main` and the main region is visible.
- A11y wiring:
  - `v2-qa-banner` uses `aria-describedby="v2-qa-description"`.
  - `v2-board-region` exposes `role="main"`, `aria-label`, and `tabIndex={-1}`.

These hooks are intentionally v2-only and should be kept stable while ENG-1100–ENG-1106 are active, so test suites can rely on them without flakiness.