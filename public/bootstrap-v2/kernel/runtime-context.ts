
// Runtime Context - Contrato Global do Runtime Kernel
// @version 3.7.0-STRICT-MODE
// @changelog v3.7.0-STRICT-MODE: Migração para strict mode (NR-FULL)
// @changelog v3.6.0-STEP8: Fase 2 — getInstance() expoe RuntimeContext via windowAdapter.expose() + window fallback
// @changelog v3.5.0-HEALTH-CONTRACT: healthCheck migrado para HEALTH CONTRACT v1.0.0 (createHealthResult + HEALTH_STATUS)
// @changelog v3.4.0-DOMAIN-PURE - Auth queries via _resolveAuthProvider() (elimina window.SessionManager/CoreAuthAdapter/AppContext direto)
// @changelog v3.3.0-DOMAIN-PURE - _getEventBus() prioriza kernel.getEventBus() → windowAdapter → window fallback (cadeia AAA)
// @changelog v3.2.0-EARLY-BOOT-LOGGER - Migração: console.* → createEarlyLogger para pipeline de logging unificado
// @changelog v3.1.0-REPLAY - Integrar payload-contracts para criacao de payloads tipados
// @changelog v3.0.0-REPLAY - Melhoria #04: Event Replay para componentes lazy-loaded
// @changelog v2.0.0-P2 - Emite RUNTIME_CONTEXT_UPDATED via EventBus para componentes externos
// @changelog v1.0.0-P0 - Criacao inicial com queries read-only
// @description Contexto unico consumivel por Feature Kernels (ex: CORE)
// @rule CORE consome, nunca altera
// @rule Eventos do CORE sao sinais, nao decisoes
// @contract STRICT_MODE - Em modo strict, sem fallback para window.*
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v3.6.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   createHealthResult, HEALTH_STATUS from contracts/health-contract.ts
// RECEIVES: kernel instance via createRuntimeContext(kernel)
// RESOLVES EventBus via chain:
//   1. kernel.getEventBus()        — injeção preferida
//   2. windowAdapter.get('EventBus') — adapter layer
//   3. window.EventBus             — último fallback (legítimo nesta camada)
// RESOLVES auth providers via _resolveAuthProvider():
//   SessionManager, CoreAuthAdapter, AppContext — via windowAdapter → window fallback
// EXPOSES:
//   windowAdapter.expose('RuntimeContext') — canal oficial (Fase 2 Step 8)
//   window.RuntimeContext                 — backward compat fallback
//   document.body.dataset                 — auth check DOM
// ═══════════════════════════════════════════════════════════════
'use strict';

import { KERNEL_MODES, KERNEL_EVENTS, CAPABILITIES } from './constants.js';
import { createUpdatedPayload, createReadyPayload } from '/core/runtime/constants/payload-contracts.js';
import { createEarlyLogger } from '/core/runtime/early-boot-logger.js';
import { createHealthResult, HEALTH_STATUS } from '../contracts/health-contract.ts';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';

export var VERSION = '3.7.0-STRICT-MODE';
export var MODULE_ID = 'runtime-context';

// v3.2.0: Early Boot Logger - buffer + replay no Logger Enterprise
var _earlyLog = createEarlyLogger(MODULE_ID);

// Eventos formais para notificar componentes externos
export var RUNTIME_CONTEXT_EVENTS = Object.freeze({
  READY: 'kernel.runtime-context.ready',
  UPDATED: 'kernel.runtime-context.updated'
});

// ═══════════════════════════════════════════════════════════════
// RUNTIME CONTEXT FACTORY
// ═══════════════════════════════════════════════════════════════

interface KernelInstance {
  getMode?: () => string;
  getSnapshot?: () => Record<string, unknown>;
  isReady?: () => boolean;
  isDegraded?: () => boolean;
  isInMaintenance?: () => boolean;
  isFailed?: () => boolean;
  isInRecovery?: () => boolean;
  isCapabilityEnabled?: (cap: string) => boolean;
  canNavigate?: () => boolean;
  canAuthenticate?: () => boolean;
  canShowUI?: () => boolean;
  getHealth?: () => Record<string, unknown>;
  getHealthScore?: () => number;
  isHealthy?: () => boolean;
  getEventBus?: () => EventBusInstance | null;
  on?: (event: string, handler: (data: Record<string, unknown>) => void) => (() => void);
  [key: string]: unknown;
}

interface EventBusInstance {
  emit?: (event: string, data: Record<string, unknown>) => void;
  [key: string]: unknown;
}

interface RuntimeSnapshot {
  mode: string;
  phase: string;
  ready: boolean;
  degraded: boolean;
  maintenance: boolean;
  failed: boolean;
  recovery: boolean;
  authenticated: boolean;
  authLevel: number;
  health: Record<string, unknown>;
  healthScore: number;
  healthy: boolean;
  capabilities: { navigate: boolean; authenticate: boolean; showUI: boolean };
  timestamp: number;
  [key: string]: unknown;
}

interface RuntimeEventData {
  source?: string;
  version?: string;
  timestamp?: number;
  snapshot?: RuntimeSnapshot;
  [key: string]: unknown;
}

interface EventHistoryEntry {
  type: string;
  data: RuntimeEventData;
  timestamp: number;
}

type RuntimeSubscriber = (snapshot: RuntimeSnapshot, meta?: Record<string, unknown>) => void;

interface SubscribeWithReplayOptions {
  replayReady?: boolean;
  replayLastUpdate?: boolean;
}

export function createRuntimeContext(kernel: KernelInstance) {
  if (!kernel) {
    throw new Error('[RuntimeContext] Kernel instance is required');
  }

  var _kernel = kernel;
  var _subscribers: RuntimeSubscriber[] = [];
  var _lastSnapshot: RuntimeSnapshot | null = null;
  var _eventBus: EventBusInstance | null = null;
  var _isReady = false;

  // #04: Event Replay - armazena ultimo evento para replay
  var _lastReadyEvent: RuntimeEventData | null = null;
  var _lastUpdatedEvent: RuntimeEventData | null = null;
  var _eventHistory: EventHistoryEntry[] = [];
  var _maxHistorySize = 10;

  // v3.7.0: Resolver EventBus via cadeia AAA com strict mode
  // @contract STRICT_MODE - Em modo strict, sem fallback para window.*
  function _getEventBus() {
    if (_eventBus) return _eventBus;
    var strictMode = isStrict();

    // 1. kernel.getEventBus() — injeção preferida
    if (_kernel.getEventBus) {
      _eventBus = _kernel.getEventBus();
    }
    // 2. windowAdapter.get('EventBus') — adapter layer
    if (!_eventBus && typeof window !== 'undefined' && window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
      _eventBus = window.Core.windowAdapter.get('EventBus');
    }

    // Em modo strict, não usa fallback
    if (strictMode) return _eventBus;

    // 3. window.EventBus — último fallback (legacy)
    if (!_eventBus && typeof window !== 'undefined' && window.EventBus) {
      recordViolation('WINDOW_EVENTBUS_FALLBACK', { module: MODULE_ID, method: '_getEventBus' });
      _eventBus = window.EventBus;
    }
    return _eventBus;
  }

  // v3.7.0: Resolver auth providers via windowAdapter com strict mode
  // @contract STRICT_MODE - Em modo strict, sem fallback para window.*
  function _resolveAuthProvider(name: string) {
    if (typeof window === 'undefined') return null;
    var strictMode = isStrict();

    // 1. windowAdapter.get() — adapter layer
    if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
      var resolved = window.Core.windowAdapter.get(name);
      if (resolved) return resolved;
    }

    // Em modo strict, não usa fallback
    if (strictMode) return null;

    // 2. window[name] — último fallback (legacy)
    if ((window as unknown as Record<string, unknown>)[name]) {
      recordViolation('WINDOW_' + name.toUpperCase() + '_FALLBACK', { module: MODULE_ID, method: '_resolveAuthProvider' });
      return (window as unknown as Record<string, unknown>)[name];
    }
    return null;
  }

  // Emitir evento via EventBus para componentes externos
  function _emitToEventBus(eventName: string, data: Record<string, unknown>) {
    var eb = _getEventBus();
    var eventData = Object.assign({
      source: MODULE_ID,
      version: VERSION,
      timestamp: Date.now()
    }, data || {});

    // #04: Armazenar para replay
    if (eventName === RUNTIME_CONTEXT_EVENTS.READY) {
      _lastReadyEvent = eventData;
      _isReady = true;
    } else if (eventName === RUNTIME_CONTEXT_EVENTS.UPDATED) {
      _lastUpdatedEvent = eventData;
      _eventHistory.push({
        type: 'UPDATED',
        data: eventData,
        timestamp: Date.now()
      });
      if (_eventHistory.length > _maxHistorySize) {
        _eventHistory.shift();
      }
    }

    if (eb && eb.emit) {
      try {
        eb.emit(eventName, eventData);
      } catch (e: any) {
        _earlyLog.warn('EventBus emit failed: ' + e.message);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // #04: EVENT REPLAY API
  // ─────────────────────────────────────────────────────────────

  function replayReady(callback: (data: RuntimeEventData) => void) {
    if (!_lastReadyEvent || typeof callback !== 'function') {
      return false;
    }
    try {
      callback(_lastReadyEvent);
      return true;
    } catch (e: any) {
      _earlyLog.error('replayReady error: ' + e.message);
      return false;
    }
  }

  function replayLastUpdate(callback: (data: RuntimeEventData) => void) {
    if (!_lastUpdatedEvent || typeof callback !== 'function') {
      return false;
    }
    try {
      callback(_lastUpdatedEvent);
      return true;
    } catch (e: any) {
      _earlyLog.error('replayLastUpdate error: ' + e.message);
      return false;
    }
  }

  function subscribeWithReplay(callback: RuntimeSubscriber, options: SubscribeWithReplayOptions) {
    options = options || { replayReady: true, replayLastUpdate: true };

    var unsub = subscribe(callback);

    if (options.replayReady && _lastReadyEvent) {
      try {
        callback(getSnapshot(), { trigger: 'replay-ready', replayed: true });
      } catch (e: any) {
        _earlyLog.error('subscribeWithReplay ready error: ' + e.message);
      }
    } else if (options.replayLastUpdate && _lastUpdatedEvent) {
      try {
        // @ts-expect-error strict migration — TS2345
        callback(_lastUpdatedEvent.snapshot, { trigger: 'replay-update', replayed: true });
      } catch (e: any) {
        _earlyLog.error('subscribeWithReplay update error: ' + e.message);
      }
    }

    return unsub;
  }

  function getEventHistory(count: number) {
    count = count || 5;
    return _eventHistory.slice(-count);
  }

  function hasEmittedReady() {
    return _isReady;
  }

  // ─────────────────────────────────────────────────────────────
  // CORE QUERIES (read-only)
  // ─────────────────────────────────────────────────────────────

  function getMode() {
    return _kernel.getMode ? _kernel.getMode() : KERNEL_MODES.INITIALIZING;
  }

  function getPhase() {
    var snapshot = _kernel.getSnapshot ? _kernel.getSnapshot() : null;
    if (snapshot && snapshot.bootState) {
      var bootState = snapshot.bootState as Record<string, unknown>;
      if (bootState.phase) {
        return bootState.phase as string;
      }
    }
    return _kernel.isReady && _kernel.isReady() ? 'ready' : 'initializing';
  }

  function isReady() {
    return _kernel.isReady ? _kernel.isReady() : false;
  }

  function isDegraded() {
    return _kernel.isDegraded ? _kernel.isDegraded() : false;
  }

  function isInMaintenance() {
    return _kernel.isInMaintenance ? _kernel.isInMaintenance() : false;
  }

  function isFailed() {
    return _kernel.isFailed ? _kernel.isFailed() : false;
  }

  function isInRecovery() {
    return _kernel.isInRecovery ? _kernel.isInRecovery() : false;
  }

  // ─────────────────────────────────────────────────────────────
  // AUTH QUERIES (read-only)
  // v3.4.0: Auth providers via _resolveAuthProvider() — elimina window.* direto
  // ─────────────────────────────────────────────────────────────

  function isAuthenticated() {
    if (typeof window !== 'undefined') {
      var sm = _resolveAuthProvider('SessionManager');
      if (sm && sm.isAuthenticated) {
        return sm.isAuthenticated();
      }
      var authAdapter = _resolveAuthProvider('CoreAuthAdapter');
      if (authAdapter && authAdapter.isAuthenticated) {
        return authAdapter.isAuthenticated();
      }
      var appCtx = _resolveAuthProvider('AppContext');
      if (appCtx && appCtx.auth) {
        return !!appCtx.auth.authenticated;
      }
      if (document.body && document.body.dataset.authReady === 'true') {
        return true;
      }
    }
    return false;
  }

  function getAuthLevel() {
    if (typeof window !== 'undefined') {
      var sm = _resolveAuthProvider('SessionManager');
      if (sm && sm.getUser) {
        var user = sm.getUser();
        return user ? (user.level || 0) : 0;
      }
      var authAdapter = _resolveAuthProvider('CoreAuthAdapter');
      if (authAdapter && authAdapter.getLevel) {
        return authAdapter.getLevel();
      }
    }
    return 0;
  }

  // ─────────────────────────────────────────────────────────────
  // CAPABILITY QUERIES (read-only)
  // ─────────────────────────────────────────────────────────────

  function isCapabilityEnabled(capability: string) {
    return _kernel.isCapabilityEnabled ? _kernel.isCapabilityEnabled(capability) : false;
  }

  function canNavigate() {
    return _kernel.canNavigate ? _kernel.canNavigate() : false;
  }

  function canAuthenticate() {
    return _kernel.canAuthenticate ? _kernel.canAuthenticate() : false;
  }

  function canShowUI() {
    return _kernel.canShowUI ? _kernel.canShowUI() : false;
  }

  // ─────────────────────────────────────────────────────────────
  // HEALTH QUERIES (read-only)
  // ─────────────────────────────────────────────────────────────

  function getHealth() {
    return _kernel.getHealth ? _kernel.getHealth() : { status: 'UNKNOWN' };
  }

  function getHealthScore() {
    return _kernel.getHealthScore ? _kernel.getHealthScore() : 0;
  }

  function isHealthy() {
    return _kernel.isHealthy ? _kernel.isHealthy() : false;
  }

  // ─────────────────────────────────────────────────────────────
  // FEATURE PERMISSION CHECKS
  // ─────────────────────────────────────────────────────────────

  function canEnableFeature(featureConfig: Record<string, unknown>) {
    featureConfig = featureConfig || {};

    if (isInMaintenance()) {
      return { allowed: false, reason: 'System in maintenance mode' };
    }

    if (featureConfig.requiresReady !== false && !isReady()) {
      return { allowed: false, reason: 'System not ready (phase: ' + getPhase() + ')' };
    }

    if (featureConfig.requiresAuth && !isAuthenticated()) {
      return { allowed: false, reason: 'Authentication required' };
    }

    if (featureConfig.minLevel && getAuthLevel() < featureConfig.minLevel) {
      return { allowed: false, reason: 'Insufficient auth level: ' + getAuthLevel() + ' < ' + featureConfig.minLevel };
    }

    if (isFailed()) {
      return { allowed: false, reason: 'System in failed state' };
    }

    return { allowed: true };
  }

  function canAttemptRecovery() {
    var mode = getMode();

    if (mode === KERNEL_MODES.MAINTENANCE) {
      return { allowed: false, reason: 'Recovery blocked in maintenance mode' };
    }

    if (mode === KERNEL_MODES.RECOVERY) {
      return { allowed: false, reason: 'Already in recovery mode' };
    }

    if (mode === KERNEL_MODES.FAILED) {
      return { allowed: false, reason: 'System failed - manual intervention required' };
    }

    return { allowed: true };
  }

  // ─────────────────────────────────────────────────────────────
  // SNAPSHOT (read-only)
  // ─────────────────────────────────────────────────────────────

  function getSnapshot() {
    _lastSnapshot = {
      mode: getMode(),
      phase: getPhase(),
      ready: isReady(),
      degraded: isDegraded(),
      maintenance: isInMaintenance(),
      failed: isFailed(),
      recovery: isInRecovery(),
      authenticated: isAuthenticated(),
      authLevel: getAuthLevel(),
      health: getHealth(),
      healthScore: getHealthScore(),
      healthy: isHealthy(),
      capabilities: {
        navigate: canNavigate(),
        authenticate: canAuthenticate(),
        showUI: canShowUI()
      },
      timestamp: Date.now()
    };
    return _lastSnapshot;
  }

  // ─────────────────────────────────────────────────────────────
  // SUBSCRIPTIONS (observe mode changes)
  // ─────────────────────────────────────────────────────────────

  function subscribe(callback: RuntimeSubscriber) {
    if (typeof callback !== 'function') return function() {};

    _subscribers.push(callback);

    var unsubKernel: (() => void) | null = null;
    if (_kernel.on) {
      unsubKernel = _kernel.on(KERNEL_EVENTS.MODE_CHANGE, function(data: Record<string, unknown>) {
        var snapshot = getSnapshot();

        // Usar payload-contracts para payload tipado
        _emitToEventBus(RUNTIME_CONTEXT_EVENTS.UPDATED, createUpdatedPayload(snapshot, 'mode-change', {
          from: data.from,
          to: data.to,
          reason: data.reason
        }));

        for (var i = 0; i < _subscribers.length; i++) {
          try {
            _subscribers[i](snapshot, data);
          } catch (e: any) {
            _earlyLog.error('Subscriber error: ' + e.message);
          }
        }
      });
    }

    return function unsubscribe() {
      var idx = _subscribers.indexOf(callback);
      if (idx >= 0) _subscribers.splice(idx, 1);
      if (unsubKernel) unsubKernel();
    };
  }

  // Metodo para emitir manualmente (util para auth changes)
  function notifyUpdate(trigger: string, extraData: Record<string, unknown>) {
    var snapshot = getSnapshot();

    // Usar payload-contracts para payload tipado
    _emitToEventBus(RUNTIME_CONTEXT_EVENTS.UPDATED, createUpdatedPayload(snapshot, trigger || 'manual', extraData));

    for (var i = 0; i < _subscribers.length; i++) {
      try {
        _subscribers[i](snapshot, { trigger: trigger });
      } catch (e: any) {
        _earlyLog.error('Subscriber error: ' + e.message);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // DIAGNOSTICS
  // ─────────────────────────────────────────────────────────────

  function info() {
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      kernelConnected: !!_kernel,
      eventBusConnected: !!_getEventBus(),
      subscriberCount: _subscribers.length,
      lastSnapshot: _lastSnapshot,
      hasEmittedReady: _isReady,
      hasLastReadyEvent: !!_lastReadyEvent,
      hasLastUpdatedEvent: !!_lastUpdatedEvent,
      eventHistorySize: _eventHistory.length,
      timestamp: Date.now()
    };
  }

  function healthCheck() {
    var kernelOk = !!_kernel && typeof _kernel.getMode === 'function';
    var eventBusOk = !!_getEventBus();
    var status: string = HEALTH_STATUS.HEALTHY;
    if (!kernelOk) {
      status = HEALTH_STATUS.DEGRADED;
    }

    return createHealthResult({
      status: status,
      moduleId: MODULE_ID,
      version: VERSION,
      checks: {
        kernelConnected: kernelOk,
        eventBusConnected: eventBusOk,
        modeAccessible: kernelOk && !!getMode(),
        snapshotWorking: !!getSnapshot(),
        replayAvailable: _isReady
      },
      details: {
        mode: kernelOk ? getMode() : 'N/A',
        subscriberCount: _subscribers.length,
        eventHistorySize: _eventHistory.length
      }
    });
  }

  // ─────────────────────────────────────────────────────────────
  // PUBLIC API (READ-ONLY CONTRACT)
  // ─────────────────────────────────────────────────────────────

  var publicAPI = Object.freeze({
    VERSION: VERSION,
    MODULE_ID: MODULE_ID,
    EVENTS: RUNTIME_CONTEXT_EVENTS,

    getMode: getMode,
    getPhase: getPhase,
    isReady: isReady,
    isDegraded: isDegraded,
    isInMaintenance: isInMaintenance,
    isFailed: isFailed,
    isInRecovery: isInRecovery,

    isAuthenticated: isAuthenticated,
    getAuthLevel: getAuthLevel,

    isCapabilityEnabled: isCapabilityEnabled,
    canNavigate: canNavigate,
    canAuthenticate: canAuthenticate,
    canShowUI: canShowUI,

    getHealth: getHealth,
    getHealthScore: getHealthScore,
    isHealthy: isHealthy,

    canEnableFeature: canEnableFeature,
    canAttemptRecovery: canAttemptRecovery,

    getSnapshot: getSnapshot,

    subscribe: subscribe,
    notifyUpdate: notifyUpdate,

    // #04: Event Replay API
    subscribeWithReplay: subscribeWithReplay,
    replayReady: replayReady,
    replayLastUpdate: replayLastUpdate,
    getEventHistory: getEventHistory,
    hasEmittedReady: hasEmittedReady,

    info: info,
    healthCheck: healthCheck,

    MODES: KERNEL_MODES,
    CAPABILITIES: CAPABILITIES
  });

  // Emitir evento READY ao criar (usando payload-contracts)
  setTimeout(function() {
    _emitToEventBus(RUNTIME_CONTEXT_EVENTS.READY, createReadyPayload(getSnapshot(), VERSION));
  }, 0);

  return publicAPI;
}

// ═══════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// v3.7.0-STRICT-MODE: expose via windowAdapter apenas em strict mode
// v3.6.0-STEP8: expose via windowAdapter (canal oficial) + window fallback (backward compat)
// ═══════════════════════════════════════════════════════════════

var _instance: ReturnType<typeof createRuntimeContext> | null = null;

export function getInstance(kernel?: KernelInstance) {
  if (!_instance && kernel) {
    _instance = createRuntimeContext(kernel);
    if (typeof window !== 'undefined') {
      var strictMode = isStrict();

      // Canal oficial: windowAdapter.expose (Fase 2 Step 8)
      if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.expose) {
        (window.Core.windowAdapter.expose as Function)('RuntimeContext', _instance);
      }

      // v3.7.0: Em strict mode, não expõe via window.* direto
      if (!strictMode) {
        // Backward compat: window.RuntimeContext direto (será removido na Fase 3D)
        window.RuntimeContext = _instance;
      }
    }
  }
  return _instance;
}

export function resetInstance() {
  _instance = null;
  if (typeof window !== 'undefined') {
    // Limpar canal oficial
    if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.unexpose) {
      (window.Core.windowAdapter.unexpose as Function)('RuntimeContext');
    }
    // Limpar backward compat
    delete window.RuntimeContext;
  }
}

export default {
  VERSION: VERSION,
  MODULE_ID: MODULE_ID,
  RUNTIME_CONTEXT_EVENTS: RUNTIME_CONTEXT_EVENTS,
  createRuntimeContext: createRuntimeContext,
  getInstance: getInstance,
  resetInstance: resetInstance
};
