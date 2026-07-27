import { HEADER_EVENTS } from "/core/runtime/events/catalog/header.events.js";
import { BOOT_EVENTS } from "/core/runtime/events/catalog/boot.events.js";
import { waitForComponentsReady } from "/core/runtime/boot-ready-dom-bridge.js";
import { TELEMETRY_ACTIONS } from "../constants.js";
import { getPort } from "../ports.js";
import { log } from "../helpers/logger.js";
import { safeOn } from "../helpers/event-bus.js";
const VERSION = "1.1.0-ES6";
const MODULE_ID = "header.core.header-events.handlers.refresh";
function setupRefreshEventHandlers(headerEvents) {
  const header = headerEvents.header;
  const metrics = headerEvents._metrics;
  if (!header.eventBus || typeof header.eventBus.on !== "function") {
    log("warn", "Header EventBus n\xE3o dispon\xEDvel para REFRESH handler");
    return;
  }
  header.eventBus.on(HEADER_EVENTS.REFRESH, (payload) => {
    metrics.refreshCount++;
    metrics.lastEventAt = Date.now();
    log("info", "Refresh solicitado via componente modular", payload);
    const sampleRate = header.config && header.config.telemetry && header.config.telemetry.sampleRate ? header.config.telemetry.sampleRate : 0.1;
    const shouldSample = Math.random() < sampleRate;
    const cfg = getPort("config");
    const debugEnabled = cfg && cfg.app && cfg.app.debug;
    if (shouldSample || debugEnabled) {
      if (header.telemetry && typeof header.telemetry.track === "function") {
        header.telemetry.track("header:refresh:performance", {
          reason: payload ? payload.reason : null,
          instanceId: header.instanceId,
          action: TELEMETRY_ACTIONS.HEADER.REFRESH_DONE,
          sampled: true
        });
      }
    }
  });
}
function setupComponentsReadyListener(headerEvents) {
  const header = headerEvents.header;
  const metrics = headerEvents._metrics;
  const eb = getPort("eventBus");
  let handled = false;
  const onComponentsReady = (data) => {
    if (handled) return;
    handled = true;
    metrics.componentsReadyCount++;
    metrics.lastEventAt = Date.now();
    log("info", "Componentes prontos", data);
    if (header && typeof header.hideFallback === "function") {
      header.hideFallback();
    }
  };
  const cleanup = safeOn(eb, BOOT_EVENTS.COMPONENTS_READY, onComponentsReady);
  if (cleanup) {
    headerEvents._componentsReadyCleanup = typeof cleanup === "function" ? cleanup : () => {
      const bus = getPort("eventBus");
      if (bus && bus.off) bus.off(BOOT_EVENTS.COMPONENTS_READY, onComponentsReady);
    };
  }
  metrics.bridgeUsed = true;
  waitForComponentsReady(1e4).then(() => {
    if (!handled) {
      onComponentsReady({ source: "bridge" });
    }
  });
}
export {
  MODULE_ID,
  VERSION,
  setupComponentsReadyListener,
  setupRefreshEventHandlers
};
