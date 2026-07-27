const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.navigation-history.helpers.notify";
function notifyListeners(listeners, event, data, logger) {
  listeners.forEach((listener) => {
    try {
      listener({ event, ...data, timestamp: Date.now() });
    } catch (e) {
      logger.warn("Listener error:", e);
    }
  });
}
export {
  MODULE_ID,
  VERSION,
  notifyListeners
};
