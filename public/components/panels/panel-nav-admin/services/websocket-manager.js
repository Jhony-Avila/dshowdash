import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { isEnabled } from "../config/feature-flags.js";
const VERSION = "10.5.0-MIGRATION-PHASE9";
const MODULE_ID = "panel-nav-admin.services.websocket-manager";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function injectPorts(p) {
  return Ports.inject(p);
}
const _log = (level, ...args) => {
  const logger = Ports.get("logger");
  if (!logger) return;
  const prefix = "[WebSocketManager]";
  if (level === "error") logger.error?.(prefix, ...args);
  else if (level === "debug") logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};
const WS_EVENTS = Object.freeze({
  NAV_ITEM_CHANGED: "nav:item:changed",
  NAV_ITEM_CREATED: "nav:item:created",
  NAV_ITEM_DELETED: "nav:item:deleted",
  NAV_SECTION_CHANGED: "nav:section:changed",
  NAV_REORDERED: "nav:reordered",
  NAV_BULK_UPDATE: "nav:bulk:update",
  ADMIN_JOINED: "admin:joined",
  ADMIN_LEFT: "admin:left",
  ADMIN_EDITING: "admin:editing",
  HEARTBEAT: "heartbeat"
});
const WS_STATES = Object.freeze({
  DISCONNECTED: "disconnected",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  RECONNECTING: "reconnecting"
});
function WebSocketManager(options = {}) {
  const url = options.url;
  const reconnectDelayMs = options.reconnectDelayMs ?? 3e3;
  const maxReconnectDelayMs = options.maxReconnectDelayMs ?? 3e4;
  const maxReconnectAttempts = options.maxReconnectAttempts ?? 10;
  const heartbeatIntervalMs = options.heartbeatIntervalMs ?? 3e4;
  let _ws = null;
  let _state = WS_STATES.DISCONNECTED;
  let _reconnectAttempts = 0;
  let _reconnectTimer = null;
  let _heartbeatTimer = null;
  let _intentionalClose = false;
  const _listeners = /* @__PURE__ */ new Map();
  const _messageQueue = [];
  function connect(wsUrl) {
    if (!isEnabled("websocket")) {
      _log("debug", "WebSocket disabled by feature flag");
      return Promise.resolve(false);
    }
    const endpoint = wsUrl || url;
    if (!endpoint) {
      _log("error", "No WebSocket URL provided");
      return Promise.resolve(false);
    }
    _intentionalClose = false;
    _state = WS_STATES.CONNECTING;
    return new Promise((resolve) => {
      try {
        _ws = new WebSocket(endpoint);
        _ws.onopen = () => {
          _state = WS_STATES.CONNECTED;
          _reconnectAttempts = 0;
          _startHeartbeat();
          _flushQueue();
          _log("info", "Connected");
          _emit("_connected", { url: endpoint });
          resolve(true);
        };
        _ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === WS_EVENTS.HEARTBEAT) return;
            _emit(msg.type || "_message", msg.data || msg);
          } catch {
            _emit("_message", event.data);
          }
        };
        _ws.onclose = (event) => {
          _stopHeartbeat();
          if (_intentionalClose) {
            _state = WS_STATES.DISCONNECTED;
            _log("info", "Disconnected intentionally");
            return;
          }
          _state = WS_STATES.RECONNECTING;
          _log("debug", `Connection closed (code: ${event.code}). Reconnecting...`);
          _scheduleReconnect(endpoint);
        };
        _ws.onerror = () => {
          _log("error", "Connection error");
          resolve(false);
        };
      } catch (err) {
        _log("error", "Failed to create WebSocket:", err);
        resolve(false);
      }
    });
  }
  function disconnect() {
    _intentionalClose = true;
    _stopHeartbeat();
    if (_reconnectTimer) {
      clearTimeout(_reconnectTimer);
      _reconnectTimer = null;
    }
    if (_ws) {
      _ws.close(1e3, "Client disconnect");
      _ws = null;
    }
    _state = WS_STATES.DISCONNECTED;
  }
  function send(type, data) {
    const msg = JSON.stringify({ type, data, timestamp: Date.now() });
    if (_ws && _ws.readyState === WebSocket.OPEN) {
      _ws.send(msg);
    } else {
      _messageQueue.push(msg);
    }
  }
  function on(type, handler) {
    if (!_listeners.has(type)) _listeners.set(type, []);
    _listeners.get(type).push(handler);
    return () => off(type, handler);
  }
  function off(type, handler) {
    const handlers = _listeners.get(type);
    if (!handlers) return;
    const idx = handlers.indexOf(handler);
    if (idx !== -1) handlers.splice(idx, 1);
  }
  function _emit(type, data) {
    const handlers = _listeners.get(type);
    if (!handlers) return;
    for (const handler of [...handlers]) {
      try {
        handler(data);
      } catch (err) {
        _log("error", `Handler error for "${type}":`, err);
      }
    }
  }
  function _flushQueue() {
    while (_messageQueue.length > 0 && _ws && _ws.readyState === WebSocket.OPEN) {
      _ws.send(_messageQueue.shift());
    }
  }
  function _scheduleReconnect(endpoint) {
    if (_reconnectAttempts >= Number(maxReconnectAttempts)) {
      _state = WS_STATES.DISCONNECTED;
      _log("error", `Max reconnect attempts (${maxReconnectAttempts}) reached`);
      _emit("_maxReconnect", { attempts: _reconnectAttempts });
      return;
    }
    const delay = Math.min(Number(reconnectDelayMs) * Math.pow(2, _reconnectAttempts), Number(maxReconnectDelayMs));
    _reconnectAttempts++;
    _log("debug", `Reconnect attempt ${_reconnectAttempts} in ${delay}ms`);
    _reconnectTimer = setTimeout(() => connect(endpoint), delay);
  }
  function _startHeartbeat() {
    _stopHeartbeat();
    _heartbeatTimer = setInterval(() => {
      if (_ws && _ws.readyState === WebSocket.OPEN) {
        _ws.send(JSON.stringify({ type: WS_EVENTS.HEARTBEAT }));
      }
    }, Number(heartbeatIntervalMs));
  }
  function _stopHeartbeat() {
    if (_heartbeatTimer) {
      clearInterval(_heartbeatTimer);
      _heartbeatTimer = null;
    }
  }
  function getState() {
    return _state;
  }
  function isConnected() {
    return _state === WS_STATES.CONNECTED && _ws && _ws.readyState === WebSocket.OPEN;
  }
  function getStats() {
    return {
      state: _state,
      reconnectAttempts: _reconnectAttempts,
      queuedMessages: _messageQueue.length,
      listenerCount: [..._listeners.values()].reduce((sum, h) => sum + h.length, 0)
    };
  }
  return {
    connect,
    disconnect,
    send,
    on,
    off,
    getState,
    isConnected,
    getStats
  };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, eventTypes: Object.keys(WS_EVENTS).length };
}
function healthCheck() {
  return {
    status: typeof WebSocket !== "undefined" ? "HEALTHY" : "DEGRADED",
    moduleId: MODULE_ID,
    version: VERSION,
    webSocketSupport: typeof WebSocket !== "undefined"
  };
}
var websocket_manager_default = { WebSocketManager, WS_EVENTS, WS_STATES, injectPorts, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  WS_EVENTS,
  WS_STATES,
  WebSocketManager,
  websocket_manager_default as default,
  healthCheck,
  info,
  injectPorts
};
