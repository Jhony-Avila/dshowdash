const VERSION = "2.1.0-P2-ENTERPRISE";
const MODULE_ID = "components.accessibility-manager.core.applier";
const A11Y_CLASSES = [
  "a11y-high-contrast",
  "a11y-reduced-motion",
  "a11y-large-text",
  "a11y-screen-reader",
  "a11y-keyboard-nav",
  "a11y-focus-indicators"
];
const _state = {
  appliedClasses: [],
  lastAppliedAt: null,
  applyCount: 0
};
function apply(settings) {
  if (typeof document === "undefined") return false;
  const root = document.documentElement;
  const appliedClasses = [];
  root.classList.toggle("a11y-high-contrast", !!settings.highContrast);
  if (settings.highContrast) appliedClasses.push("a11y-high-contrast");
  root.classList.toggle("a11y-reduced-motion", !!settings.reducedMotion);
  if (settings.reducedMotion) appliedClasses.push("a11y-reduced-motion");
  root.classList.toggle("a11y-large-text", !!settings.largeText);
  if (settings.largeText) appliedClasses.push("a11y-large-text");
  root.classList.toggle("a11y-screen-reader", !!settings.screenReaderOptimized);
  if (settings.screenReaderOptimized) appliedClasses.push("a11y-screen-reader");
  root.classList.toggle("a11y-keyboard-nav", !!settings.keyboardNavigation);
  if (settings.keyboardNavigation) appliedClasses.push("a11y-keyboard-nav");
  root.classList.toggle("a11y-focus-indicators", !!settings.focusIndicators);
  if (settings.focusIndicators) appliedClasses.push("a11y-focus-indicators");
  _state.appliedClasses = appliedClasses;
  _state.lastAppliedAt = Date.now();
  _state.applyCount++;
  return true;
}
function remove() {
  if (typeof document === "undefined") return false;
  const root = document.documentElement;
  for (const cls of A11Y_CLASSES) {
    root.classList.remove(cls);
  }
  _state.appliedClasses = [];
  return true;
}
function getAppliedClasses() {
  return [..._state.appliedClasses];
}
function getApplierState() {
  return { ..._state, appliedClasses: [..._state.appliedClasses] };
}
function getVersion() {
  return VERSION;
}
function healthCheck() {
  const checks = {
    available: true,
    domAccessible: typeof document !== "undefined"
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : "DEGRADED",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    appliedClasses: getAppliedClasses(),
    applyCount: _state.applyCount,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    appliedClasses: getAppliedClasses(),
    lastAppliedAt: _state.lastAppliedAt,
    applyCount: _state.applyCount,
    availableClasses: A11Y_CLASSES,
    timestamp: Date.now()
  };
}
var applier_default = {
  apply,
  remove,
  getAppliedClasses,
  getApplierState,
  healthCheck,
  info,
  getVersion,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  apply,
  applier_default as default,
  getAppliedClasses,
  getApplierState,
  getVersion,
  healthCheck,
  info,
  remove
};
