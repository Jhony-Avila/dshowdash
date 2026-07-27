import { getActivePanelElement } from "./helpers.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.toolbar-wiring.wire-search-export";
async function wireSearchExport(toolbar, wired, failed, logger) {
  try {
    const searchModule = await import("../panel-search-manager/index.js");
    const sm = searchModule.getPanelSearchManager?.() || searchModule;
    const toggleSearchFn = sm.toggle || searchModule.toggle;
    if (toggleSearchFn) {
      toolbar.registerAction("search", () => {
        toggleSearchFn();
      });
      wired.push("search");
    } else {
      failed.push("search");
    }
  } catch (e) {
    logger.warn("Panel Search Manager indispon\xEDvel", { error: e.message });
    failed.push("search");
  }
  try {
    const exportModule = await import("../export-content-manager/index.js");
    const formats = [
      { key: "export-png", fn: exportModule.exportToPNG },
      { key: "export-jpeg", fn: exportModule.exportToJPEG },
      { key: "export-pdf", fn: exportModule.exportToPDF },
      { key: "export-svg", fn: exportModule.exportToSVG }
    ];
    formats.forEach((fmt) => {
      if (fmt.fn) {
        toolbar.registerAction(fmt.key, () => {
          const el = getActivePanelElement();
          fmt.fn(el).catch((err) => {
            logger.warn(`${fmt.key} failed`, { error: err.message });
          });
        });
        wired.push(fmt.key);
      }
    });
    toolbar.registerAction("export", () => {
      logger.debug("Export dropdown opened");
    });
    wired.push("export");
  } catch (e) {
    logger.warn("Export Content Manager indispon\xEDvel", { error: e.message });
    failed.push("export");
  }
}
export {
  MODULE_ID,
  VERSION,
  wireSearchExport
};
