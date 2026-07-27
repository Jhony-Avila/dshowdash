// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.2.0-P22-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-10.core.lifecycle
// PURPOSE: Panel-10 - Lifecycle Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   PAINEL_ID, VERSION as PANEL_VERSION, STATES from ./constants.js
//   PANEL_EVENTS, PANEL_INTENTS from /core/runtime/events/catalog/panels.events.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   createLifecycleManager() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   event
// LISTENS (eventos):
//   event
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { PAINEL_ID, VERSION as PANEL_VERSION, STATES } from './constants.js';
import { PANEL_EVENTS, PANEL_INTENTS } from '/core/runtime/events/catalog/panels.events.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-10.core.lifecycle';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

function _ebEmit(event: string, data?: Record<string, unknown>) { const eb = _getPort('eventBus'); if (eb && eb.emit) eb.emit(event, data || {}); }
function _ebOn(event: string, handler: (...args: unknown[]) => void) { const eb = _getPort('eventBus'); if (eb && eb.on) eb.on(event, handler); }
function _ebOff(event: string, handler: (...args: unknown[]) => void) { const eb = _getPort('eventBus'); if (eb && eb.off) eb.off(event, handler); }

type LoggerLike = { debug: (e: string, d?: Record<string, unknown>) => void; info: (e: string, d?: Record<string, unknown>) => void; warn: (e: string, d?: Record<string, unknown>) => void; error: (e: string, d?: Record<string, unknown>) => void };
type TelemetryLike = { trackError: (err: Error, ctx: string) => void };
type StoreLike = { reset: () => void };
type ApiClientLike = { cancel: () => void };
type AbortControllerRef = { current: AbortController | null };
type EmitFn = (event: string, data?: Record<string, unknown>) => void;

function createLifecycleManager(context: Record<string, unknown>) {
  const logger = context.logger as LoggerLike;
  const telemetry = context.telemetry as TelemetryLike;
  const store = context.store as StoreLike;
  const apiClient = context.apiClient as ApiClientLike;
  const abortControllerRef = context.abortControllerRef as AbortControllerRef;
  const emit = context.emit as EmitFn;

  return {
    setState(instance: Record<string, unknown>, newState: string) { const oldState = instance.state; instance.state = newState; if (instance.container) (instance.container as HTMLElement).setAttribute('data-state', newState); logger.debug('state.transition', { from: oldState as string, to: newState }); },

    performMount(instance: Record<string, unknown>, container: HTMLElement, deps: Record<string, unknown>, callbacks: Record<string, () => unknown>) {
      const self = this;
      const renderStructure = callbacks.renderStructure;
      const setupStateSubscription = callbacks.setupStateSubscription;
      const setupEventListeners = callbacks.setupEventListeners;
      const startAutoRefresh = callbacks.startAutoRefresh;
      const loadData = callbacks.loadData;
      const mountStart = performance.now();

      if (instance.mounted || instance.state !== STATES.IDLE) { logger.warn('mount.skipped', { reason: 'already-mounted', state: instance.state }); return Promise.resolve(false); }
      if (!container || !(container instanceof HTMLElement)) { logger.error('mount.invalid-container'); return Promise.reject(new Error(`[${PAINEL_ID}] Container inválido`)); }

      _initPorts();
      self.setState(instance, STATES.MOUNTING);
      emit(PANEL_EVENTS.MOUNTING);

      return Promise.resolve().then(() => {
        logger.debug('mount.start', { version: PANEL_VERSION });
        instance.container = container;
        (instance.container as HTMLElement).setAttribute('data-panel-id', PAINEL_ID);
        (instance.container as HTMLElement).setAttribute('data-version', PANEL_VERSION);
        (instance.container as HTMLElement).setAttribute('data-state', instance.state as string);
        abortControllerRef.current = new AbortController();
        instance.consecutiveErrors = 0;
        instance.isDegraded = false;
        instance.currentRequestId = 0;
        instance.activeLoadRequest = null;
        renderStructure();
        return setupStateSubscription();
      }).then(() => {
        setupEventListeners();
        return loadData();
      }).then(() => {
        startAutoRefresh();
        instance.mounted = true;
        self.setState(instance, STATES.MOUNTED);
        const metrics = instance.performanceMetrics as { mountTime: number; toFixed?: (n: number) => string };
        metrics.mountTime = performance.now() - mountStart;
        logger.debug('mount.success', { mountTime: `${(metrics.mountTime).toFixed(2)}ms` });
        emit(PANEL_EVENTS.MOUNTED, { panelId: PAINEL_ID, version: PANEL_VERSION, mountTime: metrics.mountTime });
        _ebEmit(PANEL_EVENTS.LOADED, { panelId: PAINEL_ID });
        return true;
      }).catch((error: Error) => {
        self.setState(instance, STATES.ERROR);
        logger.error('mount.failed', { error: error.message });
        telemetry.trackError(error, 'mount');
        throw error;
      });
    },

    performUnmount(instance: Record<string, unknown>, callbacks: Record<string, () => unknown>) {
      const self = this;
      const stopAutoRefresh = callbacks.stopAutoRefresh;
      const destroyUI = callbacks.destroyUI;

      if (instance.destroyed || instance.state === STATES.DESTROYED) { logger.warn('unmount.skipped', { reason: 'already-destroyed' }); return Promise.resolve(false); }

      self.setState(instance, STATES.UNMOUNTING);
      emit(PANEL_EVENTS.UNMOUNTING);
      logger.debug('unmount.start');

      return Promise.resolve().then(() => {
        if (abortControllerRef.current) { abortControllerRef.current.abort(); abortControllerRef.current = null; }
        stopAutoRefresh();
        apiClient.cancel();
        const unsubscribers = instance.unsubscribers as (() => void)[];
        for (let i = 0; i < unsubscribers.length; i++) { try { unsubscribers[i](); } catch (e) {} }
        instance.unsubscribers = [];
        if (instance._filteredRefreshHandler) { _ebOff(PANEL_INTENTS.REFRESH, instance._filteredRefreshHandler as (...args: unknown[]) => void); }
        return destroyUI();
      }).then(() => {
        store.reset();
        if (instance.container) { (instance.container as HTMLElement).innerHTML = ''; (instance.container as HTMLElement).removeAttribute('data-panel-id'); (instance.container as HTMLElement).removeAttribute('data-version'); (instance.container as HTMLElement).removeAttribute('data-state'); instance.container = null; }
        instance.mounted = false;
        instance.destroyed = true;
        instance.cssLoaded = false;
        instance.consecutiveErrors = 0;
        instance.isDegraded = false;
        instance.currentRequestId = 0;
        instance.activeLoadRequest = null;
        self.setState(instance, STATES.DESTROYED);
        logger.debug('unmount.success');
        const pm = instance.performanceMetrics as { totalRequests: number; failedRequests: number };
        emit(PANEL_EVENTS.UNMOUNTED, { panelId: PAINEL_ID, totalRequests: pm.totalRequests, failedRequests: pm.failedRequests });
        _ebEmit(PANEL_EVENTS.UNMOUNTED, { panelId: PAINEL_ID });
        return true;
      }).catch((error: Error) => { logger.error('unmount.failed', { error: error.message }); throw error; });
    }
  };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), p22Compliant: true }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), checks: { lifecycleReady: true }, p22Compliant: true, timestamp: new Date().toISOString() }; }

export { createLifecycleManager };
export default { createLifecycleManager, MODULE_ID, VERSION, info, healthCheck, injectPorts, getPorts };
