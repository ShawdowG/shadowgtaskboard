# ENG-1103 – /v2 skip link behavior

Goal: ensure the `/v2` skip link provides a reliable, testable keyboard path directly to the main v2 board region.

## Current implementation
- Skip link element:
  - `data-testid="v2-skip-to-board-link"`
  - `href="#v2-board-main"`
- Target region:
  - `id="v2-board-main"`
  - `data-testid="v2-board-region"`
  - `role="main"`
  - `tabIndex={-1}`

## Expected behavior
- When a keyboard user tabs into `/v2`, the skip link becomes focusable.
- Activating the skip link (Enter/Space) should:
  - Move focus to the element with `id="v2-board-main"`.
  - Ensure that element is visible and acts as the single `role="main"` landmark.

## Test ideas
- Keyboard-only E2E:
  - Load `/v2`.
  - Press `Tab` until `v2-skip-to-board-link` is focused.
  - Activate the link.
  - Assert `document.activeElement` corresponds to `v2-board-region`.
  - Assert `v2-board-region` has `role="main"`, `tabIndex=-1`, and the expected `aria-label`.

Keep this in sync with `docs/ENG-1100-1103-v2-qa-hooks.md` and the ENG-1104 smoke checklist as the v2 shell evolves.
