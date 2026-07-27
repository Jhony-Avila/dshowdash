import {
  RESOURCE_STATES,
  getRegisteredResources,
  getResourcesByType,
  disposeAllResources
} from "../../contracts/resource-contract.js";
const VERSION = "2.0.0-MODULAR";
const MODULE_ID = "container-main:resource-manager:cleanup-strategies";
async function cleanupByPriority(options = {}) {
  const {
    throttledPanels = /* @__PURE__ */ new Set(),
    panelResources = /* @__PURE__ */ new Map(),
    unregisterResource,
    onProgress
  } = options;
  let cleaned = 0;
  const initialTotal = getRegisteredResources().length;
  const errorResources = getRegisteredResources().filter(
    (r) => r.getState?.()?.state === RESOURCE_STATES.ERROR
  );
  for (const r of errorResources) {
    await r.dispose?.();
    cleaned++;
    onProgress?.("error", cleaned);
  }
  for (const panelId of throttledPanels) {
    const record = panelResources.get(panelId);
    if (record) {
      for (const [resourceId, info2] of record.resources) {
        if (info2.resource?.getState?.()?.state !== RESOURCE_STATES.ACTIVE) {
          await unregisterResource?.(panelId, resourceId);
          cleaned++;
          onProgress?.("throttled", cleaned);
        }
      }
    }
  }
  const pausedResources = getRegisteredResources().filter(
    (r) => r.getState?.()?.state === RESOURCE_STATES.PAUSED
  );
  for (const r of pausedResources) {
    await r.dispose?.();
    cleaned++;
    onProgress?.("paused", cleaned);
  }
  const idleResources = getRegisteredResources().filter(
    (r) => r.getState?.()?.state === RESOURCE_STATES.IDLE
  );
  for (const r of idleResources) {
    await r.dispose?.();
    cleaned++;
    onProgress?.("idle", cleaned);
  }
  return { cleaned, previousTotal: initialTotal };
}
async function cleanupByType(type) {
  const resources = getResourcesByType(type);
  let cleaned = 0;
  for (const r of resources) {
    if (r.getState?.()?.state !== RESOURCE_STATES.ACTIVE) {
      await r.dispose?.();
      cleaned++;
    }
  }
  return cleaned;
}
async function cleanupPanel(panelId, options = {}) {
  const { panelResources, unregisterResource } = options;
  const record = panelResources?.get(panelId);
  if (!record) return 0;
  let cleaned = 0;
  for (const [resourceId, info2] of record.resources) {
    if (info2.resource?.getState?.()?.state !== RESOURCE_STATES.ACTIVE) {
      await unregisterResource?.(panelId, resourceId);
      cleaned++;
    }
  }
  return cleaned;
}
async function disposeAll(panelResources, unregisterPanel) {
  if (panelResources && unregisterPanel) {
    for (const [panelId] of panelResources) {
      await unregisterPanel(panelId);
    }
  }
  return disposeAllResources();
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    exports: ["cleanupByPriority", "cleanupByType", "cleanupPanel", "disposeAll"],
    priorities: ["error", "throttled", "paused", "idle"]
  };
}
var cleanup_strategies_default = {
  VERSION,
  MODULE_ID,
  cleanupByPriority,
  cleanupByType,
  cleanupPanel,
  disposeAll,
  info
};
export {
  MODULE_ID,
  VERSION,
  cleanupByPriority,
  cleanupByType,
  cleanupPanel,
  cleanup_strategies_default as default,
  disposeAll,
  info
};
