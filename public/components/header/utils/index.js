const VERSION = "1.1.0-ES6";
const MODULE_ID = "header/utils";
export * from "./dom.js";
import { HeaderAnnouncer } from "./header-announcer.js";
import { HeaderTooltipManager } from "./header-tooltip.js";
import { escapeHtml, sanitizeString, createElementFromHTML, resetMetrics } from "./html-helpers.js";
import { default as default2, getOverlayRoot, ensureOverlayRoot } from "./overlay-root.js";
import { TimersManager } from "./timers.js";
const modules = ["dom", "header-announcer", "header-tooltip", "html-helpers", "overlay-root", "timers"];
function info() {
  return { version: VERSION, moduleId: MODULE_ID, modules, totalModules: modules.length };
}
var utils_default = { VERSION, MODULE_ID, modules, info };
export {
  HeaderAnnouncer,
  HeaderTooltipManager as HeaderTooltip,
  MODULE_ID,
  default2 as OverlayRoot,
  TimersManager,
  VERSION,
  createElementFromHTML,
  ensureOverlayRoot as createOverlayContainer,
  utils_default as default,
  escapeHtml,
  getOverlayRoot,
  info,
  modules,
  resetMetrics,
  sanitizeString
};
