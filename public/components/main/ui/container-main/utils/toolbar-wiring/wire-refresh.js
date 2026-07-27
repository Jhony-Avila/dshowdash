import { getEventBus } from "./helpers.js";
import { PANEL_EVENT_NAMES } from "/core/runtime/constants/event-names.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.toolbar-wiring.wire-refresh";
async function wireRefresh(toolbar, wired, failed, logger) {
  try {
    toolbar.registerAction("refresh", () => {
      const eventBus = getEventBus();
      if (eventBus && eventBus.emit) {
        eventBus.emit(PANEL_EVENT_NAMES.REFRESH, { source: "toolbar" });
      } else {
        logger.warn("EventBus indispon\xEDvel para refresh");
      }
    });
    wired.push("refresh");
  } catch (e) {
    logger.warn("Refresh indispon\xEDvel", { error: e.message });
    failed.push("refresh");
  }
}
export {
  MODULE_ID,
  VERSION,
  wireRefresh
};
