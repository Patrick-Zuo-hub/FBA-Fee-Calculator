const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const distRoot = path.join(root, "dist");
const historyRoot = path.join(root, "History");
const embeddedRoot = path.join(distRoot, "embedded");

const siteEntries = [
  "index.html",
  "na",
  "eu-uk",
  "walmart",
  "changelog",
  "assets",
  "data"
];

const embeddedFiles = [
  "fba-us-local-fee-calculator.html",
  "fba-us-local-fee-calculator.js",
  "fba-eu-uk-fee-calculator.html",
  "fba-fee-data.js",
  "fba-surcharge-rules.js",
  "walmart-wfs-fee-calculator.html",
  "walmart-wfs-fee-calculator.js"
];

const routeEmbedMap = {
  "na/index.html": {
    from: "/History/fba-us-local-fee-calculator.html",
    to: "/embedded/fba-us-local-fee-calculator.html"
  },
  "eu-uk/index.html": {
    from: "/History/fba-eu-uk-fee-calculator.html",
    to: "/embedded/fba-eu-uk-fee-calculator.html"
  },
  "walmart/index.html": {
    from: "/History/walmart-wfs-fee-calculator.html",
    to: "/embedded/walmart-wfs-fee-calculator.html"
  }
};

function copySiteEntry(entry) {
  fs.cpSync(path.join(root, entry), path.join(distRoot, entry), { recursive: true });
}

function copyEmbeddedFiles() {
  fs.mkdirSync(embeddedRoot, { recursive: true });
  embeddedFiles.forEach((filename) => {
    fs.copyFileSync(path.join(historyRoot, filename), path.join(embeddedRoot, filename));
  });
}

function rewriteRouteEmbeds() {
  Object.entries(routeEmbedMap).forEach(([relativePath, replacement]) => {
    const filePath = path.join(distRoot, relativePath);
    const source = fs.readFileSync(filePath, "utf8");
    fs.writeFileSync(filePath, source.replaceAll(replacement.from, replacement.to));
  });
}

function buildDeploySite() {
  fs.rmSync(distRoot, { recursive: true, force: true });
  fs.mkdirSync(distRoot, { recursive: true });

  siteEntries.forEach(copySiteEntry);
  copyEmbeddedFiles();
  rewriteRouteEmbeds();
}

buildDeploySite();
