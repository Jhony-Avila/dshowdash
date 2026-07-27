const VERSION = "4.3.0-A11Y-SKIP-LINKS";
const MODULE_ID = "app-shell-template";
const REGIONS_CONFIG = Object.freeze({
  "skip-links": { tag: "nav", role: "navigation", ariaLabel: "Skip links", layoutClass: null },
  "preloader": { tag: "div", role: "status", ariaLabel: "Loading", ariaLive: "polite", layoutClass: "dsd-shell__region--preloader" },
  "login": { tag: "main", role: "main", ariaLabel: "Login", uarpsRegion: "auth", layoutClass: "dsd-shell__region--login" },
  "toast": { tag: "div", role: "status", ariaLabel: "Notifications", ariaLive: "polite", layoutClass: "dsd-shell__region--toast" },
  "header": { tag: "header", role: "banner", ariaLabel: "Header", uarpsRegion: "header", layoutClass: "dsd-shell__region--header" },
  "ticker": { tag: "div", role: "marquee", ariaLabel: "News ticker", ariaLive: "off", layoutClass: "dsd-shell__region--ticker" },
  "nav-rail": { tag: "nav", role: "navigation", ariaLabel: "Main navigation", uarpsRegion: "navigation", layoutClass: "dsd-shell__region--nav-rail" },
  "sidebar": { tag: "aside", role: "complementary", ariaLabel: "Sidebar", uarpsRegion: "sidebar", layoutClass: "dsd-shell__region--sidebar" },
  "main": { tag: "main", role: "main", ariaLabel: "Main content", uarpsRegion: "main", layoutClass: "dsd-shell__region--main" },
  "footer": { tag: "footer", role: "contentinfo", ariaLabel: "Footer", uarpsRegion: "footer", layoutClass: "dsd-shell__region--footer" }
});
let _savedFocus = null;
function createBaseShell() {
  const shell = document.createElement("div");
  shell.id = "app-shell";
  shell.setAttribute("role", "application");
  shell.setAttribute("aria-label", "Application Shell");
  return shell;
}
function createRegions(shell) {
  _createSkipLinks(shell);
  const regionNames = Object.keys(REGIONS_CONFIG);
  for (let i = 0; i < regionNames.length; i++) {
    const name = regionNames[i];
    if (name === "skip-links") continue;
    const config = REGIONS_CONFIG[name];
    const region = document.createElement(config.tag);
    region.id = name;
    region.setAttribute("data-region", name);
    if (config.layoutClass) {
      region.className = config.layoutClass;
    }
    if (config.role) {
      region.setAttribute("role", config.role);
    }
    if (config.ariaLabel) {
      region.setAttribute("aria-label", config.ariaLabel);
    }
    if (config.ariaLive) {
      region.setAttribute("aria-live", config.ariaLive);
    }
    if (config.uarpsRegion) {
      region.setAttribute("data-uarps-region", config.uarpsRegion);
    }
    shell.appendChild(region);
  }
}
function _createSkipLinks(shell) {
  const skipNav = document.createElement("nav");
  skipNav.id = "skip-links";
  skipNav.className = "sr-only";
  skipNav.setAttribute("role", "navigation");
  skipNav.setAttribute("aria-label", "Skip links");
  const links = [
    { href: "#main", text: "Skip to main content" },
    { href: "#nav-rail", text: "Skip to navigation" },
    { href: "#sidebar", text: "Skip to sidebar" }
  ];
  for (let i = 0; i < links.length; i++) {
    const link = document.createElement("a");
    link.href = links[i].href;
    link.className = "a11y-skip-link";
    link.textContent = links[i].text;
    skipNav.appendChild(link);
  }
  shell.insertBefore(skipNav, shell.firstChild);
}
function saveFocus() {
  _savedFocus = document.activeElement;
}
function restoreFocus() {
  if (_savedFocus && typeof _savedFocus.focus === "function") {
    try {
      _savedFocus.focus();
      return true;
    } catch (e) {
      return false;
    }
  }
  return false;
}
function focusMain() {
  const main = document.getElementById("main") || document.querySelector('[data-region="main"]');
  if (main) {
    main.setAttribute("tabindex", "-1");
    main.focus();
    return true;
  }
  return false;
}
function focusRegion(regionId) {
  const region = document.getElementById(regionId) || document.querySelector('[data-region="' + regionId + '"]');
  if (region) {
    region.setAttribute("tabindex", "-1");
    region.focus();
    return true;
  }
  return false;
}
function announce(message, priority) {
  priority = priority || "polite";
  let announcer = document.getElementById("app-shell-announcer");
  if (!announcer) {
    announcer = document.createElement("div");
    announcer.id = "app-shell-announcer";
    announcer.setAttribute("role", "status");
    announcer.setAttribute("aria-live", priority);
    announcer.setAttribute("aria-atomic", "true");
    announcer.className = "sr-only";
    announcer.style.cssText = "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;";
    document.body.appendChild(announcer);
  }
  announcer.setAttribute("aria-live", priority);
  announcer.textContent = "";
  setTimeout(function() {
    announcer.textContent = message;
  }, 100);
}
var template_default = {
  VERSION,
  MODULE_ID,
  REGIONS_CONFIG,
  createBaseShell,
  createRegions,
  saveFocus,
  restoreFocus,
  focusMain,
  focusRegion,
  announce
};
export {
  MODULE_ID,
  REGIONS_CONFIG,
  VERSION,
  announce,
  createBaseShell,
  createRegions,
  template_default as default,
  focusMain,
  focusRegion,
  restoreFocus,
  saveFocus
};
