import { log } from "../helpers/logger.js";
const VERSION = "1.1.0-ES6";
const MODULE_ID = "header.core.header-events.handlers.visibility";
function setupVisibilityChange(headerEvents) {
  const header = headerEvents.header;
  const metrics = headerEvents._metrics;
  document.addEventListener("visibilitychange", () => {
    metrics.visibilityChangeCount++;
    metrics.lastEventAt = Date.now();
    if (document.hidden) {
      log("info", "Documento oculto");
      if (header && header.polling && typeof header.polling.pause === "function") {
        header.polling.pause();
      }
      header.pollingRestored = false;
    } else {
      if (!header.pollingRestored) {
        log("info", "Documento vis\xEDvel");
        if (header && header.polling && typeof header.polling.resume === "function") {
          header.polling.resume();
        }
        header.pollingRestored = true;
      }
    }
  }, { signal: header.abortControllers.visibility.signal });
}
export {
  MODULE_ID,
  VERSION,
  setupVisibilityChange
};
