const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.toolbar-wiring.wire-zoom";
async function wireZoom(toolbar, wired, failed, logger) {
  try {
    let _ensureZoomInit = function() {
      if (zoomInitialized) return true;
      if (!zoomInitFn) return false;
      const container = document.getElementById("container-main");
      if (!container) return false;
      const content = container.querySelector(".dsd-container__body") || container.querySelector(".panel-active") || container;
      zoomInitFn(container, content);
      zoomInitialized = true;
      logger.debug("Zoom manager auto-initialized", {
        content: content.className || content.id || "container"
      });
      return true;
    };
    const zoomModule = await import("../zoom-manager/index.js");
    const zoomInitFn = zoomModule.init;
    const zoomGetCurrentZoom = zoomModule.getCurrentZoom;
    let zoomInitialized = false;
    if (zoomModule.zoomIn) {
      toolbar.registerAction("zoomIn", () => {
        _ensureZoomInit();
        zoomModule.zoomIn();
      });
      wired.push("zoomIn");
    }
    if (zoomModule.zoomOut) {
      toolbar.registerAction("zoomOut", () => {
        _ensureZoomInit();
        zoomModule.zoomOut();
      });
      wired.push("zoomOut");
    }
    if (zoomModule.resetZoom) {
      toolbar.registerAction("zoomReset", () => {
        _ensureZoomInit();
        zoomModule.resetZoom();
      });
      toolbar.registerStateProvider("zoomReset", () => {
        const zoom = zoomGetCurrentZoom ? zoomGetCurrentZoom() : 1;
        return { tooltip: `Zoom ${Math.round(zoom * 100)}%` };
      });
      wired.push("zoomReset");
    }
  } catch (e) {
    logger.warn("Zoom Manager indispon\xEDvel", { error: e.message });
    failed.push("zoom");
  }
}
export {
  MODULE_ID,
  VERSION,
  wireZoom
};
