import { getActivePanelId } from "./helpers.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.toolbar-wiring.wire-content";
async function wireContent(toolbar, wired, failed, logger) {
  try {
    const bmModule = await import("../panel-bookmarks-manager/index.js");
    const bm = bmModule.getPanelBookmarksManager?.() || bmModule;
    const addFn = bm.addBookmark || bmModule.addBookmark;
    const isBookmarkedFn = bm.isBookmarked || bmModule.isBookmarked;
    if (addFn) {
      toolbar.registerAction("bookmark", () => {
        const panelId = getActivePanelId();
        if (panelId) addFn(panelId);
      });
      if (isBookmarkedFn) {
        toolbar.registerStateProvider("bookmark", () => {
          const panelId = getActivePanelId();
          return { active: panelId ? isBookmarkedFn(panelId) : false };
        });
      }
      wired.push("bookmark");
    }
  } catch (e) {
    logger.warn("Bookmarks indispon\xEDvel", { error: e.message });
    failed.push("bookmark");
  }
  try {
    const themeModule = await import("../theme-manager-v2.js");
    const tm = themeModule.default?.toggle ? themeModule.default : themeModule;
    if (tm.createThemeManager || tm.toggle) {
      const themeManager = tm.toggle ? tm : tm.createThemeManager ? tm.createThemeManager() : null;
      if (themeManager && themeManager.toggle) {
        toolbar.registerAction("theme", () => {
          themeManager.toggle();
        });
        wired.push("theme");
      }
    }
  } catch (e) {
    logger.warn("Theme Manager indispon\xEDvel", { error: e.message });
    failed.push("theme");
  }
  try {
    const fiModule = await import("../features-integration/index.js");
    if (fiModule.openCommandPalette) {
      toolbar.registerAction("command", () => {
        fiModule.openCommandPalette();
      });
      wired.push("command");
    } else {
      failed.push("command");
    }
    if (fiModule.toggleSplitView) {
      toolbar.registerAction("split", () => {
        fiModule.toggleSplitView();
      });
      wired.push("split");
    } else {
      failed.push("split");
    }
    if (fiModule.startWelcomeTour) {
      toolbar.registerAction("tour", () => {
        fiModule.startWelcomeTour();
      });
      wired.push("tour");
    } else {
      failed.push("tour");
    }
  } catch (e) {
    logger.warn("Features Integration indispon\xEDvel", { error: e.message });
    failed.push("command", "split", "tour");
  }
  try {
    toolbar.registerAction("print", () => {
      window.print();
    });
    wired.push("print");
  } catch (e) {
    failed.push("print");
  }
}
export {
  MODULE_ID,
  VERSION,
  wireContent
};
