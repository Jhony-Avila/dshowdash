const MODULE_ID = "main.domain.features.persistence-sync.lifecycle";
import { MAIN_EVENTS } from "/core/runtime/events/catalog/main.events.js";
import { ROUTER_EVENTS } from "/core/runtime/events/catalog/router.events.js";
import { VERSION, STATE_VERSION, STORAGE_KEYS } from "./constants.js";
import { enabled, cleanups, syncTimeoutId, pendingChanges, metrics, addCleanup, resetCleanups } from "./state.js";
import { initPorts, getPort } from "./ports.js";
import { loadRaw, saveRaw } from "./storage.js";
import { wrapWithVersion, unwrapVersioned, migrateData } from "./versioning.js";
import { flushPending, trackNavigation } from "./sync.js";
function checkAndMigrateExisting() {
  const keys = [STORAGE_KEYS.NAVIGATION_STATE, STORAGE_KEYS.CONTAINER_STATE, STORAGE_KEYS.USER_PREFERENCES];
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const raw = loadRaw(key);
    if (raw) {
      const unwrapped = unwrapVersioned(raw);
      if (unwrapped.needsMigration) {
        const migrated = migrateData(unwrapped.data, unwrapped.fromVersion, key);
        saveRaw(key, wrapWithVersion(migrated));
      }
    }
  }
}
function init(options) {
  if (enabled.value) return { ok: true, alreadyInitialized: true };
  try {
    initPorts();
    metrics.inits++;
    checkAndMigrateExisting();
    const eb = getPort("eventBus");
    if (eb && eb.on) {
      const navCompleteHandler = (data) => {
        const path = data && data.path || data && data.route || data && data.panelId || "unknown";
        trackNavigation(path);
      };
      if (MAIN_EVENTS && MAIN_EVENTS.NAVIGATION_COMPLETE) {
        eb.on(MAIN_EVENTS.NAVIGATION_COMPLETE, navCompleteHandler);
        addCleanup(() => {
          if (eb.off) eb.off(MAIN_EVENTS.NAVIGATION_COMPLETE, navCompleteHandler);
        });
      }
      if (ROUTER_EVENTS && ROUTER_EVENTS.ROUTE_CHANGED) {
        eb.on(ROUTER_EVENTS.ROUTE_CHANGED, navCompleteHandler);
        addCleanup(() => {
          if (eb.off) eb.off(ROUTER_EVENTS.ROUTE_CHANGED, navCompleteHandler);
        });
      }
    }
    enabled.value = true;
    return { ok: true, version: VERSION, stateVersion: STATE_VERSION };
  } catch (e) {
    metrics.errors++;
    return { ok: false, error: e.message };
  }
}
function destroy() {
  flushPending();
  clearTimeout(syncTimeoutId.value);
  syncTimeoutId.value = null;
  for (let i = 0; i < cleanups.length; i++) {
    try {
      cleanups[i]();
    } catch (e) {
      metrics.errors++;
    }
  }
  resetCleanups();
  pendingChanges.clear();
  enabled.value = false;
  return { ok: true };
}
const cleanup = destroy;
export {
  MODULE_ID,
  cleanup,
  destroy,
  init
};
