# ENG-1104 – Playwright test skeleton for /v2

Use this as a starting point for wiring Playwright-based E2E checks for the `/v2` surface.

## Suggested file
- `tests/e2e/v2-smoke.spec.ts`

## Pseudo-code outline

```ts
import { test, expect } from "@playwright/test";

// Basic v2 smoke layout
// ENG-1104
export const v2TestIds = [
  "v2-root",
  "v2-qa-banner",
  "v2-qa-label",
  "v2-beta-pill",
  "v2-back-to-main-link",
  "v2-back-to-main-link-mobile",
  "v2-mobile-helper",
  "v2-qa-description",
  "v2-board-region",
  "v2-board-view",
  "v2-skip-to-board-link",
];

test("/v2 exposes v2-only QA hooks", async ({ page }) => {
  await page.goto("/v2");
  for (const id of v2TestIds) {
    await expect(page.getByTestId(id)).toBeVisible();
  }
});

test("/ does not expose v2-only QA hooks", async ({ page }) => {
  await page.goto("/");
  for (const id of v2TestIds) {
    await expect(page.getByTestId(id)).toHaveCount(0);
  }
});

// Skip link focus behavior
// ENG-1103

test("/v2 skip link moves focus to board region", async ({ page }) => {
  await page.goto("/v2");

  const skipLink = page.getByTestId("v2-skip-to-board-link");
  await skipLink.focus();
  await skipLink.press("Enter");

  const boardRegion = page.getByTestId("v2-board-region");
  await expect(boardRegion).toBeVisible();

  const activeId = await page.evaluate(() => document.activeElement?.getAttribute("data-testid"));
  expect(activeId).toBe("v2-board-region");
});
```

Keep this skeleton in sync with:
- `docs/ENG-1100-1103-v2-qa-hooks.md`
- `docs/notes/ENG-1104-v2-smoke-checklist.md`
- `docs/notes/ENG-1103-skip-link-notes.md`
