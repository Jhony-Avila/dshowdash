// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: overlay-layer/core/operations
// PURPOSE: Core overlay operations (open, update, close, closeAll, closeMany) + query helpers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   Store from ../state/store.js
//   Manager from ./manager.js
//   Tracker from ../telemetry/tracker.js
//   OverlayKernel from ../kernel/index.js
//   SchemaValidator from ../utils/schema-validator.js
//   RateLimiter from ../kernel/rate-limiter.js
//   CircuitBreaker from ../kernel/circuit-breaker.js
//   LifecycleHooks from ./lifecycle-hooks/index.js
//   PendingQueue from ../kernel/pending-queue/index.js
//   TemplateRegistry from ./template-registry/index.js
//   FocusManager from ../ui/focus-manager.js
//   ZIndexManager from ../ui/zindex-manager.js
//   MetricsCollector from ../telemetry/metrics-collector.js
//   ErrorBoundary from ./error-boundary/index.js
//   DebugPanel from ../devtools/debug-panel.js
//   syncWithContextProvider, _retryState from ./integrations.js
//
// PROVIDES:
//   open(), update(), close(), closeAll(), closeMany() — core CRUD operations
//   findMany(), countMany(), getStack(), getTop(), hasBlocking(), onChange() — query helpers
//
// RECEIVES (via imports): syncWithContextProvider, _retryState from integrations
// WINDOW ACCESS: (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import Store from '../state/store.js';
import * as Manager from './manager.js';
import * as Tracker from '../telemetry/tracker.js';
import * as OverlayKernel from '../kernel/index.js';

import * as SchemaValidator from '../utils/schema-validator.js';
import * as RateLimiter from '../kernel/rate-limiter.js';
import * as CircuitBreaker from '../kernel/circuit-breaker.js';
import * as LifecycleHooks from './lifecycle-hooks/index.js';
import * as PendingQueue from '../kernel/pending-queue/index.js';
import * as TemplateRegistry from './template-registry/index.js';
import * as FocusManager from '../ui/focus-manager.js';
import * as ZIndexManager from '../ui/zindex-manager.js';
import * as _MetricsCollector from '../telemetry/metrics-collector.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;
const MetricsCollector = _MetricsCollector as any;
import * as ErrorBoundary from './error-boundary/index.js';
import * as DebugPanel from '../devtools/debug-panel.js';

import { syncWithContextProvider, _retryState } from './integrations.js';


export const MODULE_ID = 'overlay-layer.core.operations';

export const VERSION = '1.0.0-ENTERPRISE';

// ── Helpers ─────────────────────────────────────────────────
export const _hasBlockingOverlay = () => {
  const stack = Store.getStack();
  const overlays = Store.getOverlays();
  return stack.some(id => { const o = (overlays as DynObj)[id]; return o?.config?.blocking === true || o?.type === 'modal'; });
};

export const _getTopOverlay = (scope?: DynObj) => {
  const stack = Store.getStack();
  const overlays = Store.getOverlays();
  if (stack.length === 0) return null;
  if (scope) { for (let i = stack.length - 1; i >= 0; i--) { if ((overlays as DynObj)[stack[i]]?.scope === scope) return (overlays as DynObj)[stack[i]]; } return null; }
  return (overlays as DynObj)[stack[stack.length - 1]] || null;
};

// ── Open ────────────────────────────────────────────────────
export const open = ErrorBoundary.boundary(async (descriptor: Record<string, unknown>, options: Record<string, unknown> = {}) => {
  const timing = MetricsCollector.startTiming('open');

  // Template resolution
  if (descriptor.template && !options.templateResolved) {
    const tpl = TemplateRegistry.apply(descriptor.template as string, descriptor);
    if (!tpl.ok) return { ok: false, error: 'template-not-found', template: descriptor.template };
    descriptor = tpl.descriptor;
    options.templateResolved = true;
  }

  // Lifecycle hooks
  if (LifecycleHooks.hasHooks('beforeOpen')) {
    const hr = await LifecycleHooks.execute('beforeOpen', { descriptor, options });
    if (hr.cancelled) return { ok: false, cancelled: true, reason: hr.cancelReason };
    if (hr.modifiedContext?.descriptor) descriptor = (hr.modifiedContext as Record<string, unknown>).descriptor as Record<string, unknown>;
  }

  // Circuit breaker check
  if (!options.bypassCircuitBreaker) {
    const cb = CircuitBreaker.isAllowed('open');
    if (!cb.allowed) {
      if (!options.bypassQueue && PendingQueue.isEnabled()) {
        const eq = PendingQueue.enqueue(descriptor, 'circuit-breaker', { openOptions: options });
        if (eq.ok) { MetricsCollector.recordQueued(descriptor.type, 'circuit-breaker'); return { ok: false, queued: true, queueId: eq.queueId }; }
      }
      MetricsCollector.recordBlocked(descriptor.type, 'circuit-breaker');
      return { ok: false, circuitBreakerOpen: true, reason: cb.reason };
    }
  }

  // Schema validation
  const validation = SchemaValidator.validate(descriptor);
  if (!validation.valid) { CircuitBreaker.recordFailure('open', { type: 'validation' }); return { ok: false, errors: validation.errors }; }
  const norm = validation.normalized;

  // Rate limiter
  if (!options.bypassRateLimit) {
    const rl = RateLimiter.isAllowed(norm.type);
    if (!rl.allowed) {
      if (!options.bypassQueue && PendingQueue.isEnabled()) {
        const eq = PendingQueue.enqueue(norm, 'rate-limited', { openOptions: options });
        if (eq.ok) { MetricsCollector.recordQueued(norm.type, 'rate-limited'); return { ok: false, queued: true, queueId: eq.queueId }; }
      }
      MetricsCollector.recordBlocked(norm.type, 'rate-limited');
      return { ok: false, rateLimited: true, reason: rl.reason };
    }
  }

  // Kernel check
  if (_retryState.kernelIntegrated && !options.bypassKernelCheck) {
    const can = OverlayKernel.canOpenOverlay(norm.type, { scope: norm.scope || 'global' });
    if (!can.allowed) {
      if (!options.bypassQueue && PendingQueue.isEnabled()) {
        const eq = PendingQueue.enqueue(norm, can.reason, { openOptions: options });
        if (eq.ok) { MetricsCollector.recordQueued(norm.type, can.reason); return { ok: false, queued: true, queueId: eq.queueId }; }
      }
      MetricsCollector.recordBlocked(norm.type, can.reason);
      return { ok: false, blocked: true, reason: can.reason };
    }
  }

  RateLimiter.record(norm.type);

  // Z-index
  const zi = ZIndexManager.acquire(norm.type === 'modal' ? 'modal' : 'overlay', { id: norm.id });
  if (zi.ok && !norm.config.zIndex) norm.config.zIndex = zi.zIndex;

  const result = Manager.open(norm);

  if (result.ok) {
    CircuitBreaker.recordSuccess('open');
    MetricsCollector.recordOpen(result.id, norm.type, { scope: norm.scope, template: descriptor.template });
    Tracker.trackOpen(result.id, norm.type, norm.scope || 'global');
    syncWithContextProvider();
    DebugPanel.logEvent('OPEN', { id: result.id, type: norm.type });
    if (LifecycleHooks.hasHooks('afterOpen')) LifecycleHooks.execute('afterOpen', { overlay: norm, result, id: result.id });
  } else {
    CircuitBreaker.recordFailure('open', { errors: result.errors });
    MetricsCollector.recordError(norm.type, result.errors?.[0], { operation: 'open' });
  }

  MetricsCollector.endTiming(timing);
  return result;
}, { operation: 'open' });

// ── Update ──────────────────────────────────────────────────
export const update = (id: DynObj, patch: DynObj) => {
  const overlay = Store.getOverlay(id);
  if (!overlay) return { ok: false, error: 'not-found' };
  if (LifecycleHooks.hasHooks('beforeUpdate')) {
    const hr = LifecycleHooks.executeSync('beforeUpdate', { id, patch, overlay });
    if (hr.cancelled) return { ok: false, cancelled: true, reason: hr.cancelReason };
    if (hr.modifiedContext?.patch) patch = hr.modifiedContext.patch;
  }
  const updated = Store.updateOverlayRuntime(id, patch);
  if (updated) { syncWithContextProvider(); if (LifecycleHooks.hasHooks('afterUpdate')) LifecycleHooks.executeSync('afterUpdate', { id, patch }); return { ok: true, id }; }
  return { ok: false, error: 'update-failed' };
};

// ── Close ───────────────────────────────────────────────────
export const close = ErrorBoundary.boundary(async (id: string, reason = 'manual', options: Record<string, unknown> = {}) => {
  const timing = MetricsCollector.startTiming('close');
  const overlay = Store.getOverlay(id);

  if (LifecycleHooks.hasHooks('beforeClose')) {
    const hr = await LifecycleHooks.execute('beforeClose', { id, reason });
    if (hr.cancelled) return { ok: false, cancelled: true, reason: hr.cancelReason };
  }

  if (overlay?.config?.trapFocus !== false) FocusManager.release({ restoreFocus: overlay?.config?.restoreFocus !== false });
  if (overlay?.config?.zIndex) ZIndexManager.release(id as DynObj);

  const result = Manager.close(id, reason);

  if (result.ok) {
    const duration = overlay?.runtime?.createdAt ? Date.now() - overlay.runtime.createdAt : 0;
    MetricsCollector.recordClose(id, overlay?.type, duration, reason);
    Tracker.trackClose(id, reason);
    syncWithContextProvider();
    DebugPanel.logEvent('CLOSE', { id, type: overlay?.type, reason });
    if (LifecycleHooks.hasHooks('afterClose')) LifecycleHooks.execute('afterClose', { id, reason, result });
  }

  MetricsCollector.endTiming(timing);
  return result;
}, { operation: 'close' });

// ── CloseAll ────────────────────────────────────────────────
export const closeAll = async (options: { reason?: string } = {}) => {
  if (LifecycleHooks.hasHooks('beforeCloseAll')) { const hr = await LifecycleHooks.execute('beforeCloseAll', { options }); if (hr.cancelled) return { ok: false, cancelled: true }; }
  FocusManager.release();
  const result = Manager.closeAll(options.reason || 'closeAll');
  syncWithContextProvider();
  DebugPanel.logEvent('CLOSE_ALL', { count: result.closed?.length || 0 });
  if (LifecycleHooks.hasHooks('afterCloseAll')) LifecycleHooks.execute('afterCloseAll', { options, result });
  return result;
};

// ── CloseMany ───────────────────────────────────────────────
export const closeMany = async (filter: DynObj, reason = 'closeMany') => {
  if (LifecycleHooks.hasHooks('beforeCloseMany')) { const hr = await LifecycleHooks.execute('beforeCloseMany', { filter, reason }); if (hr.cancelled) return { ok: false, cancelled: true }; }
  const result = Manager.closeMany(filter, reason);
  if (result.ok && result.count > 0) { syncWithContextProvider(); DebugPanel.logEvent('CLOSE_MANY', { count: result.count }); }
  if (LifecycleHooks.hasHooks('afterCloseMany')) LifecycleHooks.execute('afterCloseMany', { filter, reason, result });
  return result;
};

// ── Query Helpers ───────────────────────────────────────────
export const findMany = (filter: DynObj) => Manager.findMany(filter);
export const countMany = (filter: DynObj) => Manager.countMany(filter);

export const getStack = (filter: DynObj) => {
  const stack = Store.getStack();
  if (!filter) return stack;
  const overlays = Store.getOverlays();
  return stack.filter(id => { const o = (overlays as DynObj)[id]; return o && (!filter.type || o.type === filter.type) && (!filter.scope || o.scope === filter.scope); });
};

export const getTop = (scope: DynObj) => _getTopOverlay(scope);

export const hasBlocking = (scope: DynObj) => {
  if (!scope) return _hasBlockingOverlay();
  const stack = Store.getStack();
  const overlays = Store.getOverlays();
  return stack.some(id => { const o = (overlays as DynObj)[id]; return o?.scope === scope && (o?.config?.blocking || o?.type === 'modal'); });
};

export const onChange = (handler: DynObj) => Store.subscribe(handler);
