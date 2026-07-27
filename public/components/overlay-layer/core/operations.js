import Store from "../state/store.js";
import * as Manager from "./manager.js";
import * as Tracker from "../telemetry/tracker.js";
import * as OverlayKernel from "../kernel/index.js";
import * as SchemaValidator from "../utils/schema-validator.js";
import * as RateLimiter from "../kernel/rate-limiter.js";
import * as CircuitBreaker from "../kernel/circuit-breaker.js";
import * as LifecycleHooks from "./lifecycle-hooks/index.js";
import * as PendingQueue from "../kernel/pending-queue/index.js";
import * as TemplateRegistry from "./template-registry/index.js";
import * as FocusManager from "../ui/focus-manager.js";
import * as ZIndexManager from "../ui/zindex-manager.js";
import * as _MetricsCollector from "../telemetry/metrics-collector.js";
const MetricsCollector = _MetricsCollector;
import * as ErrorBoundary from "./error-boundary/index.js";
import * as DebugPanel from "../devtools/debug-panel.js";
import { syncWithContextProvider, _retryState } from "./integrations.js";
const MODULE_ID = "overlay-layer.core.operations";
const VERSION = "1.0.0-ENTERPRISE";
const _hasBlockingOverlay = () => {
  const stack = Store.getStack();
  const overlays = Store.getOverlays();
  return stack.some((id) => {
    const o = overlays[id];
    return o?.config?.blocking === true || o?.type === "modal";
  });
};
const _getTopOverlay = (scope) => {
  const stack = Store.getStack();
  const overlays = Store.getOverlays();
  if (stack.length === 0) return null;
  if (scope) {
    for (let i = stack.length - 1; i >= 0; i--) {
      if (overlays[stack[i]]?.scope === scope) return overlays[stack[i]];
    }
    return null;
  }
  return overlays[stack[stack.length - 1]] || null;
};
const open = ErrorBoundary.boundary(async (descriptor, options = {}) => {
  const timing = MetricsCollector.startTiming("open");
  if (descriptor.template && !options.templateResolved) {
    const tpl = TemplateRegistry.apply(descriptor.template, descriptor);
    if (!tpl.ok) return { ok: false, error: "template-not-found", template: descriptor.template };
    descriptor = tpl.descriptor;
    options.templateResolved = true;
  }
  if (LifecycleHooks.hasHooks("beforeOpen")) {
    const hr = await LifecycleHooks.execute("beforeOpen", { descriptor, options });
    if (hr.cancelled) return { ok: false, cancelled: true, reason: hr.cancelReason };
    if (hr.modifiedContext?.descriptor) descriptor = hr.modifiedContext.descriptor;
  }
  if (!options.bypassCircuitBreaker) {
    const cb = CircuitBreaker.isAllowed("open");
    if (!cb.allowed) {
      if (!options.bypassQueue && PendingQueue.isEnabled()) {
        const eq = PendingQueue.enqueue(descriptor, "circuit-breaker", { openOptions: options });
        if (eq.ok) {
          MetricsCollector.recordQueued(descriptor.type, "circuit-breaker");
          return { ok: false, queued: true, queueId: eq.queueId };
        }
      }
      MetricsCollector.recordBlocked(descriptor.type, "circuit-breaker");
      return { ok: false, circuitBreakerOpen: true, reason: cb.reason };
    }
  }
  const validation = SchemaValidator.validate(descriptor);
  if (!validation.valid) {
    CircuitBreaker.recordFailure("open", { type: "validation" });
    return { ok: false, errors: validation.errors };
  }
  const norm = validation.normalized;
  if (!options.bypassRateLimit) {
    const rl = RateLimiter.isAllowed(norm.type);
    if (!rl.allowed) {
      if (!options.bypassQueue && PendingQueue.isEnabled()) {
        const eq = PendingQueue.enqueue(norm, "rate-limited", { openOptions: options });
        if (eq.ok) {
          MetricsCollector.recordQueued(norm.type, "rate-limited");
          return { ok: false, queued: true, queueId: eq.queueId };
        }
      }
      MetricsCollector.recordBlocked(norm.type, "rate-limited");
      return { ok: false, rateLimited: true, reason: rl.reason };
    }
  }
  if (_retryState.kernelIntegrated && !options.bypassKernelCheck) {
    const can = OverlayKernel.canOpenOverlay(norm.type, { scope: norm.scope || "global" });
    if (!can.allowed) {
      if (!options.bypassQueue && PendingQueue.isEnabled()) {
        const eq = PendingQueue.enqueue(norm, can.reason, { openOptions: options });
        if (eq.ok) {
          MetricsCollector.recordQueued(norm.type, can.reason);
          return { ok: false, queued: true, queueId: eq.queueId };
        }
      }
      MetricsCollector.recordBlocked(norm.type, can.reason);
      return { ok: false, blocked: true, reason: can.reason };
    }
  }
  RateLimiter.record(norm.type);
  const zi = ZIndexManager.acquire(norm.type === "modal" ? "modal" : "overlay", { id: norm.id });
  if (zi.ok && !norm.config.zIndex) norm.config.zIndex = zi.zIndex;
  const result = Manager.open(norm);
  if (result.ok) {
    CircuitBreaker.recordSuccess("open");
    MetricsCollector.recordOpen(result.id, norm.type, { scope: norm.scope, template: descriptor.template });
    Tracker.trackOpen(result.id, norm.type, norm.scope || "global");
    syncWithContextProvider();
    DebugPanel.logEvent("OPEN", { id: result.id, type: norm.type });
    if (LifecycleHooks.hasHooks("afterOpen")) LifecycleHooks.execute("afterOpen", { overlay: norm, result, id: result.id });
  } else {
    CircuitBreaker.recordFailure("open", { errors: result.errors });
    MetricsCollector.recordError(norm.type, result.errors?.[0], { operation: "open" });
  }
  MetricsCollector.endTiming(timing);
  return result;
}, { operation: "open" });
const update = (id, patch) => {
  const overlay = Store.getOverlay(id);
  if (!overlay) return { ok: false, error: "not-found" };
  if (LifecycleHooks.hasHooks("beforeUpdate")) {
    const hr = LifecycleHooks.executeSync("beforeUpdate", { id, patch, overlay });
    if (hr.cancelled) return { ok: false, cancelled: true, reason: hr.cancelReason };
    if (hr.modifiedContext?.patch) patch = hr.modifiedContext.patch;
  }
  const updated = Store.updateOverlayRuntime(id, patch);
  if (updated) {
    syncWithContextProvider();
    if (LifecycleHooks.hasHooks("afterUpdate")) LifecycleHooks.executeSync("afterUpdate", { id, patch });
    return { ok: true, id };
  }
  return { ok: false, error: "update-failed" };
};
const close = ErrorBoundary.boundary(async (id, reason = "manual", options = {}) => {
  const timing = MetricsCollector.startTiming("close");
  const overlay = Store.getOverlay(id);
  if (LifecycleHooks.hasHooks("beforeClose")) {
    const hr = await LifecycleHooks.execute("beforeClose", { id, reason });
    if (hr.cancelled) return { ok: false, cancelled: true, reason: hr.cancelReason };
  }
  if (overlay?.config?.trapFocus !== false) FocusManager.release({ restoreFocus: overlay?.config?.restoreFocus !== false });
  if (overlay?.config?.zIndex) ZIndexManager.release(id);
  const result = Manager.close(id, reason);
  if (result.ok) {
    const duration = overlay?.runtime?.createdAt ? Date.now() - overlay.runtime.createdAt : 0;
    MetricsCollector.recordClose(id, overlay?.type, duration, reason);
    Tracker.trackClose(id, reason);
    syncWithContextProvider();
    DebugPanel.logEvent("CLOSE", { id, type: overlay?.type, reason });
    if (LifecycleHooks.hasHooks("afterClose")) LifecycleHooks.execute("afterClose", { id, reason, result });
  }
  MetricsCollector.endTiming(timing);
  return result;
}, { operation: "close" });
const closeAll = async (options = {}) => {
  if (LifecycleHooks.hasHooks("beforeCloseAll")) {
    const hr = await LifecycleHooks.execute("beforeCloseAll", { options });
    if (hr.cancelled) return { ok: false, cancelled: true };
  }
  FocusManager.release();
  const result = Manager.closeAll(options.reason || "closeAll");
  syncWithContextProvider();
  DebugPanel.logEvent("CLOSE_ALL", { count: result.closed?.length || 0 });
  if (LifecycleHooks.hasHooks("afterCloseAll")) LifecycleHooks.execute("afterCloseAll", { options, result });
  return result;
};
const closeMany = async (filter, reason = "closeMany") => {
  if (LifecycleHooks.hasHooks("beforeCloseMany")) {
    const hr = await LifecycleHooks.execute("beforeCloseMany", { filter, reason });
    if (hr.cancelled) return { ok: false, cancelled: true };
  }
  const result = Manager.closeMany(filter, reason);
  if (result.ok && result.count > 0) {
    syncWithContextProvider();
    DebugPanel.logEvent("CLOSE_MANY", { count: result.count });
  }
  if (LifecycleHooks.hasHooks("afterCloseMany")) LifecycleHooks.execute("afterCloseMany", { filter, reason, result });
  return result;
};
const findMany = (filter) => Manager.findMany(filter);
const countMany = (filter) => Manager.countMany(filter);
const getStack = (filter) => {
  const stack = Store.getStack();
  if (!filter) return stack;
  const overlays = Store.getOverlays();
  return stack.filter((id) => {
    const o = overlays[id];
    return o && (!filter.type || o.type === filter.type) && (!filter.scope || o.scope === filter.scope);
  });
};
const getTop = (scope) => _getTopOverlay(scope);
const hasBlocking = (scope) => {
  if (!scope) return _hasBlockingOverlay();
  const stack = Store.getStack();
  const overlays = Store.getOverlays();
  return stack.some((id) => {
    const o = overlays[id];
    return o?.scope === scope && (o?.config?.blocking || o?.type === "modal");
  });
};
const onChange = (handler) => Store.subscribe(handler);
export {
  MODULE_ID,
  VERSION,
  _getTopOverlay,
  _hasBlockingOverlay,
  close,
  closeAll,
  closeMany,
  countMany,
  findMany,
  getStack,
  getTop,
  hasBlocking,
  onChange,
  open,
  update
};
