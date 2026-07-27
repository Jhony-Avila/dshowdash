import { createLogger } from "../logger.js";
import { VERSION, MODULE_ID, state } from "./state.js";
import { emitWiringEvent, setupRewireListener as _setupRewireListener, info, healthCheck } from "./diagnostics.js";
import { wireNavigation } from "./wire-navigation.js";
import { wireRefresh } from "./wire-refresh.js";
import { wireZoom } from "./wire-zoom.js";
import { wireFullscreen } from "./wire-fullscreen.js";
import { wireContent } from "./wire-content.js";
import { wireSearchExport } from "./wire-search-export.js";
import { wireAccessibility } from "./wire-accessibility.js";
import { wireSystem } from "./wire-system.js";
import { wireClipboardCapture } from "./wire-clipboard-capture.js";
const logger = createLogger(MODULE_ID);
async function wireToolbar(toolbar) {
  if (!toolbar || !toolbar.registerAction) {
    logger.warn("Toolbar inv\xE1lida ou sem registerAction");
    return { ok: false, wired: [], failed: ["toolbar-invalid"] };
  }
  const wired = [];
  const failed = [];
  await wireNavigation(toolbar, wired, failed, logger);
  await wireRefresh(toolbar, wired, failed, logger);
  await wireZoom(toolbar, wired, failed, logger);
  await wireFullscreen(toolbar, wired, failed, logger);
  await wireContent(toolbar, wired, failed, logger);
  await wireSearchExport(toolbar, wired, failed, logger);
  await wireAccessibility(toolbar, wired, failed, logger);
  await wireSystem(toolbar, wired, failed, logger);
  await wireClipboardCapture(toolbar, wired, failed, logger);
  const result = { ok: true, wired, failed, version: VERSION };
  state.lastWiringResult = result;
  state.lastWiringTimestamp = Date.now();
  logger.debug("Wiring completo", {
    wired: wired.length,
    failed: failed.length,
    buttons: wired
  });
  emitWiringEvent("toolbar.wiring.complete", {
    wiredCount: wired.length,
    failedCount: failed.length,
    wired,
    failed
  });
  setupRewireListener(toolbar);
  return result;
}
function setupRewireListener(toolbar) {
  _setupRewireListener(toolbar, wireToolbar);
}
var toolbar_wiring_default = { wireToolbar, info, healthCheck, setupRewireListener, VERSION, MODULE_ID };
export {
  toolbar_wiring_default as default,
  healthCheck,
  info,
  setupRewireListener,
  wireToolbar
};
