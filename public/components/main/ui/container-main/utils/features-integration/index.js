import { VERSION, MODULE_ID } from "./constants.js";
import { startWelcomeTour, openCommandPalette, toggleSplitView } from "./api.js";
import { info, healthCheck } from "./health.js";
import { MODULE_ID as MODULE_ID2 } from "./constants.js";
import { initialized, resetManagers } from "./state.js";
import { registerDefaultCommands } from "./commands.js";
import { registerWelcomeTour } from "./tour.js";
import { initializeSplitView } from "./split-view.js";
import { setupKeyboardShortcuts } from "./shortcuts.js";
import { startWelcomeTour as startWelcomeTour2, openCommandPalette as openCommandPalette2, toggleSplitView as toggleSplitView2 } from "./api.js";
import { info as info2, healthCheck as healthCheck2 } from "./health.js";
import { createLogger } from "../logger.js";
const VERSION2 = "1.1.2-LOTE11-FIX";
const logger = createLogger(MODULE_ID2);
function init(options) {
  if (initialized.value) return { ok: true, alreadyInitialized: true };
  logger.debug("Initializing features integration...");
  setTimeout(() => {
    registerDefaultCommands();
    registerWelcomeTour();
    initializeSplitView();
    setupKeyboardShortcuts();
  }, 500);
  initialized.value = true;
  logger.debug("Initialized", { version: VERSION2 });
  return { ok: true, version: VERSION2 };
}
function destroy() {
  initialized.value = false;
  resetManagers();
  return { ok: true };
}
var features_integration_default = {
  VERSION: VERSION2,
  MODULE_ID: MODULE_ID2,
  init,
  destroy,
  startWelcomeTour: startWelcomeTour2,
  openCommandPalette: openCommandPalette2,
  toggleSplitView: toggleSplitView2,
  info: info2,
  healthCheck: healthCheck2
};
export {
  VERSION as CONST_VERSION,
  MODULE_ID,
  VERSION2 as VERSION,
  features_integration_default as default,
  destroy,
  healthCheck,
  info,
  init,
  openCommandPalette,
  startWelcomeTour,
  toggleSplitView
};
