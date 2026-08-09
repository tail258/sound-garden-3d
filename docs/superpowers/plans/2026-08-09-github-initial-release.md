# Sound Garden 3D GitHub Initial Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the complete local project to `tail258/sound-garden-3d` with a polished Chinese-first README, an English summary, real screenshots, and an MIT license.

**Architecture:** This release does not change product behavior. It aligns package and repository identity, adds documentation-only visual assets, validates the existing application, and creates the empty remote repository's first `main` commit.

**Tech Stack:** Markdown, React 19, TypeScript 6, Three.js / React Three Fiber, Vite 8, Vitest, Playwright, Git, GitHub CLI

## Global Constraints

- Keep the README Chinese-first with a concise English introduction.
- Use only the three screenshots supplied by the user; do not fabricate product visuals or claims.
- Preserve the existing dark-green laboratory visual identity.
- Do not add dependencies or change application behavior.
- Use the standard MIT license with `Copyright (c) 2026 tail258`.
- Publish directly to `main` because the GitHub repository is empty; do not create a pull request.
- Keep `node_modules`, `dist`, Playwright reports, test results, and logs excluded by `.gitignore`.

---

## File Map

- Create `LICENSE`: standard MIT license text.
- Create `docs/assets/sound-garden-tree.png`: tree morphology screenshot.
- Create `docs/assets/sound-garden-rosette.png`: rosette morphology hero screenshot.
- Create `docs/assets/sound-garden-colony.png`: colony morphology screenshot.
- Modify `README.md`: repository landing page and usage documentation.
- Modify `package.json`: change only the package name from `dark-song-01` to `sound-garden-3d`.
- Keep `docs/superpowers/specs/2026-08-09-github-release-readme-design.md` and this plan as release decision records.

### Task 1: Align the public project identity and documentation assets

**Files:**
- Create: `LICENSE`
- Create: `docs/assets/sound-garden-tree.png`
- Create: `docs/assets/sound-garden-rosette.png`
- Create: `docs/assets/sound-garden-colony.png`
- Modify: `README.md`
- Modify: `package.json`

**Interfaces:**
- Consumes: screenshots at `D:/画廊/黑客松/3/屏幕截图 2026-08-09 185336.png`, `D:/画廊/黑客松/3/屏幕截图 2026-08-09 190221.png`, and `D:/画廊/黑客松/3/屏幕截图 2026-08-09 190328.png`.
- Produces: a GitHub-renderable README whose image references resolve to `docs/assets/*.png`, plus a repository-recognizable MIT license.

- [x] **Step 1: Copy the three supplied screenshots without modifying their source files**

Run:

```powershell
New-Item -ItemType Directory -Force docs/assets
Copy-Item -LiteralPath 'D:/画廊/黑客松/3/屏幕截图 2026-08-09 185336.png' -Destination 'docs/assets/sound-garden-tree.png'
Copy-Item -LiteralPath 'D:/画廊/黑客松/3/屏幕截图 2026-08-09 190221.png' -Destination 'docs/assets/sound-garden-rosette.png'
Copy-Item -LiteralPath 'D:/画廊/黑客松/3/屏幕截图 2026-08-09 190328.png' -Destination 'docs/assets/sound-garden-colony.png'
```

Expected: all three destination files exist and retain the exact byte lengths `408431`, `486831`, and `504228`.

- [x] **Step 2: Add the standard MIT license**

Create `LICENSE` with the canonical MIT grant and disclaimer, headed by:

```text
MIT License

Copyright (c) 2026 tail258
```

Expected: GitHub's license endpoint identifies the repository license as MIT after push.

- [x] **Step 3: Align the package identity**

Change only this field in `package.json`:

```json
"name": "sound-garden-3d"
```

Expected: `node -p "require('./package.json').name"` prints `sound-garden-3d`.

- [x] **Step 4: Replace the README with the approved public landing page**

Use this exact content order:

1. Centered `public/favicon.svg`, `声音植物园`, `声音驱动的 3D 表型实验台`, and an English one-line summary.
2. Honest badges for MIT, React 19, TypeScript 6, Three.js r185, and Vite 8.
3. `docs/assets/sound-garden-rosette.png` as the hero image.
4. Chinese project positioning and local-only audio privacy statement.
5. Mermaid flow from local audio through Web Audio, Worker features, mapping, genotype, blueprint, and Three.js rendering.
6. Four core capabilities: local audio, Worker analysis, explainable mapping, and deterministic continuous growth.
7. A three-column gallery using all three screenshot files.
8. A trait table for 高度, 粗壮度, 扩张度, 结构复杂度.
9. Quick start commands using `pnpm install` and `pnpm dev`.
10. Command table for `dev`, `check`, `test:e2e`, `build`, and `preview`.
11. Technology stack and a concise project tree.
12. Known limitations: approximately 1.19 MB first-load JavaScript, unverified real-device mobile performance/touch/WebGL memory, and local experimental-stage scope.
13. Link to `LICENSE`.

Expected: the README makes no online demo, CI, mobile-performance, or cloud-processing claims and contains no em dash characters.

- [x] **Step 5: Check documentation integrity**

Run:

```powershell
@('docs/assets/sound-garden-tree.png','docs/assets/sound-garden-rosette.png','docs/assets/sound-garden-colony.png','public/favicon.svg','LICENSE') | ForEach-Object { if (-not (Test-Path -LiteralPath $_)) { throw "Missing: $_" } }
rg -n "TBD|TODO|placeholder|—|–" README.md LICENSE
```

Expected: every path exists and `rg` returns no matches.

### Task 2: Verify the release candidate

**Files:**
- Test: all source and unit test files exercised by `pnpm check`
- Inspect: `README.md`, `LICENSE`, `.gitignore`, `docs/assets/*.png`

**Interfaces:**
- Consumes: the complete release candidate from Task 1.
- Produces: fresh lint, typecheck, unit-test, and production-build evidence suitable for the initial commit.

- [x] **Step 1: Run the complete project check**

Run:

```powershell
pnpm check
```

Expected: oxlint succeeds, TypeScript succeeds, all Vitest tests pass, and Vite produces a successful production build. The known bundle-size warning is informational and accepted for this release.

- [x] **Step 2: Review all publishable files and exclusions**

Run:

```powershell
git status --short
git ls-files --others --exclude-standard
git check-ignore node_modules dist playwright-report test-results
```

Expected: project source, tests, documentation, and three screenshots are publishable; generated output and dependencies remain ignored; no `.env` or secret-bearing file is included.

### Task 3: Create and publish the initial Git history

**Files:**
- Stage: every non-ignored project file from the reviewed Task 2 scope.
- Create Git metadata: local `main`, `origin`, initial commit, and upstream tracking branch.

**Interfaces:**
- Consumes: an empty GitHub repository at `https://github.com/tail258/sound-garden-3d.git` and an authenticated GitHub CLI session for `tail258`.
- Produces: public branch `main` containing the verified initial release.

- [x] **Step 1: Configure the empty remote and normalize the branch name**

Run:

```powershell
git remote add origin https://github.com/tail258/sound-garden-3d.git
git branch -M main
git remote -v
git status --short --branch
```

Expected: `origin` points to the requested repository and the local branch is `main` with no commits.

- [x] **Step 2: Stage and inspect the complete initial release**

Run:

```powershell
git add -A
git diff --cached --check
git diff --cached --stat
git status --short --branch
```

Expected: no whitespace errors; staged files match the reviewed project scope; ignored directories are absent.

- [x] **Step 3: Create the initial commit**

Run:

```powershell
git commit -m "Initial release of Sound Garden 3D"
```

Expected: Git creates one root commit containing the entire release candidate.

- [x] **Step 4: Push the initial main branch**

Run:

```powershell
git push -u origin main
```

Expected: the remote accepts `main` and the local branch tracks `origin/main`.

- [x] **Step 5: Verify GitHub's rendered repository state**

Run:

```powershell
gh repo view tail258/sound-garden-3d --json url,description,defaultBranchRef,licenseInfo
gh api repos/tail258/sound-garden-3d/commits/main --jq '.sha + " " + .commit.message'
gh api repos/tail258/sound-garden-3d/readme --jq '.html_url'
gh api repos/tail258/sound-garden-3d/license --jq '.license.spdx_id'
```

Expected: URL is `https://github.com/tail258/sound-garden-3d`, default branch is `main`, the latest message is `Initial release of Sound Garden 3D`, README resolves, and license SPDX ID is `MIT`.
