const VERSION = "4.3.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell-dom-regions";
const ENTERPRISE_STRICT = true;
const REGION_MAP = Object.freeze({
  preloader: { id: "shell-preloader-region", legacyId: "preloader-root", ariaLabel: "Loading indicator" },
  login: { id: "shell-login-region", legacyId: "login-container", ariaLabel: "Login form" },
  header: { id: "shell-header-region", legacyId: "header-container", ariaLabel: "Application header" },
  ticker: { id: "shell-ticker-region", legacyId: "ticker-container", ariaLabel: "Information ticker" },
  "nav-rail": { id: "shell-nav-rail-region", legacyId: "nav-rail-container", ariaLabel: "Navigation rail" },
  sidebar: { id: "shell-sidebar-region", legacyId: "sidebar-root", ariaLabel: "Sidebar navigation" },
  main: { id: "shell-main-region", legacyId: "app-container", ariaLabel: "Main content", ariaLive: "polite" },
  footer: { id: "shell-footer-region", legacyId: "footer-root", ariaLabel: "Application footer" },
  toast: { id: "shell-toast-region", legacyId: "toast-container", ariaLabel: "Notifications", ariaLive: "assertive" }
});
function _buildRegionIds() {
  const result = {};
  const keys = Object.keys(REGION_MAP);
  for (let i = 0; i < keys.length; i++) {
    result[keys[i]] = REGION_MAP[keys[i]].id;
  }
  return Object.freeze(result);
}
const REGION_IDS = _buildRegionIds();
export {
  ENTERPRISE_STRICT,
  MODULE_ID,
  REGION_IDS,
  REGION_MAP,
  VERSION
};
