

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: main.feature.session-sync
// PURPOSE: MainFeature: Session Sync
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   init() — exported function
//   destroy() — exported function
//   cleanup — exported value
//   set() — exported function
//   get() — exported function
//   remove() — exported function
//   subscribe() — exported function
//   getTabId() — exported function
//   isLeader() — exported function
//   getActiveTabs() — exported function
//   requestSync() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   `session-sync:${eventName}`
// LISTENS (eventos):
//   'beforeunload'
//   'storage'
// WINDOW ACCESS:
//   window.addEventListener
//   window.removeEventListener
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const MODULE_ID = 'main.feature.session-sync';
export const VERSION = '1.0.0-ENTERPRISE';

const SYNC_EVENTS = Object.freeze({
  STATE_CHANGED: 'session:state-changed',
  TAB_JOINED: 'session:tab-joined',
  TAB_LEFT: 'session:tab-left',
  LEADER_CHANGED: 'session:leader-changed',
  SYNC_REQUEST: 'session:sync-request',
  SYNC_RESPONSE: 'session:sync-response'
});

const STORAGE_KEYS = Object.freeze({
  SESSION_STATE: 'dsd:session:state',
  TAB_REGISTRY: 'dsd:session:tabs',
  LEADER_TAB: 'dsd:session:leader',
  BROADCAST: 'dsd:session:broadcast'
});

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

let _enabled = false;
let _cleanups: Array<() => void> = [];
let _tabId: string | null = null;
let _isLeader = false;
let _channel: unknown = null;
let _state: Record<string, unknown> = {};
let _subscribers: Array<(...args: unknown[]) => void> = [];
let _heartbeatInterval: ReturnType<typeof setInterval> | null = null;

let _config = {
  heartbeatMs: 5000,
  leaderTimeout: 10000,
  syncDebounceMs: 100
};

const _metrics = {
  inits: 0,
  stateChanges: 0,
  syncsSent: 0,
  syncsReceived: 0,
  leaderElections: 0,
  tabsJoined: 0,
  tabsLeft: 0
};

// ═══════════════════════════════════════════════════════════════
// TAB MANAGEMENT
// ═══════════════════════════════════════════════════════════════

function _generateTabId() {
  return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

function _getTabRegistry() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TAB_REGISTRY);
    return data ? JSON.parse(data) : {};
  } catch (e: any) {
    return {};
  }
}

function _setTabRegistry(registry: unknown) {
  try {
    localStorage.setItem(STORAGE_KEYS.TAB_REGISTRY, JSON.stringify(registry));
  } catch (e: any) { }
}

function _registerTab() {
  const registry = _getTabRegistry();
  // @ts-expect-error strict migration — TS2538
  registry[_tabId] = { lastSeen: Date.now(), isLeader: false };
  _setTabRegistry(registry);
  _metrics.tabsJoined++;
}

function _unregisterTab() {
  const registry = _getTabRegistry();
  // @ts-expect-error strict migration — TS2538
  delete registry[_tabId];
  _setTabRegistry(registry);
  _metrics.tabsLeft++;
}

function _cleanStale() {
  const registry = _getTabRegistry();
  const now = Date.now();
  let changed = false;
  
  for (const id in registry) {
    if (registry.hasOwnProperty(id) && now - registry[id].lastSeen > _config.leaderTimeout) {
      delete registry[id];
      changed = true;
    }
  }
  
  if (changed) {
    _setTabRegistry(registry);
  }
  
  return registry;
}

function _heartbeat() {
  const registry = _getTabRegistry();
  // @ts-expect-error strict migration — TS2538
  if (registry[_tabId]) {
    // @ts-expect-error strict migration — TS2538
    registry[_tabId].lastSeen = Date.now();
    // @ts-expect-error strict migration — TS2538
    registry[_tabId].isLeader = _isLeader;
    _setTabRegistry(registry);
  }
  
  _cleanStale();
  _checkLeadership();
}

// ═══════════════════════════════════════════════════════════════
// LEADER ELECTION
// ═══════════════════════════════════════════════════════════════

function _checkLeadership() {
  const registry = _cleanStale();
  let currentLeader = null;
  
  try {
    currentLeader = localStorage.getItem(STORAGE_KEYS.LEADER_TAB);
  } catch (e: any) { }
  
  // Se líder atual não existe mais, eleger novo
  if (!currentLeader || !registry[currentLeader]) {
    _electLeader(registry);
  }
}

function _electLeader(registry: unknown) {
  // @ts-expect-error strict migration — TS2769
  let tabIds = Object.keys(registry).sort();
  
  if (tabIds.length === 0) {
    // @ts-expect-error strict migration — TS2322
    tabIds = [_tabId];
  }
  
  const newLeader = tabIds[0];
  
  try {
    localStorage.setItem(STORAGE_KEYS.LEADER_TAB, newLeader);
  } catch (e: any) { }
  
  const wasLeader = _isLeader;
  _isLeader = (newLeader === _tabId);
  
  if (_isLeader && !wasLeader) {
    _metrics.leaderElections++;
    _broadcast({ type: SYNC_EVENTS.LEADER_CHANGED, leaderId: _tabId });
    _emitLocal('leader-acquired');
  } else if (!_isLeader && wasLeader) {
    _emitLocal('leader-lost');
  }
}

// ═══════════════════════════════════════════════════════════════
// BROADCAST CHANNEL
// ═══════════════════════════════════════════════════════════════

function _initChannel() {
  if (typeof BroadcastChannel === 'undefined') {
    // Fallback para localStorage events
    const storageHandler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.BROADCAST && e.newValue) {
        try {
          const msg = JSON.parse(e.newValue);
          if (msg.senderId !== _tabId) {
            _handleMessage(msg);
          }
        } catch (err) { }
      }
    };
    window.addEventListener('storage', storageHandler);
    _cleanups.push(() => { window.removeEventListener('storage', storageHandler); });
    return;
  }
  
  _channel = new BroadcastChannel('dsd-session-sync');
  
// @ts-expect-error TS migration - TS2339
  _channel.onmessage = (e: MessageEvent) => {
    if (e.data && e.data.senderId !== _tabId) {
      _handleMessage(e.data);
    }
  };
  
  _cleanups.push(() => {
    if (_channel) {
// @ts-expect-error TS migration - TS2339
      _channel.close();
      _channel = null;
    }
  });
}

function _broadcast(message: Record<string, unknown>) {
  const msg = Object.assign({}, message, {
    senderId: _tabId,
    timestamp: Date.now()
  });
  
  if (_channel) {
// @ts-expect-error TS migration - TS2339
    _channel.postMessage(msg);
  } else {
    // Fallback localStorage
    try {
      localStorage.setItem(STORAGE_KEYS.BROADCAST, JSON.stringify(msg));
      setTimeout(() => {
        localStorage.removeItem(STORAGE_KEYS.BROADCAST);
      }, 100);
    } catch (e: any) { }
  }
  
  _metrics.syncsSent++;
}

function _handleMessage(msg: Record<string, unknown>) {
  _metrics.syncsReceived++;
  
  switch (msg.type) {
    case SYNC_EVENTS.STATE_CHANGED:
      _handleStateChange(msg);
      break;
    case SYNC_EVENTS.TAB_JOINED:
      if (_isLeader) {
        _broadcast({ type: SYNC_EVENTS.SYNC_RESPONSE, state: _state });
      }
      break;
    case SYNC_EVENTS.SYNC_REQUEST:
      if (_isLeader) {
        _broadcast({ type: SYNC_EVENTS.SYNC_RESPONSE, state: _state });
      }
      break;
    case SYNC_EVENTS.SYNC_RESPONSE:
      if (!_isLeader && msg.state) {
// @ts-expect-error TS migration - TS2322
        _state = msg.state;
        _notifySubscribers();
      }
      break;
    case SYNC_EVENTS.LEADER_CHANGED:
      _checkLeadership();
      break;
  }
}

function _handleStateChange(msg: Record<string, unknown>) {
  if (msg.key && msg.value !== undefined) {
// @ts-expect-error TS migration - TS2538
    _state[msg.key] = msg.value;
// @ts-expect-error TS migration - TS2345
    _notifySubscribers(msg.key);
  } else if (msg.state) {
    _state = Object.assign({}, _state, msg.state);
    _notifySubscribers();
  }
}

// ═══════════════════════════════════════════════════════════════
// STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════

function _notifySubscribers(changedKey?: string) {
  for (let i = 0; i < _subscribers.length; i++) {
    try {
      _subscribers[i](_state, changedKey);
    } catch (e: any) { }
  }
}

function _emitLocal(eventName: string, data?: Record<string, unknown>) {
  const eb = _getPort('eventBus');
  if (eb && eb.emit) {
    eb.emit(`session-sync:${eventName}`, Object.assign({ tabId: _tabId }, data || {}));
  }
}

// ═══════════════════════════════════════════════════════════════
// LIFECYCLE
// ═══════════════════════════════════════════════════════════════

export function init(options: Record<string, unknown>) {
  if (_enabled) return { ok: true, alreadyInitialized: true };
  if (typeof window === 'undefined') return { ok: false, error: 'Browser only' };
  
  try {
    _initPorts();
    _metrics.inits++;
    
    if (options && options.config) {
      _config = Object.assign({}, _config, options.config);
    }
    
    _tabId = _generateTabId();
    _registerTab();
    _initChannel();
    
    // Heartbeat para manter registro atualizado
    _heartbeatInterval = setInterval(_heartbeat, _config.heartbeatMs);
    _cleanups.push(() => {
      if (_heartbeatInterval) {
        clearInterval(_heartbeatInterval);
        _heartbeatInterval = null;
      }
    });
    
    // Checar liderança inicial
    _checkLeadership();
    
    // Anunciar entrada
    _broadcast({ type: SYNC_EVENTS.TAB_JOINED, tabId: _tabId });
    
    // Solicitar estado atual
    if (!_isLeader) {
      _broadcast({ type: SYNC_EVENTS.SYNC_REQUEST });
    }
    
    // Cleanup no unload
    const unloadHandler = () => {
      _unregisterTab();
      if (_isLeader) {
        try {
          localStorage.removeItem(STORAGE_KEYS.LEADER_TAB);
        } catch (e: any) { }
      }
    };
    window.addEventListener('beforeunload', unloadHandler);
    _cleanups.push(() => { window.removeEventListener('beforeunload', unloadHandler); });
    
    _enabled = true;
    return { ok: true, version: VERSION, tabId: _tabId, isLeader: _isLeader };
    
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export function destroy() {
  _unregisterTab();
  
  for (let i = 0; i < _cleanups.length; i++) {
    try { _cleanups[i](); } catch (e: any) { }
  }
  _cleanups = [];
  _subscribers = [];
  
  _enabled = false;
  return { ok: true };
}

export const cleanup = destroy;

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

export function set(key: string, value: unknown) {
  if (!_enabled) return { ok: false, error: 'Not initialized' };
  
  _state[key] = value;
  _metrics.stateChanges++;
  
  _broadcast({ type: SYNC_EVENTS.STATE_CHANGED, key, value });
  _notifySubscribers(key);
  
  return { ok: true };
}

export function get(key: string) {
  if (key) return _state[key];
  return Object.assign({}, _state);
}

export function remove(key: string) {
  if (!_enabled) return { ok: false, error: 'Not initialized' };
  
  delete _state[key];
  _broadcast({ type: SYNC_EVENTS.STATE_CHANGED, key, value: undefined });
  _notifySubscribers(key);
  
  return { ok: true };
}

export function subscribe(callback: (...args: unknown[]) => void) {
  if (typeof callback !== 'function') return () => {};
  
  _subscribers.push(callback);
  
  return () => {
    const idx = _subscribers.indexOf(callback);
    if (idx > -1) _subscribers.splice(idx, 1);
  };
}

export function getTabId() {
  return _tabId;
}

export function isLeader() {
  return _isLeader;
}

export function getActiveTabs() {
  return Object.keys(_cleanStale());
}

export function requestSync() {
  _broadcast({ type: SYNC_EVENTS.SYNC_REQUEST });
  return { ok: true };
}

// ═══════════════════════════════════════════════════════════════
// OBSERVABILITY
// ═══════════════════════════════════════════════════════════════

export function getMetrics() {
  return Object.assign({}, _metrics, {
    activeTabs: getActiveTabs().length,
    stateKeys: Object.keys(_state).length,
    subscribers: _subscribers.length
  });
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    enabled: _enabled,
    tabId: _tabId,
    isLeader: _isLeader,
    activeTabs: getActiveTabs(),
    stateKeys: Object.keys(_state),
    config: Object.assign({}, _config),
    metrics: getMetrics()
  };
}

export function healthCheck() {
  const checks = {
    enabled: _enabled,
    hasTabId: !!_tabId,
    heartbeatRunning: !!_heartbeatInterval
  };
  
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  
  let status = 'HEALTHY';
  if (!_enabled) status = 'NOT_INITIALIZED';
  
  return {
    status,
    score: { passed, total, percentage: Math.round((passed / total) * 100) },
    moduleId: MODULE_ID,
    version: VERSION,
    checks,
    metrics: _metrics,
    timestamp: Date.now()
  };
}

export default {
  MODULE_ID,
  VERSION,
  SYNC_EVENTS,
  init,
  destroy,
  cleanup,
  set,
  get,
  remove,
  subscribe,
  getTabId,
  isLeader,
  getActiveTabs,
  requestSync,
  getMetrics,
  info,
  healthCheck,
  injectPorts,
  getPorts
};
