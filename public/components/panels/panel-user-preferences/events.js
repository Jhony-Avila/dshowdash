import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { isStrict } from "/core/runtime/enterprise/strict-mode.js";
const MODULE_ID = "panel-user-preferences.events";
const VERSION = "9.3.0-P2-ENTERPRISE";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
let _portsInitialized = false;
function _initPorts() {
  if (_portsInitialized) return;
  Ports.init();
  _portsInitialized = true;
}
function _getEventBus() {
  _initPorts();
  const bus = Ports.get("eventBus");
  if (bus) return bus;
  if (window.Core?.windowAdapter?.get) {
    const wBus = window.Core.windowAdapter.get("EventBus");
    if (wBus) return wBus;
  }
  return null;
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const EVENTS = {
  PREFERENCE_CHANGED: "user-preferences:changed",
  PREFERENCE_SAVED: "user-preferences:saved",
  PREFERENCE_RESET: "user-preferences:reset",
  THEME_CHANGED: "user-preferences:theme-changed",
  LANGUAGE_CHANGED: "user-preferences:language-changed",
  AVATAR_UPDATED: "user-preferences:avatar-updated"
};
function emit(eventName, data = {}) {
  const bus = _getEventBus();
  if (bus?.emit) {
    bus.emit(eventName, { ...data, source: MODULE_ID, timestamp: Date.now() });
  }
}
function on(eventName, handler) {
  const bus = _getEventBus();
  if (bus?.on) {
    bus.on(eventName, handler);
    return () => off(eventName, handler);
  }
  return () => {
  };
}
function off(eventName, handler) {
  const bus = _getEventBus();
  if (bus?.off) {
    bus.off(eventName, handler);
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, strictMode: isStrict(), p0Enterprise: true, portsInitialized: _portsInitialized };
}
var events_default = { EVENTS, emit, on, off, injectPorts, getPorts, info, MODULE_ID, VERSION };
export {
  EVENTS,
  MODULE_ID,
  VERSION,
  events_default as default,
  emit,
  getPorts,
  info,
  injectPorts,
  off,
  on
};
