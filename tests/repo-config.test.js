const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

test("repo config supports Vercel builds from source", () => {
  const packageJson = readJson("package.json");
  const vercelJson = readJson("vercel.json");
  const gitignore = fs.readFileSync(path.join(root, ".gitignore"), "utf8");

  assert.equal(packageJson.private, true);
  assert.equal(packageJson.scripts.build, "node scripts/build-deploy-site.js");
  assert.ok(packageJson.scripts.test);

  assert.equal(vercelJson.buildCommand, "npm run build");
  assert.equal(vercelJson.outputDirectory, "dist");

  assert.match(gitignore, /^dist\/$/m);
  assert.match(gitignore, /^\.vercel\/$/m);
  assert.match(gitignore, /^node_modules\/$/m);
  assert.match(gitignore, /^\.DS_Store$/m);
});
