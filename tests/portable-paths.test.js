const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const absoluteWorkspacePath = root;

function collectFiles(dir, matcher) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectFiles(absolutePath, matcher);
    return matcher(absolutePath) ? [absolutePath] : [];
  });
}

test("test helpers and suites do not hard-code the workspace path", () => {
  const checkedFiles = [
    ...collectFiles(path.join(root, "tests"), (file) => file.endsWith(".js")),
    path.join(root, "History", "fba-fee-data.test-wrapper.cjs")
  ];

  checkedFiles.forEach((file) => {
    const source = fs.readFileSync(file, "utf8");
    assert.equal(
      source.includes(absoluteWorkspacePath),
      false,
      `${path.relative(root, file)} should not contain an absolute workspace path`
    );
  });
});
