const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.toolbar-wiring.wire-navigation";
async function wireNavigation(toolbar, wired, failed, logger) {
  try {
    const navModule = await import("../navigation-history/index.js");
    const nh = navModule.getNavigationHistory?.() || navModule;
    if (nh.goBack) {
      toolbar.registerAction("back", () => {
        nh.goBack();
      });
      toolbar.registerStateProvider("back", () => ({
        disabled: nh.canGoBack ? !nh.canGoBack() : false
      }));
      wired.push("back");
    }
    if (nh.goForward) {
      toolbar.registerAction("forward", () => {
        nh.goForward();
      });
      toolbar.registerStateProvider("forward", () => ({
        disabled: nh.canGoForward ? !nh.canGoForward() : false
      }));
      wired.push("forward");
    }
    toolbar.registerAction("history", () => {
      logger.debug("History dropdown opened");
    });
    wired.push("history");
    if (nh.goBack) {
      toolbar.registerAction("history-back-all", () => {
        const maxSteps = 50;
        let steps = 0;
        while (nh.canGoBack && nh.canGoBack() && steps < maxSteps) {
          nh.goBack();
          steps++;
        }
        logger.debug("History: back-all executed", { steps });
      });
      wired.push("history-back-all");
    }
    const clearHistoryFn = nh.clear || nh.clearHistory || nh.reset;
    if (clearHistoryFn) {
      toolbar.registerAction("history-clear", () => {
        clearHistoryFn();
        logger.debug("History: cleared");
      });
      wired.push("history-clear");
    } else {
      toolbar.registerAction("history-clear", () => {
        logger.info("History clear triggered (manager sem clear)");
      });
      wired.push("history-clear");
    }
    if (nh.getHistory || nh.getEntries || nh.size) {
      toolbar.registerStateProvider("history", () => {
        let count = 0;
        try {
          if (nh.size) {
            count = typeof nh.size === "function" ? nh.size() : nh.size;
          } else if (nh.getHistory) {
            count = nh.getHistory().length;
          } else if (nh.getEntries) {
            count = nh.getEntries().length;
          }
        } catch (_e) {
        }
        return {
          badge: count > 1 ? count : void 0,
          tooltip: `Hist\xF3rico (${count})`
        };
      });
    }
  } catch (e) {
    logger.warn("Navigation History indispon\xEDvel", { error: e.message });
    failed.push("navigation");
  }
}
export {
  MODULE_ID,
  VERSION,
  wireNavigation
};
