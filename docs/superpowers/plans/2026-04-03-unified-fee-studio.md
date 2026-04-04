# Unified Fee Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing three standalone calculators into one deployable static site with a premium shared shell, unified homepage, separate tool routes, and a changelog page.

**Architecture:** Keep the three calculator engines independent and migrate them behind a common static-site shell. Build shared layout assets first, then move `NA`, `EU & UK`, and `Walmart` into dedicated route folders, and finally wire a shared version-data source into the homepage and changelog. This workspace is not currently a Git repository, so commit steps are intentionally omitted from the plan.

**Tech Stack:** Static HTML, shared CSS, vanilla JavaScript, existing calculator scripts, Node.js built-in test runner, Python simple HTTP server for manual smoke tests

---

## File Structure

### Existing source files to preserve or adapt

- `/Users/patrick/Documents/FBA Fee Calculate/History/fba-us-local-fee-calculator.html`
- `/Users/patrick/Documents/FBA Fee Calculate/History/fba-us-local-fee-calculator.js`
- `/Users/patrick/Documents/FBA Fee Calculate/History/fba-eu-uk-fee-calculator.html`
- `/Users/patrick/Documents/FBA Fee Calculate/History/fba-fee-data.js`
- `/Users/patrick/Documents/FBA Fee Calculate/History/walmart-wfs-fee-calculator.html`
- `/Users/patrick/Documents/FBA Fee Calculate/History/walmart-wfs-fee-calculator.js`
- `/Users/patrick/Documents/FBA Fee Calculate/History/fba-surcharge-rules.js`

### New deployable site files

- `/Users/patrick/Documents/FBA Fee Calculate/index.html`
- `/Users/patrick/Documents/FBA Fee Calculate/na/index.html`
- `/Users/patrick/Documents/FBA Fee Calculate/eu-uk/index.html`
- `/Users/patrick/Documents/FBA Fee Calculate/walmart/index.html`
- `/Users/patrick/Documents/FBA Fee Calculate/changelog/index.html`
- `/Users/patrick/Documents/FBA Fee Calculate/assets/site.css`
- `/Users/patrick/Documents/FBA Fee Calculate/assets/site.js`
- `/Users/patrick/Documents/FBA Fee Calculate/data/versions.json`

### Test files

- `/Users/patrick/Documents/FBA Fee Calculate/tests/unified-site-shell.test.js`
- `/Users/patrick/Documents/FBA Fee Calculate/tests/unified-site-smoke.test.js`

---

### Task 1: Scaffold the deployable site structure

**Files:**
- Create: `/Users/patrick/Documents/FBA Fee Calculate/index.html`
- Create: `/Users/patrick/Documents/FBA Fee Calculate/na/index.html`
- Create: `/Users/patrick/Documents/FBA Fee Calculate/eu-uk/index.html`
- Create: `/Users/patrick/Documents/FBA Fee Calculate/walmart/index.html`
- Create: `/Users/patrick/Documents/FBA Fee Calculate/changelog/index.html`
- Create: `/Users/patrick/Documents/FBA Fee Calculate/assets/site.css`
- Create: `/Users/patrick/Documents/FBA Fee Calculate/assets/site.js`
- Create: `/Users/patrick/Documents/FBA Fee Calculate/data/versions.json`
- Test: `/Users/patrick/Documents/FBA Fee Calculate/tests/unified-site-shell.test.js`

- [ ] **Step 1: Write the failing shell test**

Create `/Users/patrick/Documents/FBA Fee Calculate/tests/unified-site-shell.test.js` with assertions that:

- `index.html` exists and links to `/assets/site.css`
- route pages for `na`, `eu-uk`, `walmart`, and `changelog` exist
- `data/versions.json` contains entries for `na`, `eu-uk`, and `walmart`

Use this test body:

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const root = "/Users/patrick/Documents/FBA Fee Calculate";

test("deployable site scaffold exists", () => {
  const homepage = fs.readFileSync(`${root}/index.html`, "utf8");
  assert.match(homepage, /assets\/site\.css/);

  [
    `${root}/na/index.html`,
    `${root}/eu-uk/index.html`,
    `${root}/walmart/index.html`,
    `${root}/changelog/index.html`
  ].forEach((path) => assert.ok(fs.existsSync(path), `${path} should exist`));

  const versions = JSON.parse(fs.readFileSync(`${root}/data/versions.json`, "utf8"));
  assert.ok(versions.na);
  assert.ok(versions["eu-uk"]);
  assert.ok(versions.walmart);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test '/Users/patrick/Documents/FBA Fee Calculate/tests/unified-site-shell.test.js'`

Expected: FAIL because the site scaffold files do not exist yet.

- [ ] **Step 3: Create the minimal shell files**

Create these exact starter files.

`/Users/patrick/Documents/FBA Fee Calculate/assets/site.css`

```css
:root {
  --bg: #f5f5f7;
  --panel: rgba(255, 255, 255, 0.78);
  --panel-strong: #ffffff;
  --line: rgba(29, 29, 31, 0.08);
  --ink: #111111;
  --muted: #6e6e73;
  --accent: #0071e3;
  --shadow: 0 24px 80px rgba(17, 17, 17, 0.08);
  --radius-xl: 32px;
  --radius-lg: 24px;
  --radius-md: 18px;
  --content-width: 1280px;
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  font-family: "SF Pro Display", "SF Pro Text", "PingFang SC", "Helvetica Neue", sans-serif;
  color: var(--ink);
  background:
    radial-gradient(circle at top, rgba(255,255,255,0.95), rgba(255,255,255,0) 30%),
    linear-gradient(180deg, #fbfbfd 0%, #f5f5f7 100%);
}
.site-shell { max-width: var(--content-width); margin: 0 auto; padding: 24px; }
.site-nav,
.hero-card,
.tool-card,
.info-card,
.page-panel {
  background: var(--panel);
  backdrop-filter: blur(18px);
  border: 1px solid rgba(255,255,255,0.7);
  box-shadow: var(--shadow);
}
.site-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 22px;
  border-radius: 999px;
  position: sticky;
  top: 18px;
  z-index: 10;
}
.nav-links { display: flex; gap: 18px; }
.nav-links a,
.brand,
.tool-link { color: inherit; text-decoration: none; }
.hero-card,
.page-panel { border-radius: var(--radius-xl); padding: 28px; }
.tool-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
.tool-card,
.info-card { border-radius: var(--radius-lg); padding: 24px; }
.eyebrow {
  display: inline-flex;
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
  background: rgba(0, 113, 227, 0.08);
}
.muted { color: var(--muted); }
.cta-row { display: flex; gap: 12px; flex-wrap: wrap; }
.primary-btn,
.secondary-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  padding: 0 18px;
  border-radius: 999px;
  text-decoration: none;
  font-weight: 600;
}
.primary-btn { background: var(--accent); color: #fff; }
.secondary-btn { background: rgba(255,255,255,0.8); color: var(--ink); border: 1px solid var(--line); }
.meta-list,
.update-list { display: grid; gap: 12px; }
.page-header { display: grid; gap: 18px; margin-top: 24px; }
.tool-embed { margin-top: 22px; border: 0; width: 100%; min-height: 1600px; border-radius: var(--radius-xl); background: #fff; }
@media (max-width: 960px) {
  .tool-grid { grid-template-columns: 1fr; }
  .site-nav { border-radius: 28px; }
}
```

`/Users/patrick/Documents/FBA Fee Calculate/assets/site.js`

```js
async function loadVersionData() {
  const response = await fetch("/data/versions.json");
  if (!response.ok) throw new Error("Failed to load versions");
  return response.json();
}

function formatUpdateDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

window.FeeStudioSite = {
  loadVersionData,
  formatUpdateDate
};
```

`/Users/patrick/Documents/FBA Fee Calculate/data/versions.json`

```json
{
  "na": {
    "name": "Amazon NA",
    "route": "/na/",
    "updatedAt": "2026-04-03",
    "status": "Fuel surcharge toggle available for US/CA",
    "coverage": "US / CA / MX"
  },
  "eu-uk": {
    "name": "Amazon EU & UK",
    "route": "/eu-uk/",
    "updatedAt": "2026-04-03",
    "status": "Fuel surcharge toggle available for eligible destinations",
    "coverage": "UK / FR / DE / IT / ES / PL / SE / NL / IE / BE"
  },
  "walmart": {
    "name": "Walmart WFS",
    "route": "/walmart/",
    "updatedAt": "2026-03-25",
    "status": "Fulfilment and storage logic active",
    "coverage": "Walmart US"
  }
}
```

Create initial scaffold HTML files with a shared shell, linked CSS, and linked JS:

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="/assets/site.css" />
  <script defer src="/assets/site.js"></script>
  <title>Marketplace Fee Studio</title>
</head>
<body>
  <main class="site-shell">
    <nav class="site-nav">
      <a class="brand" href="/">Marketplace Fee Studio</a>
      <div class="nav-links">
        <a href="/na/">NA</a>
        <a href="/eu-uk/">EU & UK</a>
        <a href="/walmart/">Walmart</a>
        <a href="/changelog/">Changelog</a>
      </div>
    </nav>
    <section class="page-header">
      <div class="hero-card">
        <span class="eyebrow">In Progress</span>
        <h1>Placeholder</h1>
        <p class="muted">This page will be filled during the next tasks in the plan.</p>
      </div>
    </section>
  </main>
</body>
</html>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test '/Users/patrick/Documents/FBA Fee Calculate/tests/unified-site-shell.test.js'`

Expected: PASS

---

### Task 2: Build the real homepage and changelog

**Files:**
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/index.html`
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/changelog/index.html`
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/assets/site.js`
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/data/versions.json`

- [ ] **Step 1: Write the failing homepage content test**

Extend `/Users/patrick/Documents/FBA Fee Calculate/tests/unified-site-shell.test.js` with assertions that:

- homepage contains tool cards for `Amazon NA`, `Amazon EU & UK`, and `Walmart WFS`
- homepage links to `/changelog/`
- changelog page contains a heading and at least one entry for the April 3, 2026 fuel surcharge update

Add this test:

```js
test("homepage and changelog contain live product content", () => {
  const homepage = fs.readFileSync(`${root}/index.html`, "utf8");
  assert.match(homepage, /Amazon NA/);
  assert.match(homepage, /Amazon EU & UK/);
  assert.match(homepage, /Walmart WFS/);
  assert.match(homepage, /\/changelog\//);

  const changelog = fs.readFileSync(`${root}/changelog/index.html`, "utf8");
  assert.match(changelog, /Changelog/);
  assert.match(changelog, /2026-04-03/);
  assert.match(changelog, /fuel surcharge/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test '/Users/patrick/Documents/FBA Fee Calculate/tests/unified-site-shell.test.js'`

Expected: FAIL because the scaffold files do not contain the real homepage and changelog content yet.

- [ ] **Step 3: Replace scaffold content with production content**

Replace `/Users/patrick/Documents/FBA Fee Calculate/index.html` with a real homepage using:

- a hero-first tool dashboard layout
- three tool cards
- a recent updates section
- a short scope/disclaimer section

The homepage must include:

```html
<h1>One polished entrance for every marketplace fee decision.</h1>
<p class="muted">Internal fee tools for Amazon NA, Amazon EU & UK, and Walmart WFS, rebuilt into one premium static workspace.</p>
```

It must also include card labels:

```html
Amazon NA
Amazon EU & UK
Walmart WFS
```

Replace `/Users/patrick/Documents/FBA Fee Calculate/changelog/index.html` with:

- a `Changelog` heading
- reverse-chronological update entries
- entries for:
  - `2026-04-03` fuel surcharge support for `NA`
  - `2026-04-03` fuel surcharge support for `EU & UK`
  - `2026-03-25` original Walmart release

Update `/Users/patrick/Documents/FBA Fee Calculate/assets/site.js` so homepage cards and update snippets can optionally render from `/data/versions.json`, but keep all server requirements at zero.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test '/Users/patrick/Documents/FBA Fee Calculate/tests/unified-site-shell.test.js'`

Expected: PASS

---

### Task 3: Migrate the NA calculator into the shared shell

**Files:**
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/na/index.html`
- Copy or reference: `/Users/patrick/Documents/FBA Fee Calculate/History/fba-us-local-fee-calculator.js`
- Copy or reference: `/Users/patrick/Documents/FBA Fee Calculate/History/fba-surcharge-rules.js`
- Test: `/Users/patrick/Documents/FBA Fee Calculate/tests/unified-site-smoke.test.js`

- [ ] **Step 1: Write the failing NA route smoke test**

Create `/Users/patrick/Documents/FBA Fee Calculate/tests/unified-site-smoke.test.js` with a route-level assertion that:

- `/na/index.html` contains a shared nav
- `/na/index.html` includes an iframe or embedded calculator container pointing at the NA calculator source
- `/na/index.html` includes version text for the latest update

Use this initial test:

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const naPage = fs.readFileSync("/Users/patrick/Documents/FBA Fee Calculate/na/index.html", "utf8");

test("NA route uses the shared shell", () => {
  assert.match(naPage, /Marketplace Fee Studio/);
  assert.match(naPage, /Amazon NA/);
  assert.match(naPage, /2026-04-03/);
  assert.match(naPage, /iframe|tool-embed/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test '/Users/patrick/Documents/FBA Fee Calculate/tests/unified-site-smoke.test.js'`

Expected: FAIL because `/na/index.html` is still scaffold content.

- [ ] **Step 3: Build the NA route**

Replace `/Users/patrick/Documents/FBA Fee Calculate/na/index.html` with:

- shared top navigation
- page title `Amazon NA`
- version ribbon with `Updated 2026-04-03`
- a short route description
- an embedded calculator region

Prefer this embed structure:

```html
<iframe
  class="tool-embed"
  src="/History/fba-us-local-fee-calculator.html"
  title="Amazon NA FBA Fee Calculator"
  loading="lazy">
</iframe>
```

Do not duplicate the NA calculator logic into the route page in this task. Use the existing calculator file as the source of truth first.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test '/Users/patrick/Documents/FBA Fee Calculate/tests/unified-site-smoke.test.js'`

Expected: PASS

---

### Task 4: Migrate the EU & UK and Walmart routes into the shared shell

**Files:**
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/eu-uk/index.html`
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/walmart/index.html`
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/tests/unified-site-smoke.test.js`

- [ ] **Step 1: Write the failing route assertions**

Extend `/Users/patrick/Documents/FBA Fee Calculate/tests/unified-site-smoke.test.js` with:

```js
test("EU & UK route uses the shared shell", () => {
  const page = fs.readFileSync("/Users/patrick/Documents/FBA Fee Calculate/eu-uk/index.html", "utf8");
  assert.match(page, /Amazon EU & UK/);
  assert.match(page, /2026-04-03/);
  assert.match(page, /History\/fba-eu-uk-fee-calculator\.html/);
});

test("Walmart route uses the shared shell", () => {
  const page = fs.readFileSync("/Users/patrick/Documents/FBA Fee Calculate/walmart/index.html", "utf8");
  assert.match(page, /Walmart WFS/);
  assert.match(page, /2026-03-25/);
  assert.match(page, /History\/walmart-wfs-fee-calculator\.html/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test '/Users/patrick/Documents/FBA Fee Calculate/tests/unified-site-smoke.test.js'`

Expected: FAIL because both route pages are still scaffold content.

- [ ] **Step 3: Build the route pages**

Replace `/Users/patrick/Documents/FBA Fee Calculate/eu-uk/index.html` and `/Users/patrick/Documents/FBA Fee Calculate/walmart/index.html` with the same shell pattern used for `NA`:

- shared nav
- route-specific title and description
- update/version panel
- embedded calculator iframe

Use these iframe sources:

```html
src="/History/fba-eu-uk-fee-calculator.html"
```

```html
src="/History/walmart-wfs-fee-calculator.html"
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test '/Users/patrick/Documents/FBA Fee Calculate/tests/unified-site-smoke.test.js'`

Expected: PASS

---

### Task 5: Improve embedded calculator presentation and mobile behavior

**Files:**
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/assets/site.css`
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/index.html`
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/na/index.html`
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/eu-uk/index.html`
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/walmart/index.html`

- [ ] **Step 1: Write the failing mobile/layout assertions**

Extend `/Users/patrick/Documents/FBA Fee Calculate/tests/unified-site-shell.test.js` to assert:

- `site.css` contains a mobile breakpoint
- route pages include the `tool-embed` class
- homepage includes a stacked tool-grid on mobile

Add:

```js
test("shared CSS includes mobile layout support", () => {
  const css = fs.readFileSync(`${root}/assets/site.css`, "utf8");
  assert.match(css, /@media \(max-width: 960px\)/);
  assert.match(css, /\.tool-embed/);
  assert.match(css, /\.tool-grid/);
});
```

- [ ] **Step 2: Run test to verify it fails if the selectors are missing**

Run: `node --test '/Users/patrick/Documents/FBA Fee Calculate/tests/unified-site-shell.test.js'`

Expected: PASS if the selectors already exist; if not, add the missing CSS now before continuing.

- [ ] **Step 3: Refine the shell styling**

Update `/Users/patrick/Documents/FBA Fee Calculate/assets/site.css` so the route pages feel intentionally premium:

- add tighter Apple-style spacing
- refine nav stickiness and card hover behavior
- give tool embeds a softer container treatment
- reduce iframe height on mobile with a safer minimum like:

```css
@media (max-width: 720px) {
  .site-shell { padding: 16px; }
  .tool-embed { min-height: 1320px; }
  .nav-links { gap: 12px; flex-wrap: wrap; }
}
```

- [ ] **Step 4: Manually verify with a static server**

Run:

```bash
python3 -m http.server 8123
```

Then open:

- `http://127.0.0.1:8123/`
- `http://127.0.0.1:8123/na/`
- `http://127.0.0.1:8123/eu-uk/`
- `http://127.0.0.1:8123/walmart/`
- `http://127.0.0.1:8123/changelog/`

Expected:

- homepage looks like a polished hub
- each route has the same shell
- embedded calculators load successfully
- mobile-width layout remains readable

---

### Task 6: Final verification

**Files:**
- Verify all files created in previous tasks

- [ ] **Step 1: Run the full automated test suite**

Run:

```bash
node --test \
  '/Users/patrick/Documents/FBA Fee Calculate/tests/unified-site-shell.test.js' \
  '/Users/patrick/Documents/FBA Fee Calculate/tests/unified-site-smoke.test.js' \
  '/Users/patrick/Documents/FBA Fee Calculate/tests/fba-surcharge-rules.test.js' \
  '/Users/patrick/Documents/FBA Fee Calculate/tests/fba-surcharge-ui.test.js' \
  '/Users/patrick/Documents/FBA Fee Calculate/tests/fba-surcharge-smoke.test.js'
```

Expected: all tests pass

- [ ] **Step 2: Run syntax verification**

Run:

```bash
node --check '/Users/patrick/Documents/FBA Fee Calculate/History/fba-us-local-fee-calculator.js'
node -e "const fs=require('fs'); const vm=require('vm'); const html=fs.readFileSync('/Users/patrick/Documents/FBA Fee Calculate/History/fba-eu-uk-fee-calculator.html','utf8'); const matches=[...html.matchAll(/<script(?:[^>]*)>([\s\S]*?)<\/script>/g)]; const inline=matches[matches.length-1][1]; new vm.Script(inline);"
```

Expected: exit code `0`

- [ ] **Step 3: Confirm release checklist**

Verify manually:

- homepage shows all three tools
- changelog shows the latest April 3, 2026 fuel surcharge update
- NA, EU & UK, and Walmart routes all render through the shared shell
- mobile-width layout remains usable
- no calculator logic was merged across modules
