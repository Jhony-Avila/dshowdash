
// ═════════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0-ES6)
// ═════════════════════════════════════════════════════════════════
// MODULE: header/core/header-core
// PURPOSE: Core logic layer of the Header — manages state,
//          component registry, feature flags, network status,
//          and coordinates subsystems (Gateway, CircuitBreaker,
//          SelfHealing, GracefulDegradation).
// ─────────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   COMPONENT_STATUS from ./constants.js
//   * as FeatureFlags from ./feature-flags.js
//   * as Gateway from ./header-gateway.js
//   * as CircuitBreaker from ./circuit-breaker-api.js
//   * as SelfHealing from ./self-healing.js
//   * as GracefulDegradation from ./graceful-degradation.js
// PROVIDES:
//   init(config) — initializes core state and subsystems
//   setShell(shell) — connects the Shell reference
//   getState() / getFullState() / setState(updates) — state mgmt
//   onStateChange(callback) — subscribe to state changes
//   registerComponent / updateComponentStatus / getComponent
//   getAllComponents / removeComponent
//   fetchHealth / fetchAlerts / fetchComponents / fetchPermissions
//   setNetworkStatus / getNetworkStatus
//   isFeatureEnabled / enableFeature / disableFeature
//   start() / stop() / reset() / destroy()
//   healthCheck() / info()
//   injectPorts(p) / getPorts()
// EMITS (eventos):
//   header:core:state-change — on every state mutation
// ═════════════════════════════════════════════════════════════════
// Header - Core (Logic Layer)
// @version 1.1.0-ES6
// @changelog v1.1.0-ES6 - Task 10.1 B10: var → const/let
// Camada de lógica do Header - sem manipulação de DOM
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { COMPONENT_STATUS } from './constants.js';
import * as FeatureFlags from './feature-flags.js';
import * as Gateway from './header-gateway.js';
import * as CircuitBreaker from './circuit-breaker-api.js';
import * as SelfHealing from './self-healing.js';
import * as GracefulDegradation from './graceful-degradation.js';

export const VERSION = '1.1.0-ES6';
export const MODULE_ID = 'header/core/header-core';

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => { const cfg = _getPort('config'); return (cfg && cfg.app && cfg.app.debug) ? true : false; };
const _log = function(level: string, ...rest: any[]) { const args = Array.prototype.slice.call(arguments, 1); const logger = _getPort('logger'); if (!logger) return; const prefix = `[${MODULE_ID}]`; if (level === 'error') { if (logger.error) logger.error(prefix, args.join(' ')); return; } if (level === 'warn') { if (logger.warn) logger.warn(prefix, args.join(' ')); return; } if (level === 'info') { if (logger.info) logger.info(prefix, args.join(' ')); return; } if (_debugEnabled() && logger.debug) logger.debug(prefix, args.join(' ')); };

const _state = {
  initialized: false,
  status: 'idle',
  config: (null as Record<string,unknown>|null),
  components: new Map(),
  health: (null as unknown|null),
  alerts: ([] as unknown[]),
  permissions: (null as unknown|null),
  networkStatus: 'online',
  lastUpdate: (null as unknown|null)
};

// @ts-expect-error strict migration — TS7034
let _listeners = [];
let _shell = null;

function init(config: Record<string,unknown>) {
  if (_state.initialized) {
    _log('warn', 'HeaderCore já inicializado');
    return Promise.resolve(_state);
  }
  
  _initPorts();
  _state.config = config || {};
  
  // @ts-expect-error TS migration - TS2345
  Gateway.init(_state.config.api);
  // @ts-expect-error TS migration - TS2345
  FeatureFlags.init(_state.config.features);
  
  _state.initialized = true;
  _state.status = 'initialized';
  
  _log('info', 'HeaderCore inicializado');
  _emitStateChange('initialized');
  
  return Promise.resolve(_state);
}

function setShell(shell: unknown) {
  _shell = shell;
  _log('debug', 'Shell conectado ao Core');
}

function getState() {
  return {
    initialized: _state.initialized,
    status: _state.status,
    componentsCount: _state.components.size,
    hasHealth: !!_state.health,
    alertsCount: _state.alerts.length,
    hasPermissions: !!_state.permissions,
    networkStatus: _state.networkStatus,
    lastUpdate: _state.lastUpdate
  };
}

function getFullState() {
  return Object.assign({}, _state, {
    components: Array.from(_state.components.entries())
  });
}

function setState(updates: Record<string,unknown>) {
  let changed = false;
  
  Object.keys(updates).forEach(key => {
    if ((_state as Record<string,unknown>)[key] !== updates[key]) {
      (_state as Record<string,unknown>)[key] = updates[key];
      changed = true;
    }
  });
  
  if (changed) {
    _state.lastUpdate = Date.now();
    _emitStateChange('updated');
  }
  
  return _state;
}

function onStateChange(callback: Function) {
  if (typeof callback !== 'function') return () => {};
  _listeners.push(callback);
  return () => {
    // @ts-expect-error strict migration — TS7005
    const idx = _listeners.indexOf(callback);
    // @ts-expect-error strict migration — TS7005
    if (idx > -1) _listeners.splice(idx, 1);
  };
}

function _emitStateChange(type: string) {
  const event = { type, state: getState(), timestamp: Date.now() };
  // @ts-expect-error strict migration — TS7005
  _listeners.forEach(cb => {
    try { cb(event); } catch (e: any) { _log('error', 'State listener error:', e.message); }
  });
  
  const eventBus = _getPort('eventBus');
  if (eventBus && eventBus.emit) {
    eventBus.emit('header:core:state-change', event);
  }
}

function registerComponent(name: string, componentData: Record<string,unknown>) {
  _state.components.set(name, Object.assign({
    name,
    status: COMPONENT_STATUS.PENDING,
    registeredAt: Date.now()
  }, componentData));
  
  _emitStateChange('component:registered');
  return true;
}

function updateComponentStatus(name: string, status: string, data: Record<string,unknown>) {
  const component = _state.components.get(name);
  if (component) {
    component.status = status;
    component.lastUpdate = Date.now();
    if (data) {
      component.data = data;
    }
    _emitStateChange('component:updated');
  }
}

function getComponent(name: string) {
  return _state.components.get(name) || null;
}

function getAllComponents() {
  const result = {};
  _state.components.forEach((comp, name) => {
    (result as Record<string,unknown>)[name as string] = comp;
  });
  return result;
}

function removeComponent(name: string) {
  const removed = _state.components.delete(name);
  if (removed) {
    _emitStateChange('component:removed');
  }
  return removed;
}

function fetchHealth() {
  return Gateway.fetchHealth().then((data: Record<string,unknown>) => {
    _state.health = data;
    _state.lastUpdate = Date.now();
    _emitStateChange('health:updated');
    return data;
  }).catch((error: unknown) => {
    // @ts-expect-error TS migration - TS2339
    _log('error', 'Erro ao buscar health:', error.message);
    throw error;
  });
}

function fetchAlerts() {
  return Gateway.fetchAlerts().then((data: Record<string,unknown>) => {
    // @ts-expect-error TS migration - TS2740
    _state.alerts = data.alerts || data || [];
    _state.lastUpdate = Date.now();
    _emitStateChange('alerts:updated');
    return _state.alerts;
  }).catch((error: unknown) => {
    // @ts-expect-error TS migration - TS2339
    _log('error', 'Erro ao buscar alerts:', error.message);
    throw error;
  });
}

function fetchComponents() {
  return Gateway.fetchComponents().then((data: Record<string,unknown>) => {
    _emitStateChange('components:fetched');
    return data;
  }).catch((error: unknown) => {
    // @ts-expect-error TS migration - TS2339
    _log('error', 'Erro ao buscar components:', error.message);
    throw error;
  });
}

function fetchPermissions() {
  return Gateway.fetchPermissions().then((data: Record<string,unknown>) => {
    _state.permissions = data;
    _state.lastUpdate = Date.now();
    _emitStateChange('permissions:updated');
    return data;
  }).catch((error: unknown) => {
    // @ts-expect-error TS migration - TS2339
    _log('error', 'Erro ao buscar permissions:', error.message);
    throw error;
  });
}

function setNetworkStatus(status: string) {
  if (_state.networkStatus !== status) {
    _state.networkStatus = status;
    _emitStateChange('network:changed');
    
    if (status === 'offline') {
      GracefulDegradation.degradeFeature('network-dependent', 'OFFLINE');
    } else if (status === 'online') {
      GracefulDegradation.reactivateFeature('network-dependent');
    }
  }
}

function getNetworkStatus() {
  return _state.networkStatus;
}

function isFeatureEnabled(featureName: string) {
  return FeatureFlags.isEnabled(featureName);
}

function enableFeature(featureName: string) {
  return (FeatureFlags as any).enable(featureName);
}

function disableFeature(featureName: string) {
  return (FeatureFlags as any).disable(featureName);
}

function start() {
  if (_state.status === 'running') {
    return Promise.resolve();
  }
  
  _state.status = 'running';
  _emitStateChange('started');
  
  if (isFeatureEnabled('selfHealingEnabled')) {
    SelfHealing.start();
  }
  
  _log('info', 'HeaderCore started');
  return Promise.resolve();
}

function stop() {
  if (_state.status !== 'running') {
    return;
  }
  
  _state.status = 'stopped';
  SelfHealing.stop();
  _emitStateChange('stopped');
  
  _log('info', 'HeaderCore stopped');
}

function reset() {
  stop();
  
  _state.components.clear();
  _state.health = null;
  _state.alerts = [];
  _state.permissions = null;
  _state.lastUpdate = null;
  
  Gateway.clearCache();
  CircuitBreaker.resetAll();
  
  _emitStateChange('reset');
  _log('info', 'HeaderCore reset');
}

function destroy() {
  stop();
  reset();
  
  _state.initialized = false;
  _state.config = null;
  _listeners = [];
  _shell = null;
  
  _log('info', 'HeaderCore destroyed');
}

function healthCheck() {
  const checks = {
    initialized: _state.initialized,
    running: _state.status === 'running',
    hasComponents: _state.components.size > 0,
    networkOnline: _state.networkStatus === 'online',
    gatewayHealthy: Gateway.healthCheck().status === 'HEALTHY',
    portsInitialized: Ports.isInitialized()
  };
  
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  
  return {
    status: passed === total ? 'HEALTHY' : passed >= 4 ? 'DEGRADED' : 'UNHEALTHY',
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    state: getState(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: new Date().toISOString()
  };
}

function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    state: getState(),
    subsystems: {
      gateway: Gateway.info(),
      featureFlags: FeatureFlags.info(),
      circuitBreaker: CircuitBreaker.info(),
      selfHealing: SelfHealing.info(),
      gracefulDegradation: GracefulDegradation.info()
    },
    portsInitialized: Ports.isInitialized(),
    healthCheck: healthCheck()
  };
}

export {
  init,
  setShell,
  getState,
  getFullState,
  setState,
  onStateChange,
  registerComponent,
  updateComponentStatus,
  getComponent,
  getAllComponents,
  removeComponent,
  fetchHealth,
  fetchAlerts,
  fetchComponents,
  fetchPermissions,
  setNetworkStatus,
  getNetworkStatus,
  isFeatureEnabled,
  enableFeature,
  disableFeature,
  start,
  stop,
  reset,
  destroy,
  healthCheck,
  info
};

export default {
  VERSION,
  MODULE_ID,
  init,
  setShell,
  getState,
  setState,
  onStateChange,
  registerComponent,
  getComponent,
  getAllComponents,
  fetchHealth,
  fetchAlerts,
  start,
  stop,
  reset,
  destroy,
  healthCheck,
  info
};
