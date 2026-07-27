const VERSION = "2.2.0-P2-ENTERPRISE";
const MODULE_ID = "components.accordion.ui.visibility";
function isSectionVisible(section) {
  if (section.visible === false) return false;
  if (section.visibilityPolicy?.mode === "hide") return false;
  return true;
}
function isSectionDisabled(section) {
  if (section.visibilityPolicy?.mode === "disable") return true;
  return false;
}
function isItemVisible(item) {
  if (item.visible === false) return false;
  if (item.visibilityPolicy?.mode === "hide") return false;
  return true;
}
function isItemDisabled(item) {
  if (item.visibilityPolicy?.mode === "disable") return true;
  return false;
}
function escapeHTML(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
function healthCheck() {
  const checks = {
    isSectionVisibleAvailable: typeof isSectionVisible === "function",
    isSectionDisabledAvailable: typeof isSectionDisabled === "function",
    isItemVisibleAvailable: typeof isItemVisible === "function",
    isItemDisabledAvailable: typeof isItemDisabled === "function",
    escapeHTMLAvailable: typeof escapeHTML === "function"
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : "DEGRADED",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    functions: ["isSectionVisible", "isSectionDisabled", "isItemVisible", "isItemDisabled", "escapeHTML"],
    healthCheck: healthCheck(),
    timestamp: Date.now()
  };
}
var visibility_default = {
  isSectionVisible,
  isSectionDisabled,
  isItemVisible,
  isItemDisabled,
  escapeHTML,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  visibility_default as default,
  escapeHTML,
  healthCheck,
  info,
  isItemDisabled,
  isItemVisible,
  isSectionDisabled,
  isSectionVisible
};
