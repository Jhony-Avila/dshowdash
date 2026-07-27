import { MAX_CONTAINERS, CRITICAL_PANELS } from "./constants.js";
const VERSION = "5.1.0-ON-DEMAND";
const MODULE_ID = "main-engine-container-ops";
function cleanupOldContainers(engine, currentContainerId) {
  try {
    const adapters = engine._adapters;
    const containerAdapter = adapters.container;
    if (!containerAdapter?.list || !containerAdapter?.destroy) return;
    const containers = containerAdapter.list();
    const protectedIds = new Set(["primary", currentContainerId, engine._lastContainerId].filter(Boolean));
    if (containers.length > MAX_CONTAINERS) {
      const sortedByAge = containers.filter((c) => !protectedIds.has(c.id) && c.state === "inactive").sort((a, b) => a.createdAt - b.createdAt);
      const toRemove = sortedByAge.slice(0, containers.length - MAX_CONTAINERS);
      for (const container of toRemove) {
        try {
          containerAdapter.destroy(container.id);
          engine._metrics.containerCleanups++;
          engine._ports.telemetry?.track?.("container:cleanup", { id: container.id });
        } catch (e) {
        }
      }
    }
  } catch (e) {
  }
}
function schedulePreload(engine) {
  engine._ports.telemetry?.track?.("main:preload-skipped", {
    reason: "on-demand-policy",
    criticalPanels: CRITICAL_PANELS,
    timestamp: Date.now()
  });
}
async function preloadCriticalPanels(engine, options = {}) {
  if (!options.force && !options.enablePreload) {
    engine._ports.telemetry?.track?.("main:preload-blocked", {
      reason: "requires-explicit-enable",
      timestamp: Date.now()
    });
    return { ok: false, reason: "Preload requires explicit enablePreload option" };
  }
  const auth = engine._adapters?.auth;
  if (!auth?.isAuthenticated?.()) {
    engine._ports.telemetry?.track?.("main:preload-blocked", {
      reason: "not-authenticated",
      timestamp: Date.now()
    });
    return { ok: false, reason: "User not authenticated" };
  }
  try {
    const panelAdapter = engine._adapters.panelLoader;
    const results = { loaded: [], skipped: [], failed: [] };
    for (const panelId of CRITICAL_PANELS) {
      if (panelId === engine._lastNavigatedPanel) {
        results.skipped.push({ panelId, reason: "already-navigated" });
        continue;
      }
      try {
        if (panelAdapter?.preload) {
          await panelAdapter.preload([panelId]);
        } else if (engine._ports.panel?.load) {
          await engine._ports.panel.load(panelId);
        }
        results.loaded.push(panelId);
      } catch (e) {
        results.failed.push({ panelId, error: e.message });
      }
    }
    engine._metrics.preloadsTriggered++;
    engine._ports.telemetry?.track?.("main:preload-executed", {
      panels: CRITICAL_PANELS,
      results,
      timestamp: Date.now()
    });
    return { ok: true, results };
  } catch (e) {
    engine._ports.telemetry?.track?.("main:preload-error", {
      error: e.message,
      timestamp: Date.now()
    });
    return { ok: false, error: e.message };
  }
}
async function warmCache(engine, panelIds, options = {}) {
  if (!options.force) {
    const auth = engine._adapters?.auth;
    if (!auth?.isAuthenticated?.()) {
      return { ok: false, reason: "User not authenticated" };
    }
  }
  const panelLifecycle = engine._panelLifecycle;
  if (panelLifecycle?.warmCache) {
    return panelLifecycle.warmCache(panelIds);
  }
  return { ok: false, reason: "warmCache not available" };
}
function getContainerSnapshot(engine) {
  return engine._multiContainerOrchestrator?.snapshot?.() || null;
}
async function restoreContainerSnapshot(engine, snapshotData) {
  return engine._multiContainerOrchestrator?.restore?.(snapshotData) || false;
}
function clearContainerSnapshot(engine) {
  return engine._multiContainerOrchestrator?.clearSnapshot?.() || false;
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    onDemandPolicy: true,
    preloadDisabled: true,
    criticalPanels: CRITICAL_PANELS
  };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID,
    onDemandPolicy: true,
    preloadDisabled: true,
    timestamp: Date.now()
  };
}
var container_ops_default = {
  cleanupOldContainers,
  schedulePreload,
  preloadCriticalPanels,
  warmCache,
  getContainerSnapshot,
  restoreContainerSnapshot,
  clearContainerSnapshot,
  healthCheck,
  info,
  MODULE_ID,
  VERSION
};
export {
  MODULE_ID,
  VERSION,
  cleanupOldContainers,
  clearContainerSnapshot,
  container_ops_default as default,
  getContainerSnapshot,
  healthCheck,
  info,
  preloadCriticalPanels,
  restoreContainerSnapshot,
  schedulePreload,
  warmCache
};
