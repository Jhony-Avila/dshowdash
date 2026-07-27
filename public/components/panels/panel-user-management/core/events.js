import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { LOCAL_EVENTS, MODULE_ID } from "./contracts.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const Ports = createPanelPorts({ moduleId: `${MODULE_ID}.events` });
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
const EXTENSION_EVENTS = {
  OPEN_AUDIT_TRAIL: `${MODULE_ID}:open:audit-trail`,
  OPEN_SESSIONS: `${MODULE_ID}:open:sessions`,
  OPEN_PERMISSIONS: `${MODULE_ID}:open:permissions`,
  BULK_SELECT: `${MODULE_ID}:bulk:select`,
  BULK_ACTION: `${MODULE_ID}:bulk:action`,
  EXPORT_START: `${MODULE_ID}:export:start`,
  EXPORT_COMPLETE: `${MODULE_ID}:export:complete`,
  ADVANCED_FILTER_OPEN: `${MODULE_ID}:filter:advanced:open`,
  ADVANCED_FILTER_APPLY: `${MODULE_ID}:filter:advanced:apply`
};
function emitExtensionEvent(eventName, data) {
  _initPorts();
  data = data || {};
  const eb = _getPort("eventBus");
  if (!eb || !eb.emit) return false;
  const payload = Object.assign({ moduleId: MODULE_ID, event: eventName, timestamp: Date.now() }, data);
  eb.emit(eventName, payload);
  return true;
}
const extensionHandlers = {
  openAuditTrail(userId) {
    return emitExtensionEvent(EXTENSION_EVENTS.OPEN_AUDIT_TRAIL, { userId });
  },
  openSessions(userId) {
    return emitExtensionEvent(EXTENSION_EVENTS.OPEN_SESSIONS, { userId });
  },
  openPermissions(userId) {
    return emitExtensionEvent(EXTENSION_EVENTS.OPEN_PERMISSIONS, { userId });
  },
  startExport(format, filters) {
    return emitExtensionEvent(EXTENSION_EVENTS.EXPORT_START, { format: format || "csv", filters: filters || {} });
  }
};
function healthCheck() {
  _initPorts();
  const checks = { portsInitialized: Ports.isInitialized(), eventBusAvailable: !!_getPort("eventBus"), extensionEventsConfigured: Object.keys(EXTENSION_EVENTS).length > 0 };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", moduleId: `${MODULE_ID}.events`, version: VERSION, score: `${passed}/${total}`, checks, eventsCount: Object.keys(EXTENSION_EVENTS).length, p25Compliant: true, timestamp: Date.now() };
}
function info() {
  return { moduleId: `${MODULE_ID}.events`, version: VERSION, extensionEventsCount: Object.keys(EXTENSION_EVENTS).length, localEventsCount: Object.keys(LOCAL_EVENTS).length, p25Compliant: true };
}
var events_default = { LOCAL_EVENTS, EXTENSION_EVENTS, emitExtensionEvent, extensionHandlers, VERSION, injectPorts, getPorts, healthCheck, info };
export {
  EXTENSION_EVENTS,
  LOCAL_EVENTS,
  VERSION,
  events_default as default,
  emitExtensionEvent,
  extensionHandlers,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
