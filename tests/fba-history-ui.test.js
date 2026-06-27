const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("shared history helper renders the drawer shell", () => {
  const helper = read("History/fba-history.js");
  assert.match(helper, /历史记录/);
  assert.match(helper, /最近 20 条，仅保存成功的 FBA 测算/);
  assert.match(helper, /清空全部/);
  assert.match(helper, /未命名记录/);
});

test("all calculator pages load the shared history helper script", () => {
  [
    "History/fba-us-local-fee-calculator.html",
    "History/fba-eu-uk-fee-calculator.html",
    "History/walmart-wfs-fee-calculator.html"
  ].forEach((file) => {
    assert.match(read(file), /fba-history\.js/);
  });
});

test("all pages place the primary calculate action before optional conditions", () => {
  [
    ["History/fba-us-local-fee-calculator.html", "计算北美 FBA 费用", "附加条件"],
    ["History/fba-eu-uk-fee-calculator.html", "计算 FBA 费用", "30 天 Days of Supply"],
    ["History/walmart-wfs-fee-calculator.html", "计算 WFS 费用", "Storage 计费窗口"]
  ].forEach(([file, buttonText, optionalText]) => {
    const html = read(file);
    const buttonIndex = html.indexOf(buttonText);
    const optionalIndex = html.indexOf(optionalText);
    assert.ok(buttonIndex !== -1 && optionalIndex !== -1 && buttonIndex < optionalIndex, file);
  });
});

test("calculator pages use independent local history keys", () => {
  assert.match(read("History/fba-us-local-fee-calculator.js"), /fba-history-na/);
  assert.match(read("History/fba-eu-uk-fee-calculator.html"), /fba-history-eu-uk/);
  assert.match(read("History/walmart-wfs-fee-calculator.js"), /fba-history-walmart/);
});
