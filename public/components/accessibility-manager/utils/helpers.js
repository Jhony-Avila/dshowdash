const VERSION = "2.1.0-P2-ENTERPRISE";
const MODULE_ID = "components.accessibility-manager.utils.helpers";
const VALID_FLAGS = [
  "highContrast",
  "reducedMotion",
  "largeText",
  "screenReaderOptimized",
  "keyboardNavigation",
  "focusIndicators"
];
const VALID_COLOR_BLIND_MODES = [
  "none",
  "protanopia",
  "deuteranopia",
  "tritanopia",
  "achromatopsia"
];
function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}
function prefersHighContrast() {
  return window.matchMedia?.("(prefers-contrast: high)").matches ?? false;
}
function detectSystemPreferences() {
  return {
    reducedMotion: prefersReducedMotion(),
    highContrast: prefersHighContrast(),
    darkMode: window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false
  };
}
function announce(message, priority = "polite") {
  const el = document.createElement("div");
  el.setAttribute("aria-live", priority);
  el.setAttribute("aria-atomic", "true");
  el.className = "sr-only";
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1e3);
}
function getVersion() {
  return VERSION;
}
function healthCheck() {
  const checks = {
    available: true,
    mediaQuerySupport: typeof window !== "undefined" && !!window.matchMedia
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
    helpers: ["prefersReducedMotion", "prefersHighContrast", "announce", "detectSystemPreferences"],
    validFlags: VALID_FLAGS,
    validColorBlindModes: VALID_COLOR_BLIND_MODES,
    timestamp: Date.now()
  };
}
var helpers_default = {
  prefersReducedMotion,
  prefersHighContrast,
  detectSystemPreferences,
  announce,
  VALID_FLAGS,
  VALID_COLOR_BLIND_MODES,
  healthCheck,
  info,
  getVersion,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VALID_COLOR_BLIND_MODES,
  VALID_FLAGS,
  VERSION,
  announce,
  helpers_default as default,
  detectSystemPreferences,
  getVersion,
  healthCheck,
  info,
  prefersHighContrast,
  prefersReducedMotion
};
