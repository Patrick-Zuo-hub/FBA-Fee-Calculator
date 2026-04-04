const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function parseVersions() {
  return JSON.parse(fs.readFileSync(path.join(root, "data", "versions.json"), "utf8"));
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("deployable site scaffold exists", () => {
  const homepage = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.match(homepage, /assets\/site\.css/);

  [
    path.join(root, "na", "index.html"),
    path.join(root, "eu-uk", "index.html"),
    path.join(root, "walmart", "index.html"),
    path.join(root, "changelog", "index.html")
  ].forEach((filePath) => assert.ok(fs.existsSync(filePath), `${filePath} should exist`));

  const versions = parseVersions();
  assert.ok(versions.na);
  assert.ok(versions["eu-uk"]);
  assert.ok(versions.walmart);
});

test("shared CSS includes mobile layout support", () => {
  const css = fs.readFileSync(path.join(root, "assets", "site.css"), "utf8");
  assert.match(css, /@media \(max-width: 960px\)/);
  assert.match(css, /@media \(max-width: 720px\)/);
  assert.match(css, /\.tool-embed/);
  assert.match(css, /\.tool-grid/);
  assert.match(css, /\.page-header\[id\] \{\s*scroll-margin-top: 108px;/);
});

test("route pages keep the embedded calculator shell", () => {
  [
    path.join(root, "na", "index.html"),
    path.join(root, "eu-uk", "index.html"),
    path.join(root, "walmart", "index.html")
  ].forEach((filePath) => {
    const html = fs.readFileSync(filePath, "utf8");
    assert.match(html, /class="tool-embed"/);
  });
});

test("homepage keeps the stacked tool grid contract", () => {
  const homepage = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const css = fs.readFileSync(path.join(root, "assets", "site.css"), "utf8");
  assert.match(homepage, /class="tool-grid"/);
  assert.match(css, /@media \(max-width: 960px\)[\s\S]*\.tool-grid \{\s*grid-template-columns: 1fr;/);
  assert.match(css, /@media \(max-width: 720px\)[\s\S]*\.nav-links \{\s*gap: 12px;[\s\S]*flex-wrap: wrap;/);
  assert.match(css, /@media \(max-width: 720px\)[\s\S]*\.tool-embed \{\s*min-height: 1320px;[\s\S]*height: 1320px;/);
  assert.match(css, /@media \(max-width: 720px\)[\s\S]*\.site-shell \{\s*padding: 16px;/);
});

test("homepage and changelog contain live product content", () => {
  const versions = parseVersions();
  const homepage = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.match(homepage, /One polished entrance for every marketplace fee decision\./);
  assert.match(homepage, /Internal fee tools for Amazon NA, Amazon EU & UK, and Walmart WFS, rebuilt into one premium static workspace\./);
  assert.equal((homepage.match(/data-homepage-update=/g) || []).length, versions.homepageUpdates.length);
  assert.equal((homepage.match(/data-changelog-entry=/g) || []).length, 0);
  versions.homepageUpdates.forEach((update) => {
    assert.match(homepage, new RegExp(escapeRegExp(update.date)));
    assert.match(homepage, new RegExp(escapeRegExp(update.title)));
    assert.match(homepage, new RegExp(escapeRegExp(update.summary)));
  });
  assert.match(homepage, new RegExp(`<p class="eyebrow" data-version-name>${escapeRegExp(versions.na.name)}</p>`));
  assert.match(homepage, new RegExp(`<p class="eyebrow" data-version-name>${escapeRegExp(versions["eu-uk"].name)}</p>`));
  assert.match(homepage, new RegExp(`<p class="eyebrow" data-version-name>${escapeRegExp(versions.walmart.name)}</p>`));
  assert.match(homepage, /<section class="page-header" aria-labelledby="updates-heading">/);
  assert.match(homepage, /<h2 id="updates-heading">Latest platform changes<\/h2>/);
  assert.match(homepage, /data-homepage-updates/);
  assert.match(homepage, /data-version-key="na"/);
  assert.match(homepage, /data-version-key="eu-uk"/);
  assert.match(homepage, /data-version-key="walmart"/);

  const changelog = fs.readFileSync(path.join(root, "changelog", "index.html"), "utf8");
  assert.match(changelog, /Changelog/);
  assert.match(changelog, /Reverse-chronological updates for the unified fee studio\./);
  assert.equal((changelog.match(/data-changelog-entry=/g) || []).length, versions.updates.length);
  assert.equal((changelog.match(/data-homepage-update=/g) || []).length, 0);
  versions.updates.forEach((update) => {
    assert.match(changelog, new RegExp(escapeRegExp(update.date)));
    assert.match(changelog, new RegExp(escapeRegExp(update.title)));
    assert.match(changelog, new RegExp(escapeRegExp(update.summary)));
  });
  assert.match(changelog, /data-changelog-list/);
  assert.match(changelog, /data-changelog-entry="na-2026-04-03"/);
  assert.match(changelog, /data-changelog-entry="eu-uk-2026-04-03"/);
  assert.match(changelog, /data-changelog-entry="walmart-2026-03-25"/);
});
