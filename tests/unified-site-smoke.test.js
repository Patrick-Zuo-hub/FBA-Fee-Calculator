const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function readPage(route) {
  return fs.readFileSync(path.resolve(__dirname, "..", route, "index.html"), "utf8");
}

const naPage = readPage("na");

test("NA route uses the shared shell", () => {
  assert.match(naPage, /Marketplace Fee Studio/);
  assert.match(naPage, /Amazon NA/);
  assert.match(naPage, /<body[^>]*data-route="na">/);
  assert.match(naPage, /<link rel="stylesheet" href="\/assets\/site\.css" \/>/);
  assert.match(naPage, /<script defer src="\/assets\/site\.js"><\/script>/);
  assert.match(naPage, /<iframe[^>]*src="\/History\/fba-us-local-fee-calculator\.html"/);
  assert.match(naPage, /<iframe[^>]*title="Amazon NA FBA Fee Calculator"/);
});

const euUkPage = readPage("eu-uk");
const walmartPage = readPage("walmart");

test("EU & UK route uses the shared shell", () => {
  assert.match(euUkPage, /Marketplace Fee Studio/);
  assert.match(euUkPage, /Amazon EU & UK/);
  assert.match(euUkPage, /<body[^>]*data-route="eu-uk">/);
  assert.match(euUkPage, /<link rel="stylesheet" href="\/assets\/site\.css" \/>/);
  assert.match(euUkPage, /<script defer src="\/assets\/site\.js"><\/script>/);
  assert.match(euUkPage, /2026-04-03/);
  assert.match(euUkPage, /<iframe[^>]*src="\/History\/fba-eu-uk-fee-calculator\.html"/);
  assert.match(euUkPage, /<iframe[^>]*title="Amazon EU & UK FBA Fee Calculator"/);
});

test("Walmart route uses the shared shell", () => {
  assert.match(walmartPage, /Marketplace Fee Studio/);
  assert.match(walmartPage, /Walmart WFS/);
  assert.match(walmartPage, /<body[^>]*data-route="walmart">/);
  assert.match(walmartPage, /<link rel="stylesheet" href="\/assets\/site\.css" \/>/);
  assert.match(walmartPage, /<script defer src="\/assets\/site\.js"><\/script>/);
  assert.match(walmartPage, /2026-03-25/);
  assert.match(walmartPage, /<iframe[^>]*src="\/History\/walmart-wfs-fee-calculator\.html"/);
  assert.match(walmartPage, /<iframe[^>]*title="Walmart WFS Fee Calculator"/);
});
