// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-EVENT-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: error-handler
// PURPOSE: Container-Main Error Handler - Tratamento de erros centralizado
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   logFromErrorHandler, createLogger from ./logger.js
//   ERROR_EVENT_NAMES from /core/runtime/constants/event-names.js
//   VERSION, MODULE_ID, ERROR_SEVERITY, ERROR_CATEGORIES, RECOVERY_ACTIONS, creat...
//
// PROVIDES:
//   injectEventBus() — exported function
//   install() — exported function
//   withErrorBoundary() — exported function
//   withAsyncErrorBoundary() — exported function
//   tryCatch() — exported function
//   createComponentBoundary() — exported function
//   createErrorHandler() — exported function
//   getErrorLog() — exported function
//   clearErrorLog() — exported function
//   getMetrics() — exported function
//   resetMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//   ERROR_SEVERITY — exported value
//   ERROR_CATEGORIES — exported value
//   RECOVERY_ACTIONS — exported value
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   ERROR_EVENT_NAMES.LOGGED
//   event
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { logFromErrorHandler, createLogger } from './logger.js';
import { ERROR_EVENT_NAMES } from '/core/runtime/constants/event-names.js';
import {
  VERSION, MODULE_ID,
  ERROR_SEVERITY, ERROR_CATEGORIES, RECOVERY_ACTIONS,
  createErrorStore,
  createMetricsTracker,
  createGlobalInstaller,
  createWrappers,
  createComponentBoundaryFactory
} from './error-handler/index.js';

export { VERSION, MODULE_ID, ERROR_SEVERITY, ERROR_CATEGORIES, RECOVERY_ACTIONS };

const _logger = createLogger(MODULE_ID);

let _eventBus: Record<string, unknown> | null = null;

const emitter = {
  emit(event: string, data: Record<string, unknown>) {
    if (_eventBus?.emit) {
      (_eventBus.emit as (...args: unknown[]) => unknown)(event, { ...data, source: MODULE_ID, timestamp: Date.now() });
    }
  }
};

const metricsTracker = createMetricsTracker();

const errorStore = createErrorStore({
  logCallback: (errorInfo: unknown) => {
    logFromErrorHandler((errorInfo as Record<string, unknown>));
    emitter.emit(ERROR_EVENT_NAMES.LOGGED, { errorInfo });
  }
});

const globalInstaller = createGlobalInstaller({
  errorStore, metricsTracker, emitter, logger: _logger
});

const wrappers = createWrappers({
  errorStore, metricsTracker, emitter, globalInstaller
});

const componentBoundaryFactory = createComponentBoundaryFactory({
  wrappers, errorStore, logger: _logger
});

export function injectEventBus(eventBus: unknown) { _eventBus = eventBus as Record<string, unknown>; }

export function install(options: Record<string, unknown> = {}) {
  if (options.eventBus) _eventBus = options.eventBus as Record<string, unknown>;
  globalInstaller.install(options);
}

export function withErrorBoundary(fn: (...args: unknown[]) => void, options: Record<string, unknown> = {}) { return wrappers.withErrorBoundary(fn, options); }
// @ts-expect-error TS migration - TS2345
export function withAsyncErrorBoundary(asyncFn: unknown, options: Record<string, unknown> = {}) { return wrappers.withAsyncErrorBoundary(asyncFn, options); }
export function tryCatch(fn: (...args: unknown[]) => void, options: Record<string, unknown> = {}) { return wrappers.tryCatch(fn, options); }
// @ts-expect-error TS migration - TS2345
export async function tryCatchAsync(asyncFn: unknown, options: Record<string, unknown> = {}) { return wrappers.tryCatchAsync(asyncFn, options); }
export function createComponentBoundary(componentId: string, options: Record<string, unknown> = {}) { return componentBoundaryFactory.create(componentId, options); }

export function createErrorHandler(moduleId: string) {
  return {
    handle: (error: Record<string, unknown>, context: Record<string, unknown> = {}) => {
      const errorInfo = errorStore.createErrorInfo(error, { ...context, moduleId });
      errorInfo.handled = true;
      metricsTracker.track(errorInfo);
      errorStore.log(errorInfo);
      return errorInfo;
    },
    wrap: (fn: (...args: unknown[]) => void, opts: Record<string, unknown> = {}) => wrappers.withErrorBoundary(fn, { ...opts, moduleId }),
    wrapAsync: (fn: (...args: unknown[]) => void, opts: Record<string, unknown> = {}) => wrappers.withAsyncErrorBoundary(fn, { ...opts, moduleId }),
    tryCatch: (fn: (...args: unknown[]) => void, opts: Record<string, unknown> = {}) => wrappers.tryCatch(fn, { ...opts, context: { ...(opts.context as Record<string, unknown>), moduleId } }),
    // @ts-expect-error TS migration - TS2345
    tryCatchAsync: (fn: (...args: unknown[]) => void, opts: Record<string, unknown> = {}) => wrappers.tryCatchAsync(fn, { ...opts, context: { ...(opts.context as Record<string, unknown>), moduleId } })
  };
}

export function getErrorLog(options: Record<string, unknown> = {}) { return errorStore.getLog(options); }
export function clearErrorLog() { return errorStore.clear(); }
export function getMetrics() { return metricsTracker.getMetrics(); }
export function resetMetrics() { metricsTracker.reset(); }

export function healthCheck() {
  const recentErrors = errorStore.getRecent(60000).length;
  const criticalErrors = errorStore.getCritical(300000, ERROR_SEVERITY.CRITICAL).length;
  const metrics = metricsTracker.getMetrics();
  let status = 'HEALTHY';
  if (criticalErrors > 0) status = 'CRITICAL';
  else if (recentErrors > 10) status = 'WARNING';
  else if (metrics.unhandled > metrics.handled) status = 'DEGRADED';
  return { status, version: VERSION, moduleId: MODULE_ID, modular: true, metrics, recentErrors, criticalErrors, logSize: errorStore.size() };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, modular: true, categories: Object.keys(ERROR_CATEGORIES), severities: Object.keys(ERROR_SEVERITY), recoveryActions: Object.keys(RECOVERY_ACTIONS), metrics: metricsTracker.getMetrics() };
}

export default {
  VERSION, MODULE_ID, ERROR_SEVERITY, ERROR_CATEGORIES, RECOVERY_ACTIONS,
  install, injectEventBus, withErrorBoundary, withAsyncErrorBoundary,
  tryCatch, tryCatchAsync, createComponentBoundary, createErrorHandler,
  getErrorLog, clearErrorLog, getMetrics, resetMetrics, healthCheck, info
};
