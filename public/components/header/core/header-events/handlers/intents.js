import { HEADER_EVENTS, HEADER_INTENTS } from "/core/runtime/events/catalog/header.events.js";
import { MODULE_ID } from "../constants.js";
import { getPort } from "../ports.js";
import { log } from "../helpers/logger.js";
import { safeOn } from "../helpers/event-bus.js";
const VERSION = "1.1.0-ES6";
function handleRefreshIntent(header, data) {
  try {
    if (header && header.refreshCoordinator && typeof header.refreshCoordinator.request === "function") {
      header.refreshCoordinator.request();
      log("debug", "Refresh disparado via RefreshCoordinator");
    } else if (header && typeof header.refresh === "function") {
      header.refresh();
      log("debug", "Refresh disparado via header.refresh()");
    } else {
      log("warn", "Nenhum mecanismo de refresh dispon\xEDvel");
    }
    if (header && header.eventBus && typeof header.eventBus.emit === "function") {
      header.eventBus.emit(HEADER_EVENTS.REFRESH_TRIGGERED, {
        reason: data && data.reason ? data.reason : "intent",
        source: data && data.source ? data.source : "unknown",
        timestamp: Date.now(),
        moduleId: MODULE_ID
      });
    }
  } catch (e) {
    log("error", "_handleRefreshIntent error", e.message);
  }
}
function handleShowIntent(header, data) {
  try {
    const headerEl = document.querySelector("#shell-header-region") || document.querySelector(".main-header");
    if (headerEl) {
      headerEl.removeAttribute("data-header-hidden");
      headerEl.style.display = "";
      headerEl.setAttribute("aria-hidden", "false");
      log("debug", "Header mostrado via INTENT");
    }
    if (header && header.eventBus && typeof header.eventBus.emit === "function") {
      header.eventBus.emit(HEADER_EVENTS.DATA_UPDATED, {
        action: "show",
        visible: true,
        source: data && data.source ? data.source : "intent",
        timestamp: Date.now(),
        moduleId: MODULE_ID
      });
    }
  } catch (e) {
    log("error", "_handleShowIntent error", e.message);
  }
}
function handleHideIntent(header, data) {
  try {
    const headerEl = document.querySelector("#shell-header-region") || document.querySelector(".main-header");
    if (headerEl) {
      headerEl.setAttribute("data-header-hidden", "true");
      headerEl.style.display = "none";
      headerEl.setAttribute("aria-hidden", "true");
      log("debug", "Header ocultado via INTENT");
    }
    if (header && header.eventBus && typeof header.eventBus.emit === "function") {
      header.eventBus.emit(HEADER_EVENTS.DATA_UPDATED, {
        action: "hide",
        visible: false,
        source: data && data.source ? data.source : "intent",
        timestamp: Date.now(),
        moduleId: MODULE_ID
      });
    }
  } catch (e) {
    log("error", "_handleHideIntent error", e.message);
  }
}
function setupIntentsHandlers(headerEvents) {
  const eb = getPort("eventBus");
  if (!eb) {
    log("warn", "EventBus global n\xE3o dispon\xEDvel - HEADER_INTENTS n\xE3o configurados");
    return;
  }
  const header = headerEvents.header;
  const metrics = headerEvents._metrics;
  const cleanups = headerEvents._intentsCleanups;
  const onRefreshRequest = (data) => {
    metrics.intentsEventCount++;
    metrics.lastEventAt = Date.now();
    const reason = data && data.reason ? data.reason : "intent";
    const source = data && data.source ? data.source : "unknown";
    log("info", "INTENT: Refresh request recebido", { reason, source });
    handleRefreshIntent(header, data);
  };
  const onShowRequest = (data) => {
    metrics.intentsEventCount++;
    metrics.lastEventAt = Date.now();
    const source = data && data.source ? data.source : "unknown";
    log("info", "INTENT: Show request recebido", { source });
    handleShowIntent(header, data);
  };
  const onHideRequest = (data) => {
    metrics.intentsEventCount++;
    metrics.lastEventAt = Date.now();
    const source = data && data.source ? data.source : "unknown";
    log("info", "INTENT: Hide request recebido", { source });
    handleHideIntent(header, data);
  };
  const cleanup1 = safeOn(eb, HEADER_INTENTS.REFRESH, onRefreshRequest);
  const cleanup2 = safeOn(eb, HEADER_INTENTS.SHOW, onShowRequest);
  const cleanup3 = safeOn(eb, HEADER_INTENTS.HIDE, onHideRequest);
  if (cleanup1) cleanups.push(typeof cleanup1 === "function" ? cleanup1 : () => {
    const bus = getPort("eventBus");
    if (bus && bus.off) bus.off(HEADER_INTENTS.REFRESH, onRefreshRequest);
  });
  if (cleanup2) cleanups.push(typeof cleanup2 === "function" ? cleanup2 : () => {
    const bus = getPort("eventBus");
    if (bus && bus.off) bus.off(HEADER_INTENTS.SHOW, onShowRequest);
  });
  if (cleanup3) cleanups.push(typeof cleanup3 === "function" ? cleanup3 : () => {
    const bus = getPort("eventBus");
    if (bus && bus.off) bus.off(HEADER_INTENTS.HIDE, onHideRequest);
  });
  log("info", `HEADER_INTENTS configurados (${cleanups.length} listeners)`);
}
function cleanupIntentsHandlers(headerEvents) {
  headerEvents._intentsCleanups.forEach((cleanup) => {
    try {
      if (typeof cleanup === "function") cleanup();
    } catch (e) {
    }
  });
  headerEvents._intentsCleanups = [];
  log("debug", "HEADER_INTENTS cleanup conclu\xEDdo");
}
export {
  VERSION,
  cleanupIntentsHandlers,
  handleHideIntent,
  handleRefreshIntent,
  handleShowIntent,
  setupIntentsHandlers
};
