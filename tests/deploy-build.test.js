const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const distRoot = path.join(root, "dist");

function readDistFile(...segments) {
  return fs.readFileSync(path.join(distRoot, ...segments), "utf8");
}

test("deploy build creates a publishable dist without History exposure", () => {
  const result = spawnSync(process.execPath, [path.join(root, "scripts", "build-deploy-site.js")], {
    cwd: root,
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.ok(fs.existsSync(path.join(distRoot, "index.html")));
  assert.ok(fs.existsSync(path.join(distRoot, "assets", "site.css")));
  assert.ok(fs.existsSync(path.join(distRoot, "data", "versions.json")));
  assert.equal(fs.existsSync(path.join(distRoot, "History")), false);

  const naRoute = readDistFile("na", "index.html");
  const euRoute = readDistFile("eu-uk", "index.html");
  const walmartRoute = readDistFile("walmart", "index.html");

  assert.doesNotMatch(naRoute, /\/History\//);
  assert.doesNotMatch(euRoute, /\/History\//);
  assert.doesNotMatch(walmartRoute, /\/History\//);
  assert.match(naRoute, /\/embedded\/fba-us-local-fee-calculator\.html/);
  assert.match(euRoute, /\/embedded\/fba-eu-uk-fee-calculator\.html/);
  assert.match(walmartRoute, /\/embedded\/walmart-wfs-fee-calculator\.html/);

  [
    "fba-us-local-fee-calculator.html",
    "fba-us-local-fee-calculator.js",
    "fba-eu-uk-fee-calculator.html",
    "fba-fee-data.js",
    "fba-surcharge-rules.js",
    "profit-estimator.js",
    "walmart-wfs-fee-calculator.html",
    "walmart-wfs-fee-calculator.js"
  ].forEach((filename) => {
    assert.ok(fs.existsSync(path.join(distRoot, "embedded", filename)), `${filename} should be published`);
  });
});
