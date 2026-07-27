
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.3.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: adapters/globalstate-adapter
// PURPOSE: Adapter para integração com GlobalState (estado global)
// ───────────────────────────────────────────────────────────────
// @contract PORTS_FIRST - Usa createCorePorts para acesso ao GlobalState
// @contract P2_POLICY - Integrado com GlobalStateAccessPolicy
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   recordAccess, ACCESS_TYPES, ACCESS_SOURCES from /core/policies/globalstate-access-policy.js
// EXPORTS:
//   VERSION, MODULE_ID — Identificadores
//   injectPorts, getPorts — Gestão de ports
//   connect — Conecta ao GlobalState com retry
//   disconnect — Desconecta do sistema
//   dispatchLoading — Dispatch ação de loading
//   dispatchAppReady — Dispatch ação de app ready
//   isConnected — Verifica conexão
//   getRetryCount — Retorna contador de retries
//   getMetrics — Retorna métricas
//   getStatus — Retorna status atual
//   healthCheck — Diagnóstico de saúde
//   info — Informações do módulo
// EVENTS CONSUMED: GlobalState subscriptions
// @changelog v1.3.0-P2-ENTERPRISE: Integrado GlobalStateAccessPolicy.recordAccess (NR-FULL roadmap P2)
// @changelog v1.2.0-P17WI (2025-01): PortsFactory Migration
// ═══════════════════════════════════════════════════════════════
/**
 * @module GlobalStateAdapter
 * @description Adapter para GlobalState com retry automático
 * @version 1.3.0-P2-ENTERPRISE
 * @since 2025-02-02
 */
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { recordAccess, ACCESS_TYPES, ACCESS_SOURCES } from '/core/policies/globalstate-access-policy.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell-globalstate-adapter';

const MAX_RETRIES = 5;
const RETRY_DELAY = 500;

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _getPort(name: string) {
  return Ports.get(name);
}

export function injectPorts(p: DynObj) {
  return Ports.inject(p);
}

export function getPorts() {
  return Ports.snapshot();
}

/**
 * P2: Record access via GlobalStateAccessPolicy
 * @param {string} type - ACCESS_TYPES (subscribe, dispatch)
 * @param {string} key - State key accessed
 */
function _recordAccess(type: DynObj, key: string) {
  try {
    recordAccess({
      type,
      source: ACCESS_SOURCES.PORTS,
      key,
      caller: MODULE_ID,
      moduleId: MODULE_ID
    });
  } catch (e) {
    // Policy not initialized yet - silent fail
  }
}

let _cleanups: DynObj[] = [];
let _retryCount = 0;
let _connected = false;

const _metrics = {
  connects: 0,
  disconnects: 0,
  syncs: 0,
  errors: 0,
  retries: 0
};

function _log(event: string, data?: DynObj) {
  if (!data) data = {};
  try {
    const logger = _getPort('logger');
    if (logger && logger.info) {
      logger.info(`[${MODULE_ID}] ${event}`, data);
    }
  } catch (e) {
    // Silently ignore
  }
}

function _trackEvent(event: string, data?: DynObj) {
  if (!data) data = {};
  try {
    const telemetry = _getPort('telemetry');
    if (telemetry && telemetry.event) {
      telemetry.event(`${MODULE_ID}:${event}`, data);
    }
  } catch (e) {
    // Silently ignore
  }
}

/**
 * Conecta ao GlobalState
 * @param {Object} callbacks - Callbacks para eventos
 * @returns {boolean} Sucesso da conexão
 */
export function connect(callbacks: DynObj) {
  if (!callbacks) callbacks = {};

  if (_connected) {
    _log('already-connected');
    return true;
  }

  const globalState = _getPort('globalState');

  if (!globalState) {
    if (_retryCount < MAX_RETRIES) {
      _retryCount++;
      _metrics.retries++;
      const delay = RETRY_DELAY * _retryCount;
      _trackEvent('retry-scheduled', { attempt: _retryCount, delay });
      setTimeout(() => {
        connect(callbacks);
      }, delay);
      return false;
    }
    _metrics.errors++;
    _trackEvent('max-retries-reached', { attempts: _retryCount });
    return false;
  }

  try {
    if (callbacks.onLoading) {
      // P2: Record subscribe access
      _recordAccess(ACCESS_TYPES.SUBSCRIBE, 'app.isLoading');

      const unsub1 = globalState.subscribe((isLoading: boolean) => {
        _metrics.syncs++;
        callbacks.onLoading(isLoading);
      }, 'app.isLoading');
      if (typeof unsub1 === 'function') _cleanups.push(unsub1);
    }

    if (callbacks.onMaintenance) {
      // P2: Record subscribe access
      _recordAccess(ACCESS_TYPES.SUBSCRIBE, 'app.maintenanceMode');

      const unsub2 = globalState.subscribe((mode: DynObj) => {
        _metrics.syncs++;
        callbacks.onMaintenance(mode);
      }, 'app.maintenanceMode');
      if (typeof unsub2 === 'function') _cleanups.push(unsub2);
    }

    _connected = true;
    _metrics.connects++;
    _trackEvent('connected', { subscriptions: _cleanups.length, retriesNeeded: _retryCount });
    return true;
  } catch (error: any) {
    _metrics.errors++;
    _trackEvent('connect-error', { error: error.message });
    return false;
  }
}

/**
 * Desconecta do GlobalState
 */
export function disconnect() {
  _cleanups.forEach(fn => {
    try { fn(); } catch (e) {}
  });
  _cleanups = [];
  _retryCount = 0;
  _connected = false;
  _metrics.disconnects++;
  _trackEvent('disconnected');
}

/**
 * Dispatch ação de loading
 * @param {boolean} isLoading - Estado de loading
 * @returns {boolean} Sucesso
 */
export function dispatchLoading(isLoading: boolean) {
  try {
    const globalState = _getPort('globalState');
    if (globalState && globalState.dispatch && globalState.actions && globalState.actions.setLoading) {
      // P2: Record dispatch access
      _recordAccess(ACCESS_TYPES.DISPATCH, 'app.isLoading');

      globalState.dispatch(globalState.actions.setLoading(isLoading));
      return true;
    }
  } catch (e) {
    _metrics.errors++;
  }
  return false;
}

/**
 * Dispatch ação de app ready
 * @param {boolean} isReady - Estado de ready
 * @returns {boolean} Sucesso
 */
export function dispatchAppReady(isReady: boolean) {
  try {
    const globalState = _getPort('globalState');
    if (globalState && globalState.dispatch) {
      // P2: Record dispatch access
      _recordAccess(ACCESS_TYPES.DISPATCH, 'app.ready');

      globalState.dispatch({
        type: isReady ? 'SET_APP_READY' : 'CLEAR_APP_READY',
        payload: isReady
      });
      return true;
    }
  } catch (e) {
    _metrics.errors++;
  }
  return false;
}

export function isConnected() {
  return _connected;
}

export function getRetryCount() {
  return _retryCount;
}

export function getMetrics() {
  return Object.assign({}, _metrics);
}

/**
 * Retorna status atual
 * @returns {string} connected|retrying|failed|pending
 */
export function getStatus() {
  const globalState = _getPort('globalState');
  const hasGlobalState = !!globalState;

  if (_connected) return 'connected';
  if (!hasGlobalState && _retryCount > 0 && _retryCount < MAX_RETRIES) return 'retrying';
  if (!hasGlobalState && _retryCount >= MAX_RETRIES) return 'failed';
  return 'pending';
}

export function healthCheck() {
  const ps = Ports.snapshot();
  const globalState = _getPort('globalState');

  const checks = {
    globalStateExists: !!globalState,
    connected: _connected,
    noExcessiveRetries: _retryCount < MAX_RETRIES,
    lowErrorRate: _metrics.connects === 0 || (_metrics.errors / _metrics.connects) < 0.2,
    portsInitialized: ps._initialized
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const status = passed === 5 ? 'HEALTHY' : (passed >= 2 ? 'DEGRADED' : 'UNHEALTHY');

  return {
    status,
    score: `${passed}/5`,
    checks,
    metrics: getMetrics(),
    connectionStatus: getStatus(),
    version: VERSION,
    moduleId: MODULE_ID,
    portsInitialized: ps._initialized,
    timestamp: Date.now()
  };
}

export function info() {
  const ps = Ports.snapshot();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    connected: _connected,
    status: getStatus(),
    subscriptions: _cleanups.length,
    retryCount: _retryCount,
    maxRetries: MAX_RETRIES,
    portsInitialized: ps._initialized,
    metrics: getMetrics(),
    timestamp: Date.now()
  };
}

export default {
  connect,
  disconnect,
  dispatchLoading,
  dispatchAppReady,
  isConnected,
  getRetryCount,
  getMetrics,
  getStatus,
  healthCheck,
  info,
  VERSION,
  MODULE_ID,
  injectPorts,
  getPorts
};
