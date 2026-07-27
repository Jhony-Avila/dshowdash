import { MODULE_ID } from "../constants.js";
import { getPort } from "../ports.js";
import { log } from "../helpers/logger.js";
import { safeOn } from "../helpers/event-bus.js";
import { KERNEL_RUNTIME_EVENTS } from "/core/runtime/events/catalog/kernel.events.js";
const VERSION = "1.1.0-ES6";
const HEADER_SELECTOR = ".site-header";
function handleRuntimeContextUpdated(header, data) {
  try {
    const snapshot = data && data.snapshot ? data.snapshot : null;
    const trigger = data && data.trigger ? data.trigger : "unknown";
    if (!snapshot) {
      log("warn", "RuntimeContext update sem snapshot");
      return;
    }
    log("info", "[P3] RuntimeContext updated", {
      trigger,
      // @ts-expect-error TS migration - TS2339
      mode: snapshot.mode,
      // @ts-expect-error TS migration - TS2339
      authenticated: snapshot.authenticated
    });
    _updateHeaderModeAttributes(header, snapshot);
    if (snapshot.maintenance) {
      _handleMaintenanceMode(header, snapshot);
    }
    if (snapshot.failed) {
      _handleFailedMode(header, snapshot);
    }
    if (trigger === "auth-change") {
      _handleAuthChange(header, snapshot);
    }
    if (header && header.eventBus && typeof header.eventBus.emit === "function") {
      header.eventBus.emit("header:runtime-context-updated", {
        snapshot,
        trigger,
        timestamp: Date.now(),
        source: MODULE_ID
      });
    }
  } catch (e) {
    log("error", "handleRuntimeContextUpdated error", e.message);
  }
}
function handleRuntimeContextReady(header, data) {
  try {
    const snapshot = data && data.snapshot ? data.snapshot : null;
    log("info", "[P3] RuntimeContext ready", {
      // @ts-expect-error TS migration - TS2339
      mode: snapshot ? snapshot.mode : "N/A",
      // @ts-expect-error TS migration - TS2339
      authenticated: snapshot ? snapshot.authenticated : "N/A"
    });
    if (snapshot) {
      _updateHeaderModeAttributes(header, snapshot);
    }
  } catch (e) {
    log("error", "handleRuntimeContextReady error", e.message);
  }
}
function _updateHeaderModeAttributes(header, snapshot) {
  try {
    const headerEl = document.querySelector(HEADER_SELECTOR);
    if (!headerEl) {
      log("warn", `[P3] Header element not found: ${HEADER_SELECTOR}`);
      return;
    }
    headerEl.setAttribute("data-kernel-mode", snapshot.mode || "UNKNOWN");
    headerEl.setAttribute("data-kernel-ready", snapshot.ready ? "true" : "false");
    headerEl.setAttribute("data-kernel-healthy", snapshot.healthy ? "true" : "false");
    headerEl.classList.remove(
      "kernel-mode-NORMAL",
      "kernel-mode-DEGRADED",
      "kernel-mode-MAINTENANCE",
      "kernel-mode-FAILED",
      "kernel-mode-RECOVERY",
      "kernel-mode-INITIALIZING"
    );
    if (snapshot.mode) {
      headerEl.classList.add(`kernel-mode-${snapshot.mode}`);
    }
    log("debug", "[P3] Header attributes updated", { mode: snapshot.mode });
  } catch (e) {
    log("error", "_updateHeaderModeAttributes error", e.message);
  }
}
function _handleMaintenanceMode(header, snapshot) {
  try {
    log("warn", "[P3] Sistema em modo MAINTENANCE");
    if (header && typeof header.showFallback === "function") {
      header.showFallback("maintenance", "Sistema em manuten\xE7\xE3o");
    }
    const headerEl = document.querySelector(HEADER_SELECTOR);
    if (headerEl) {
      headerEl.setAttribute("data-maintenance", "true");
    }
  } catch (e) {
    log("error", "_handleMaintenanceMode error", e.message);
  }
}
function _handleFailedMode(header, snapshot) {
  try {
    log("error", "[P3] Sistema em modo FAILED");
    if (header && typeof header.showFallback === "function") {
      header.showFallback("error", "Sistema indispon\xEDvel");
    }
  } catch (e) {
    log("error", "_handleFailedMode error", e.message);
  }
}
function _handleAuthChange(header, snapshot) {
  try {
    if (!snapshot.authenticated) {
      const userMenu = header && header.componentsLoader ? (
        // @ts-expect-error TS migration - TS2339
        header.componentsLoader.getComponent("user-menu")
      ) : null;
      if (userMenu && typeof userMenu.clearUser === "function") {
        userMenu.clearUser();
        log("info", "[P3] User-menu limpo via RuntimeContext auth-change");
      }
    }
  } catch (e) {
    log("error", "_handleAuthChange error", e.message);
  }
}
function setupRuntimeContextHandlers(headerEvents) {
  const eb = getPort("eventBus");
  if (!eb) {
    log("warn", "EventBus n\xE3o dispon\xEDvel - RuntimeContext handlers n\xE3o configurados");
    return;
  }
  const header = headerEvents.header;
  const cleanups = headerEvents._runtimeContextCleanups || [];
  headerEvents._runtimeContextCleanups = cleanups;
  const onUpdated = (data) => {
    if (headerEvents._metrics) {
      headerEvents._metrics.runtimeContextUpdateCount = // @ts-expect-error TS migration - TS2339
      (headerEvents._metrics.runtimeContextUpdateCount || 0) + 1;
      headerEvents._metrics.lastEventAt = Date.now();
    }
    handleRuntimeContextUpdated(header, data);
  };
  const onReady = (data) => {
    if (headerEvents._metrics) {
      headerEvents._metrics.runtimeContextReadyCount = // @ts-expect-error TS migration - TS2339
      (headerEvents._metrics.runtimeContextReadyCount || 0) + 1;
    }
    handleRuntimeContextReady(header, data);
  };
  const cleanup1 = safeOn(eb, KERNEL_RUNTIME_EVENTS.RUNTIME_CONTEXT_UPDATED, onUpdated);
  const cleanup2 = safeOn(eb, KERNEL_RUNTIME_EVENTS.RUNTIME_CONTEXT_READY, onReady);
  if (cleanup1) cleanups.push(typeof cleanup1 === "function" ? cleanup1 : () => {
    const bus = getPort("eventBus");
    if (bus && bus.off) bus.off(KERNEL_RUNTIME_EVENTS.RUNTIME_CONTEXT_UPDATED, onUpdated);
  });
  if (cleanup2) cleanups.push(typeof cleanup2 === "function" ? cleanup2 : () => {
    const bus = getPort("eventBus");
    if (bus && bus.off) bus.off(KERNEL_RUNTIME_EVENTS.RUNTIME_CONTEXT_READY, onReady);
  });
  log("info", `[P3] RuntimeContext handlers configurados (${cleanups.length} listeners)`);
}
function cleanupRuntimeContextHandlers(headerEvents) {
  const cleanups = headerEvents._runtimeContextCleanups || [];
  cleanups.forEach((cleanup) => {
    try {
      if (typeof cleanup === "function") cleanup();
    } catch (e) {
    }
  });
  headerEvents._runtimeContextCleanups = [];
  log("debug", "[P3] RuntimeContext handlers cleanup conclu\xEDdo");
}
var runtime_context_default = {
  handleRuntimeContextUpdated,
  handleRuntimeContextReady,
  setupRuntimeContextHandlers,
  cleanupRuntimeContextHandlers
};
export {
  VERSION,
  cleanupRuntimeContextHandlers,
  runtime_context_default as default,
  handleRuntimeContextReady,
  handleRuntimeContextUpdated,
  setupRuntimeContextHandlers
};
