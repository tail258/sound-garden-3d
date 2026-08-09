# Page Title and Favicon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the development page title and Vite favicon with formal Sound Garden metadata and a small brand-specific SVG icon.

**Architecture:** Keep metadata in the existing root `index.html` and the icon in `public/favicon.svg`. The existing Playwright smoke test verifies the metadata as rendered by a real browser, without adding runtime code or source-text tests.

**Tech Stack:** HTML, SVG, Vite 8, Playwright 1.62.

## Global Constraints

- Title must be exactly `声音植物园｜声音驱动的 3D 表型实验台`.
- Root document language must be `zh-CN`.
- Favicon must remain a standalone SVG with no text, external assets, fonts, filters, or runtime dependencies.
- Do not modify React UI, routing, build configuration, or package dependencies.
- Do not create a Git commit.

---

### Task 1: Formal page metadata and branded favicon

**Files:**
- Modify: `tests/e2e/smoke.spec.ts`
- Modify: `index.html`
- Modify: `public/favicon.svg`

**Interfaces:**
- Consumes: the existing Vite development server and Playwright browser page.
- Produces: browser title, Chinese document language, description metadata, and the `/favicon.svg` icon link.

- [x] **Step 1: Write the failing metadata test**

```ts
test('loads the phenotype sandbox shell', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('声音植物园｜声音驱动的 3D 表型实验台')
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /声音/)
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/favicon.svg')
  await expect(page.getByRole('heading', { name: '声音植物园' })).toBeVisible()
})
```

- [x] **Step 2: Run the focused test and verify RED**

Run: `pnpm exec playwright test tests/e2e/smoke.spec.ts --project=chromium -g "loads the phenotype sandbox shell"`

Expected: fail because the current language is `en`, title is `dark-song-01`, and description is absent.

- [x] **Step 3: Implement the minimal metadata and SVG changes**

Set `lang="zh-CN"`, add the exact title and a concise description. Replace `public/favicon.svg` with a 64 × 64 deep-green rounded background, two mint orbit ellipses, a central seed, and three mint nodes; include `role="img"` and `aria-label="声音植物园"`.

- [x] **Step 4: Run focused and full verification**

Run: `pnpm exec playwright test tests/e2e/smoke.spec.ts --project=chromium -g "loads the phenotype sandbox shell"`

Expected: 1 targeted Chromium test passes.

Run: `pnpm check`

Expected: lint, typecheck, all Vitest tests, and production build pass.

- [x] **Step 5: Browser smoke check**

Open the local Vite app and verify the page title equals the exact formal title, `/favicon.svg` loads successfully, meaningful app content renders, and no new console error appears.
