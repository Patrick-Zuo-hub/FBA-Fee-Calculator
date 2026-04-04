const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "fba-fee-data.js"), "utf8");
const context = {
  window: {},
  globalThis: {}
};

context.globalThis = context;
context.window = context;

vm.runInNewContext(source, context);

module.exports = context.FBA_FEE_DATA;
