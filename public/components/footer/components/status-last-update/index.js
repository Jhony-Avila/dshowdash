import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "components.footer.status-last-update";
const VERSION = "2.3.0-P18EC";
const UPDATE_EVENTS = { CHANGED: "footer:last-update:changed" };
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
const _state = { initialized: false, lastUpdate: null, source: null };
const _metrics = { updates: 0 };
function _emit(eventName, data) {
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(eventName, Object.assign({ source: MODULE_ID }, data || {}));
}
function setLastUpdate(timestamp, source) {
  _state.lastUpdate = timestamp || Date.now();
  _state.source = source || "unknown";
  _metrics.updates++;
  _emit(UPDATE_EVENTS.CHANGED, { timestamp: _state.lastUpdate, source: _state.source });
  return { ok: true, timestamp: _state.lastUpdate };
}
function getLastUpdate() {
  return { timestamp: _state.lastUpdate, source: _state.source };
}
function getFormattedTime() {
  if (!_state.lastUpdate) return "--:--";
  const d = new Date(_state.lastUpdate);
  return d.toLocaleTimeString();
}
function getTimeSince() {
  if (!_state.lastUpdate) return null;
  return Date.now() - _state.lastUpdate;
}
function init(ctx) {
  if (_state.initialized) return { ok: true, alreadyInitialized: true };
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  _state.initialized = true;
  setLastUpdate(Date.now(), "init");
  return { ok: true, version: VERSION };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", score: 100, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: "info" }, hasUpdate: { ok: !!_state.lastUpdate, severity: "info" }, portsInitialized: { ok: Ports.isInitialized(), severity: "info" } }, metrics: _metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, lastUpdate: _state.lastUpdate, source: _state.source, metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
function FooterStatusLastUpdate(options) {
  options = options || {};
  this._container = null;
  this._mounted = false;
  this._element = null;
  this._intervalId = null;
}
FooterStatusLastUpdate.prototype.mount = function(container, config, integrations) {
  const self = this;
  if (this._mounted) return Promise.resolve();
  init();
  this._container = container;
  this._element = document.createElement("div");
  this._element.className = "dsd-footer__last-update dsd-chip dsd-chip--sm";
  this._element.title = "Last Update";
  this._element.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><span class="dsd-footer__update-time">${getFormattedTime()}</span>`;
  this._container.appendChild(this._element);
  this._mounted = true;
  if (this._intervalId) {
    clearInterval(this._intervalId);
    this._intervalId = null;
  }
  this._intervalId = setInterval(() => {
    const timeEl = self._element.querySelector(".dsd-footer__update-time");
    if (timeEl) timeEl.textContent = getFormattedTime();
  }, 1e3);
  return Promise.resolve();
};
FooterStatusLastUpdate.prototype.destroy = function() {
  if (this._intervalId) {
    clearInterval(this._intervalId);
    this._intervalId = null;
  }
  if (this._element && this._element.parentNode) {
    this._element.parentNode.removeChild(this._element);
  }
  this._element = null;
  this._mounted = false;
};
FooterStatusLastUpdate.prototype.isLoaded = function() {
  return this._mounted;
};
FooterStatusLastUpdate.prototype.getLastUpdate = () => getLastUpdate();
FooterStatusLastUpdate.prototype.setLastUpdate = (timestamp, source) => setLastUpdate(timestamp, source);
FooterStatusLastUpdate.prototype.getFormattedTime = () => getFormattedTime();
FooterStatusLastUpdate.prototype.healthCheck = () => healthCheck();
FooterStatusLastUpdate.prototype.info = () => info();
var status_last_update_default = FooterStatusLastUpdate;
export {
  FooterStatusLastUpdate,
  MODULE_ID,
  UPDATE_EVENTS,
  VERSION,
  status_last_update_default as default,
  getFormattedTime,
  getLastUpdate,
  getPorts,
  getTimeSince,
  healthCheck,
  info,
  init,
  injectPorts,
  setLastUpdate
};
