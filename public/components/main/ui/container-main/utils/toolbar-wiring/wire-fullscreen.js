const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.toolbar-wiring.wire-fullscreen";
async function wireFullscreen(toolbar, wired, failed, logger) {
  function _getContainer() {
    return document.getElementById("container-main") || document.documentElement;
  }
  function _nativeFullscreenToggle() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {
      });
    } else {
      _getContainer().requestFullscreen().catch(() => {
      });
    }
  }
  try {
    const fsModule = await import("../fullscreen-manager.js");
    const fsMgr = fsModule.getFullscreenManager ? fsModule.getFullscreenManager() : null;
    if (fsMgr && fsMgr.toggle) {
      toolbar.registerAction("fullscreen", () => {
        fsMgr.toggle(_getContainer()).catch((err) => {
          logger.warn("Fullscreen toggle failed", { error: err.message });
        });
      });
      toolbar.registerStateProvider("fullscreen", () => ({
        active: fsMgr.isFullscreen()
      }));
      wired.push("fullscreen");
    } else {
      toolbar.registerAction("fullscreen", _nativeFullscreenToggle);
      wired.push("fullscreen");
    }
  } catch (e) {
    logger.warn("Fullscreen Manager indispon\xEDvel, usando fallback nativo", { error: e.message });
    toolbar.registerAction("fullscreen", _nativeFullscreenToggle);
    wired.push("fullscreen");
  }
}
export {
  MODULE_ID,
  VERSION,
  wireFullscreen
};
