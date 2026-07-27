import { log } from "../helpers/logger.js";
const VERSION = "1.1.0-ES6";
const MODULE_ID = "header.core.header-events.handlers.connectivity";
function setupConnectivityHandlers(headerEvents) {
  const header = headerEvents.header;
  const metrics = headerEvents._metrics;
  window.addEventListener("online", () => {
    metrics.connectivityChangeCount++;
    metrics.lastEventAt = Date.now();
    log("info", "Navigator online");
    if (header && header.store) {
      header.store.updateConnectivity({ online: true, timeoutCount: 0 });
    }
    if (header && header.polling) {
      if (typeof header.polling.resume === "function") header.polling.resume();
    }
    if (header && header.announceManager && typeof header.announceManager.announce === "function") {
      header.announceManager.announce("Conex\xE3o restaurada");
    }
    if (header && typeof header.hideFallback === "function") {
      header.hideFallback();
    }
  }, { signal: header.abortControllers.connectivity.signal });
  window.addEventListener("offline", () => {
    metrics.connectivityChangeCount++;
    metrics.lastEventAt = Date.now();
    log("info", "Navigator offline");
    if (header && header.store) {
      header.store.updateConnectivity({ online: false });
    }
    if (header && header.announceManager && typeof header.announceManager.announce === "function") {
      header.announceManager.announce("Sem conex\xE3o");
    }
    if (header && typeof header.showFallback === "function") {
      header.showFallback("network", "Sem conex\xE3o com a internet");
    }
  }, { signal: header.abortControllers.connectivity.signal });
}
export {
  MODULE_ID,
  VERSION,
  setupConnectivityHandlers
};
