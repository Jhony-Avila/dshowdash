import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "main.feature.session-sync";
const VERSION = "1.0.0-ENTERPRISE";
const SYNC_EVENTS = Object.freeze({
  STATE_CHANGED: "session:state-changed",
  TAB_JOINED: "session:tab-joined",
  TAB_LEFT: "session:tab-left",
  LEADER_CHANGED: "session:leader-changed",
  SYNC_REQUEST: "session:sync-request",
  SYNC_RESPONSE: "session:sync-response"
});
const STORAGE_KEYS = Object.freeze({
  SESSION_STATE: "dsd:session:state",
  TAB_REGISTRY: "dsd:session:tabs",
  LEADER_TAB: "dsd:session:leader",
  BROADCAST: "dsd:session:broadcast"
});
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
let _enabled = false;
let _cleanups = [];
let _tabId = null;
let _isLeader = false;
let _channel = null;
let _state = {};
let _subscribers = [];
let _heartbeatInterval = null;
let _config = {
  heartbeatMs: 5e3,
  leaderTimeout: 1e4,
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
function _generateTabId() {
  return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}
function _getTabRegistry() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TAB_REGISTRY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
}
function _setTabRegistry(registry) {
  try {
    localStorage.setItem(STORAGE_KEYS.TAB_REGISTRY, JSON.stringify(registry));
  } catch (e) {
  }
}
function _registerTab() {
  const registry = _getTabRegistry();
  registry[_tabId] = { lastSeen: Date.now(), isLeader: false };
  _setTabRegistry(registry);
  _metrics.tabsJoined++;
}
function _unregisterTab() {
  const registry = _getTabRegistry();
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
  if (registry[_tabId]) {
    registry[_tabId].lastSeen = Date.now();
    registry[_tabId].isLeader = _isLeader;
    _setTabRegistry(registry);
  }
  _cleanStale();
  _checkLeadership();
}
function _checkLeadership() {
  const registry = _cleanStale();
  let currentLeader = null;
  try {
    currentLeader = localStorage.getItem(STORAGE_KEYS.LEADER_TAB);
  } catch (e) {
  }
  if (!currentLeader || !registry[currentLeader]) {
    _electLeader(registry);
  }
}
function _electLeader(registry) {
  let tabIds = Object.keys(registry).sort();
  if (tabIds.length === 0) {
    tabIds = [_tabId];
  }
  const newLeader = tabIds[0];
  try {
    localStorage.setItem(STORAGE_KEYS.LEADER_TAB, newLeader);
  } catch (e) {
  }
  const wasLeader = _isLeader;
  _isLeader = newLeader === _tabId;
  if (_isLeader && !wasLeader) {
    _metrics.leaderElections++;
    _broadcast({ type: SYNC_EVENTS.LEADER_CHANGED, leaderId: _tabId });
    _emitLocal("leader-acquired");
  } else if (!_isLeader && wasLeader) {
    _emitLocal("leader-lost");
  }
}
function _initChannel() {
  if (typeof BroadcastChannel === "undefined") {
    const storageHandler = (e) => {
      if (e.key === STORAGE_KEYS.BROADCAST && e.newValue) {
        try {
          const msg = JSON.parse(e.newValue);
          if (msg.senderId !== _tabId) {
            _handleMessage(msg);
          }
        } catch (err) {
        }
      }
    };
    window.addEventListener("storage", storageHandler);
    _cleanups.push(() => {
      window.removeEventListener("storage", storageHandler);
    });
    return;
  }
  _channel = new BroadcastChannel("dsd-session-sync");
  _channel.onmessage = (e) => {
    if (e.data && e.data.senderId !== _tabId) {
      _handleMessage(e.data);
    }
  };
  _cleanups.push(() => {
    if (_channel) {
      _channel.close();
      _channel = null;
    }
  });
}
function _broadcast(message) {
  const msg = Object.assign({}, message, {
    senderId: _tabId,
    timestamp: Date.now()
  });
  if (_channel) {
    _channel.postMessage(msg);
  } else {
    try {
      localStorage.setItem(STORAGE_KEYS.BROADCAST, JSON.stringify(msg));
      setTimeout(() => {
        localStorage.removeItem(STORAGE_KEYS.BROADCAST);
      }, 100);
    } catch (e) {
    }
  }
  _metrics.syncsSent++;
}
function _handleMessage(msg) {
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
        _state = msg.state;
        _notifySubscribers();
      }
      break;
    case SYNC_EVENTS.LEADER_CHANGED:
      _checkLeadership();
      break;
  }
}
function _handleStateChange(msg) {
  if (msg.key && msg.value !== void 0) {
    _state[msg.key] = msg.value;
    _notifySubscribers(msg.key);
  } else if (msg.state) {
    _state = Object.assign({}, _state, msg.state);
    _notifySubscribers();
  }
}
function _notifySubscribers(changedKey) {
  for (let i = 0; i < _subscribers.length; i++) {
    try {
      _subscribers[i](_state, changedKey);
    } catch (e) {
    }
  }
}
function _emitLocal(eventName, data) {
  const eb = _getPort("eventBus");
  if (eb && eb.emit) {
    eb.emit(`session-sync:${eventName}`, Object.assign({ tabId: _tabId }, data || {}));
  }
}
function init(options) {
  if (_enabled) return { ok: true, alreadyInitialized: true };
  if (typeof window === "undefined") return { ok: false, error: "Browser only" };
  try {
    _initPorts();
    _metrics.inits++;
    if (options && options.config) {
      _config = Object.assign({}, _config, options.config);
    }
    _tabId = _generateTabId();
    _registerTab();
    _initChannel();
    _heartbeatInterval = setInterval(_heartbeat, _config.heartbeatMs);
    _cleanups.push(() => {
      if (_heartbeatInterval) {
        clearInterval(_heartbeatInterval);
        _heartbeatInterval = null;
      }
    });
    _checkLeadership();
    _broadcast({ type: SYNC_EVENTS.TAB_JOINED, tabId: _tabId });
    if (!_isLeader) {
      _broadcast({ type: SYNC_EVENTS.SYNC_REQUEST });
    }
    const unloadHandler = () => {
      _unregisterTab();
      if (_isLeader) {
        try {
          localStorage.removeItem(STORAGE_KEYS.LEADER_TAB);
        } catch (e) {
        }
      }
    };
    window.addEventListener("beforeunload", unloadHandler);
    _cleanups.push(() => {
      window.removeEventListener("beforeunload", unloadHandler);
    });
    _enabled = true;
    return { ok: true, version: VERSION, tabId: _tabId, isLeader: _isLeader };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
function destroy() {
  _unregisterTab();
  for (let i = 0; i < _cleanups.length; i++) {
    try {
      _cleanups[i]();
    } catch (e) {
    }
  }
  _cleanups = [];
  _subscribers = [];
  _enabled = false;
  return { ok: true };
}
const cleanup = destroy;
function set(key, value) {
  if (!_enabled) return { ok: false, error: "Not initialized" };
  _state[key] = value;
  _metrics.stateChanges++;
  _broadcast({ type: SYNC_EVENTS.STATE_CHANGED, key, value });
  _notifySubscribers(key);
  return { ok: true };
}
function get(key) {
  if (key) return _state[key];
  return Object.assign({}, _state);
}
function remove(key) {
  if (!_enabled) return { ok: false, error: "Not initialized" };
  delete _state[key];
  _broadcast({ type: SYNC_EVENTS.STATE_CHANGED, key, value: void 0 });
  _notifySubscribers(key);
  return { ok: true };
}
function subscribe(callback) {
  if (typeof callback !== "function") return () => {
  };
  _subscribers.push(callback);
  return () => {
    const idx = _subscribers.indexOf(callback);
    if (idx > -1) _subscribers.splice(idx, 1);
  };
}
function getTabId() {
  return _tabId;
}
function isLeader() {
  return _isLeader;
}
function getActiveTabs() {
  return Object.keys(_cleanStale());
}
function requestSync() {
  _broadcast({ type: SYNC_EVENTS.SYNC_REQUEST });
  return { ok: true };
}
function getMetrics() {
  return Object.assign({}, _metrics, {
    activeTabs: getActiveTabs().length,
    stateKeys: Object.keys(_state).length,
    subscribers: _subscribers.length
  });
}
function info() {
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
function healthCheck() {
  const checks = {
    enabled: _enabled,
    hasTabId: !!_tabId,
    heartbeatRunning: !!_heartbeatInterval
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  let status = "HEALTHY";
  if (!_enabled) status = "NOT_INITIALIZED";
  return {
    status,
    score: { passed, total, percentage: Math.round(passed / total * 100) },
    moduleId: MODULE_ID,
    version: VERSION,
    checks,
    metrics: _metrics,
    timestamp: Date.now()
  };
}
var session_sync_default = {
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
export {
  MODULE_ID,
  VERSION,
  cleanup,
  session_sync_default as default,
  destroy,
  get,
  getActiveTabs,
  getMetrics,
  getPorts,
  getTabId,
  healthCheck,
  info,
  init,
  injectPorts,
  isLeader,
  remove,
  requestSync,
  set,
  subscribe
};
