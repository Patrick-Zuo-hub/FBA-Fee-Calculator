async function loadVersionData() {
  const response = await fetch("/data/versions.json");
  if (!response.ok) throw new Error("Failed to load versions");
  return response.json();
}

function setSiteNavOpen(nav, toggle, open) {
  if (!nav || !toggle) return;
  nav.dataset.navOpen = open ? "true" : "false";
  toggle.setAttribute("aria-expanded", open ? "true" : "false");
}

function initSiteNav() {
  const nav = document.querySelector("[data-nav-shell]");
  const toggle = document.querySelector("[data-nav-toggle]");
  const links = document.querySelector("[data-nav-links]");

  if (!nav || !toggle || !links) return;

  setSiteNavOpen(nav, toggle, false);

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    setSiteNavOpen(nav, toggle, !isOpen);
  });

  links.addEventListener("click", (event) => {
    if (event.target?.closest?.("a")) {
      setSiteNavOpen(nav, toggle, false);
    }
  });
}

function showHydrationFallback(error) {
  document.body.dataset.siteHydration = "fallback";

  const notice = document.querySelector("[data-site-notice]");
  if (notice) {
    notice.hidden = false;
    notice.textContent = "Live updates are unavailable right now. Static content is still available.";
  }

  console.error("Failed to hydrate site from /data/versions.json", error);
}

function hydrateVersionCards(versions) {
  document.querySelectorAll("[data-version-key]").forEach((card) => {
    const key = card.getAttribute("data-version-key");
    const version = versions?.[key];
    if (!version) return;

    const name = card.querySelector("[data-version-name]");
    const status = card.querySelector("[data-version-status]");
    const coverage = card.querySelector("[data-version-coverage]");

    if (name) name.textContent = version.name;
    if (status) status.textContent = version.status;
    if (coverage) coverage.textContent = `Coverage: ${version.coverage}`;
    card.querySelector("a[href]")?.setAttribute("href", version.route);
  });
}

function createUpdateCard(update, entryKey) {
  const article = document.createElement("article");
  article.className = "info-card";
  if (entryKey) article.setAttribute(entryKey.attribute, entryKey.value);

  const date = document.createElement("p");
  date.className = "eyebrow";
  date.textContent = update.date;
  article.append(date);

  const title = document.createElement("h3");
  title.textContent = update.title;
  article.append(title);

  const summary = document.createElement("p");
  summary.className = "muted";
  summary.textContent = update.summary;
  article.append(summary);

  return article;
}

function renderUpdateList(list, updates, entryKeyPrefix) {
  if (!list || !Array.isArray(updates) || !updates.length) return;
  list.innerHTML = "";
  updates.forEach((update) => {
    const entryKey = entryKeyPrefix
      ? { attribute: entryKeyPrefix.attribute, value: `${update.module}-${update.date}` }
      : null;
    list.append(createUpdateCard(update, entryKey));
  });
}

function hydrateHomepageUpdates(versions) {
  const list = document.querySelector("[data-homepage-updates]");
  renderUpdateList(list, versions?.homepageUpdates, { attribute: "data-homepage-update" });
}

function hydrateChangelog(versions) {
  const list = document.querySelector("[data-changelog-list]");
  renderUpdateList(list, versions?.updates, { attribute: "data-changelog-entry" });
}

async function hydrateSite() {
  try {
    const versions = await loadVersionData();
    hydrateVersionCards(versions);
    hydrateHomepageUpdates(versions);
    hydrateChangelog(versions);
  } catch (error) {
    showHydrationFallback(error);
  }
}

function bootSite() {
  initSiteNav();
  hydrateSite();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootSite, { once: true });
} else {
  bootSite();
}

window.FeeStudioSite = {
  loadVersionData,
  initSiteNav,
  setSiteNavOpen,
  hydrateSite,
  hydrateVersionCards,
  hydrateHomepageUpdates,
  hydrateChangelog,
  renderUpdateList,
  createUpdateCard,
  showHydrationFallback,
  bootSite
};
