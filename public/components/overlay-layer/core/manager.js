import Store from "../state/store.js";
import { validateOverlayDescriptor } from "../utils/contracts.js";
const VERSION = "2.1.0-SPRINT1";
const MODULE_ID = "overlay-layer-manager";
const _metrics = { openCount: 0, closeCount: 0, closeManyCount: 0, errors: 0 };
function open(descriptor) {
  const validation = validateOverlayDescriptor(descriptor);
  if (!validation.valid) {
    _metrics.errors++;
    return { ok: false, errors: validation.errors };
  }
  const normalized = validation.normalized;
  const existing = Store.getOverlay(normalized.id);
  if (existing) {
    Store.updateOverlayRuntime(normalized.id, { visible: true, openedAt: Date.now(), closing: false });
    return { ok: true, id: normalized.id, action: "updated" };
  }
  Store.addOverlay(Object.assign({}, normalized, { runtime: { visible: true, openedAt: Date.now(), closing: false, createdAt: Date.now() } }));
  _metrics.openCount++;
  return { ok: true, id: normalized.id, action: "opened" };
}
function close(id, reason) {
  reason = reason || "explicit";
  const overlay = Store.getOverlay(id);
  if (!overlay) return { ok: false, reason: "not-found" };
  Store.removeOverlay(id);
  _metrics.closeCount++;
  return { ok: true, id, reason, wasOpen: true };
}
function closeAll(reason) {
  reason = reason || "closeAll";
  const stack = Store.getStack();
  const closed = [];
  for (let i = 0; i < stack.length; i++) {
    const result = close(stack[i], reason);
    if (result.ok) closed.push(stack[i]);
  }
  return { ok: true, closed, count: closed.length };
}
function closeMany(filter, reason) {
  reason = reason || "closeMany";
  if (!filter || typeof filter !== "object") {
    return { ok: false, error: "filter-required", closed: [], failed: [], count: 0 };
  }
  const stack = Store.getStack();
  const overlays = Store.getOverlays();
  const toClose = [];
  const now = Date.now();
  for (let i = 0; i < stack.length; i++) {
    const id = stack[i];
    const overlay = overlays[id];
    if (!overlay) continue;
    let matches = true;
    if (filter.ids && Array.isArray(filter.ids)) {
      if (!filter.ids.includes(id)) matches = false;
    }
    if (matches && filter.excludeIds && Array.isArray(filter.excludeIds)) {
      if (filter.excludeIds.includes(id)) matches = false;
    }
    if (matches && filter.type) {
      if (overlay.type !== filter.type) matches = false;
    }
    if (matches && filter.types && Array.isArray(filter.types)) {
      if (!filter.types.includes(overlay.type)) matches = false;
    }
    if (matches && filter.excludeTypes && Array.isArray(filter.excludeTypes)) {
      if (filter.excludeTypes.includes(overlay.type)) matches = false;
    }
    if (matches && filter.scope) {
      if (overlay.scope !== filter.scope) matches = false;
    }
    if (matches && typeof filter.olderThan === "number") {
      const createdAt = overlay.runtime?.createdAt || overlay.runtime?.openedAt || overlay.createdAt;
      if (createdAt) {
        const age = now - createdAt;
        if (age < filter.olderThan) matches = false;
      } else {
        matches = false;
      }
    }
    if (matches && typeof filter.newerThan === "number") {
      const createdAt2 = overlay.runtime?.createdAt || overlay.runtime?.openedAt || overlay.createdAt;
      if (createdAt2) {
        const age2 = now - createdAt2;
        if (age2 > filter.newerThan) matches = false;
      }
    }
    if (matches && filter.priority && typeof filter.priority === "object") {
      const overlayPriority = overlay.config?.priority || 50;
      if (filter.priority.lt !== void 0 && overlayPriority >= filter.priority.lt) matches = false;
      if (filter.priority.gt !== void 0 && overlayPriority <= filter.priority.gt) matches = false;
      if (filter.priority.eq !== void 0 && overlayPriority !== filter.priority.eq) matches = false;
      if (filter.priority.lte !== void 0 && overlayPriority > filter.priority.lte) matches = false;
      if (filter.priority.gte !== void 0 && overlayPriority < filter.priority.gte) matches = false;
    }
    if (matches && filter.blocking !== void 0) {
      const isBlocking = overlay.config?.blocking || overlay.type === "modal";
      if (filter.blocking !== isBlocking) matches = false;
    }
    if (matches && typeof filter.custom === "function") {
      try {
        if (!filter.custom(overlay)) matches = false;
      } catch (e) {
        matches = false;
      }
    }
    if (matches) {
      toClose.push(id);
    }
  }
  const closed = [];
  const failed = [];
  for (let j = 0; j < toClose.length; j++) {
    const closeId = toClose[j];
    try {
      const result = close(closeId, reason);
      if (result.ok) {
        closed.push(closeId);
      } else {
        failed.push({ id: closeId, reason: result.reason || "unknown" });
      }
    } catch (e) {
      failed.push({ id: closeId, reason: e.message });
    }
  }
  _metrics.closeManyCount++;
  return {
    ok: true,
    closed,
    failed,
    count: closed.length,
    filtered: toClose.length,
    reason
  };
}
function findMany(filter) {
  if (!filter || typeof filter !== "object") {
    return [];
  }
  const stack = Store.getStack();
  const overlays = Store.getOverlays();
  const result = [];
  const now = Date.now();
  for (let i = 0; i < stack.length; i++) {
    const id = stack[i];
    const overlay = overlays[id];
    if (!overlay) continue;
    let matches = true;
    if (filter.ids && Array.isArray(filter.ids)) {
      if (!filter.ids.includes(id)) matches = false;
    }
    if (matches && filter.excludeIds && Array.isArray(filter.excludeIds)) {
      if (filter.excludeIds.includes(id)) matches = false;
    }
    if (matches && filter.type) {
      if (overlay.type !== filter.type) matches = false;
    }
    if (matches && filter.types && Array.isArray(filter.types)) {
      if (!filter.types.includes(overlay.type)) matches = false;
    }
    if (matches && filter.excludeTypes && Array.isArray(filter.excludeTypes)) {
      if (filter.excludeTypes.includes(overlay.type)) matches = false;
    }
    if (matches && filter.scope) {
      if (overlay.scope !== filter.scope) matches = false;
    }
    if (matches && typeof filter.olderThan === "number") {
      const createdAt = overlay.runtime?.createdAt || overlay.runtime?.openedAt || overlay.createdAt;
      if (createdAt) {
        if (now - createdAt < filter.olderThan) matches = false;
      } else {
        matches = false;
      }
    }
    if (matches && filter.priority && typeof filter.priority === "object") {
      const overlayPriority = overlay.config?.priority || 50;
      if (filter.priority.lt !== void 0 && overlayPriority >= filter.priority.lt) matches = false;
      if (filter.priority.gt !== void 0 && overlayPriority <= filter.priority.gt) matches = false;
      if (filter.priority.eq !== void 0 && overlayPriority !== filter.priority.eq) matches = false;
    }
    if (matches && filter.blocking !== void 0) {
      const isBlocking = overlay.config?.blocking || overlay.type === "modal";
      if (filter.blocking !== isBlocking) matches = false;
    }
    if (matches && typeof filter.custom === "function") {
      try {
        if (!filter.custom(overlay)) matches = false;
      } catch (e) {
        matches = false;
      }
    }
    if (matches) {
      result.push(overlay);
    }
  }
  return result;
}
function countMany(filter) {
  return findMany(filter).length;
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function healthCheck() {
  const checks = {
    storeAvailable: !!Store,
    lowErrorRate: _metrics.openCount === 0 || _metrics.errors / _metrics.openCount < 0.1
  };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let i = 0; i < checkKeys.length; i++) {
    if (checks[checkKeys[i]]) passed++;
  }
  const total = checkKeys.length;
  return {
    status: passed === total ? "HEALTHY" : "DEGRADED",
    score: `${passed}/${total}`,
    checks,
    metrics: getMetrics(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    metrics: getMetrics(),
    currentStack: Store.getStack(),
    timestamp: Date.now()
  };
}
var manager_default = {
  open,
  close,
  closeAll,
  closeMany,
  findMany,
  countMany,
  getMetrics,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  close,
  closeAll,
  closeMany,
  countMany,
  manager_default as default,
  findMany,
  getMetrics,
  healthCheck,
  info,
  open
};
