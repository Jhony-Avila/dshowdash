import { MODULE_ID } from "./constants.js";
import { metrics, splitView } from "./state.js";
import { getCM } from "./helpers.js";
import { createLogger } from "../logger.js";
const VERSION = "1.1.1-WARN-FIX";
const logger = createLogger(`${MODULE_ID}:split-view`);
function initializeSplitView() {
  const CM = getCM();
  if (!CM) return;
  splitView.value = CM.getSplitViewManager ? CM.getSplitViewManager() : null;
  if (!splitView.value) {
    logger.debug("SplitViewManager not available (optional feature)");
    return;
  }
  const container = document.getElementById("container-main");
  if (container) {
    try {
      if (splitView.value.init) splitView.value.init({ container });
      logger.debug("SplitView initialized");
    } catch (e) {
      metrics.errors++;
      logger.warn("Failed to init SplitView", { error: e.message });
    }
  }
}
export {
  VERSION,
  initializeSplitView
};
