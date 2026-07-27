import { CSS_PATH } from "../core/constants.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-05:index:css-loader";
function loadCSS() {
  if (document.querySelector('link[href*="panel-05"]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = CSS_PATH;
  link.setAttribute("data-panel", "panel-05");
  document.head.appendChild(link);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    moduleId: MODULE_ID,
    version: VERSION,
    checks: { cssLoaderReady: true },
    timestamp: Date.now()
  };
}
var css_loader_default = { loadCSS, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  css_loader_default as default,
  healthCheck,
  info,
  loadCSS
};
