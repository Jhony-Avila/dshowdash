import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01.services.websocket";
const hasWindow = typeof window !== "undefined";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
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
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = "[WS]";
  if (level === "error") logger.error?.(prefix, ...args);
  else if (level === "info") logger.info?.(prefix, ...args);
  else logger.debug?.(prefix, ...args);
};
class WebSocketManager {
  constructor(options = {}) {
    this.url = options.url || null;
    this.reconnectDelay = options.reconnectDelay || 3e3;
    this.maxReconnects = options.maxReconnects || 5;
    this.onMessage = options.onMessage || (() => {
    });
    this.onConnect = options.onConnect || (() => {
    });
    this.onDisconnect = options.onDisconnect || (() => {
    });
    this.onError = options.onError || (() => {
    });
    this._ws = null;
    this._reconnectCount = 0;
    this._reconnectTimer = null;
    this._connected = false;
    this._intentionalClose = false;
  }
  connect(url) {
    if (url) this.url = url;
    if (!this.url) {
      _log("info", "URL nao definida");
      return;
    }
    this._intentionalClose = false;
    try {
      this._ws = new WebSocket(this.url);
      this._ws.onopen = () => this._onOpen();
      this._ws.onmessage = (e) => this._onMessage(e);
      this._ws.onerror = (e) => this._onError(e);
      this._ws.onclose = () => this._onClose();
    } catch (error) {
      _log("error", "Connection error:", error.message);
      this._scheduleReconnect();
    }
  }
  _onOpen() {
    this._connected = true;
    this._reconnectCount = 0;
    _log("info", "Connected");
    this.onConnect();
  }
  _onMessage(event) {
    try {
      const data = JSON.parse(event.data);
      this.onMessage(data);
    } catch {
      this.onMessage({ raw: event.data });
    }
  }
  _onError(event) {
    _log("error", "Error:", event.type || "unknown");
    this.onError(event);
  }
  _onClose() {
    this._connected = false;
    _log("info", "Disconnected");
    this.onDisconnect();
    if (!this._intentionalClose) this._scheduleReconnect();
  }
  _scheduleReconnect() {
    if (this._reconnectCount >= this.maxReconnects) {
      _log("info", "Max reconnects reached");
      return;
    }
    this._reconnectCount++;
    const delay = this.reconnectDelay * this._reconnectCount;
    _log("info", `Reconnecting in ${delay}ms (attempt ${this._reconnectCount})`);
    this._reconnectTimer = setTimeout(() => this.connect(), delay);
  }
  send(data) {
    if (!this._connected || !this._ws) return false;
    try {
      this._ws.send(typeof data === "string" ? data : JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }
  subscribe(channel) {
    return this.send({ action: "subscribe", channel });
  }
  unsubscribe(channel) {
    return this.send({ action: "unsubscribe", channel });
  }
  disconnect() {
    this._intentionalClose = true;
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }
    if (this._ws) {
      this._ws.close();
      this._ws = null;
    }
    this._connected = false;
  }
  isConnected() {
    return this._connected;
  }
  getState() {
    return this._ws ? this._ws.readyState : WebSocket.CLOSED;
  }
}
function createWebSocketManager(options = {}) {
  return new WebSocketManager(options);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}
var websocket_default = { WebSocketManager, createWebSocketManager, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  WebSocketManager,
  createWebSocketManager,
  websocket_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
