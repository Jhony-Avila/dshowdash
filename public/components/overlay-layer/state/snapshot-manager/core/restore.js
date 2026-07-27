import { SNAPSHOT_FORMAT_VERSION } from "../constants.js";
import {
  getStore,
  getOpenOverlay,
  getCloseOverlay,
  incrementRestoresPerformed
} from "../state.js";
const VERSION = "1.0.0";
const MODULE_ID = "overlay-layer.state.snapshot-manager.core.restore";
function restore(snapshotData, options) {
  options = options || {};
  const store = getStore();
  const openOverlay = getOpenOverlay();
  const closeOverlay = getCloseOverlay();
  if (!store) {
    return { ok: false, error: "store-not-injected" };
  }
  if (!snapshotData || !snapshotData.version) {
    return { ok: false, error: "invalid-snapshot" };
  }
  if (snapshotData.version !== SNAPSHOT_FORMAT_VERSION) {
    if (!options.ignoreVersion) {
      return {
        ok: false,
        error: "version-mismatch",
        expected: SNAPSHOT_FORMAT_VERSION,
        received: snapshotData.version
      };
    }
  }
  const results = {
    closed: [],
    opened: [],
    failed: [],
    skipped: []
  };
  if (options.clearCurrent !== false && closeOverlay) {
    const currentStack = store.getStack ? store.getStack() : [];
    for (let i = 0; i < currentStack.length; i++) {
      const id = currentStack[i];
      try {
        const closeResult = closeOverlay(id, "snapshot-restore");
        if (closeResult && closeResult.ok !== false) {
          results.closed.push(id);
        } else {
          results.failed.push({ id, action: "close", reason: closeResult ? closeResult.reason : "unknown" });
        }
      } catch (e) {
        results.failed.push({ id, action: "close", reason: e.message });
      }
    }
  }
  if (openOverlay && snapshotData.stack && snapshotData.overlays) {
    for (let j = 0; j < snapshotData.stack.length; j++) {
      const overlayId = snapshotData.stack[j];
      const overlayData = snapshotData.overlays[overlayId];
      if (!overlayData) {
        results.skipped.push({ id: overlayId, reason: "no-data" });
        continue;
      }
      if (!overlayData.content && options.requireContent) {
        results.skipped.push({ id: overlayId, reason: "no-content" });
        continue;
      }
      try {
        const descriptor = {
          id: options.preserveIds ? overlayData.id : void 0,
          type: overlayData.type,
          scope: overlayData.scope,
          content: overlayData.content,
          config: overlayData.config,
          meta: Object.assign({}, overlayData.meta, {
            restoredFrom: snapshotData.id,
            restoredAt: Date.now()
          }),
          data: overlayData.data
        };
        const openResult = openOverlay(descriptor, {
          bypassRateLimit: true,
          bypassKernelCheck: options.bypassKernelCheck
        });
        if (openResult && openResult.ok) {
          results.opened.push(openResult.id || overlayData.id);
        } else {
          let reason = "unknown";
          if (openResult) {
            reason = openResult.reason || (openResult.errors ? openResult.errors.join(", ") : "unknown");
          }
          results.failed.push({ id: overlayData.id, action: "open", reason });
        }
      } catch (e) {
        results.failed.push({ id: overlayData.id, action: "open", reason: e.message });
      }
    }
  }
  incrementRestoresPerformed();
  return {
    ok: results.failed.length === 0,
    results,
    snapshotId: snapshotData.id,
    closedCount: results.closed.length,
    openedCount: results.opened.length,
    failedCount: results.failed.length,
    skippedCount: results.skipped.length
  };
}
var restore_default = {
  restore
};
export {
  MODULE_ID,
  VERSION,
  restore_default as default,
  restore
};
