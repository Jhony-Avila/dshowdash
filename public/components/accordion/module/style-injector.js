import { STYLE_PATHS } from "./constants.js";
const VERSION = "1.3.0-P2-ENTERPRISE";
const MODULE_ID = "components.accordion.module.style-injector";
let _stylesInjected = false;
async function injectStyles() {
  if (_stylesInjected) return { success: true, cached: true };
  try {
    const stylesheets = [
      STYLE_PATHS.TOKENS,
      STYLE_PATHS.MAIN
    ];
    for (const href of stylesheets) {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        document.head.appendChild(link);
      }
    }
    _stylesInjected = true;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
function isStylesInjected() {
  return _stylesInjected;
}
function resetStylesState() {
  _stylesInjected = false;
}
function healthCheck() {
  const checks = {
    injectorAvailable: true,
    stylesInjected: _stylesInjected
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed >= 1 ? "HEALTHY" : "DEGRADED",
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
    stylesInjected: _stylesInjected,
    stylePaths: STYLE_PATHS,
    healthCheck: healthCheck(),
    timestamp: Date.now()
  };
}
var style_injector_default = {
  injectStyles,
  isStylesInjected,
  resetStylesState,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  style_injector_default as default,
  healthCheck,
  info,
  injectStyles,
  isStylesInjected,
  resetStylesState
};
