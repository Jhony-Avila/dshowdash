import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "orchestrator-audit-emitter";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => {
  Ports.init();
};
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const AUDIT_EVENTS = {
  ACTION: "audit:orchestrator:action",
  PRESET_APPLIED: "audit:orchestrator:preset-applied",
  PRESET_DENIED: "audit:orchestrator:preset-denied",
  LAYOUT_RESET: "audit:orchestrator:layout-reset",
  REFRESH_ALL: "audit:orchestrator:refresh-all",
  SCHEDULER_TOGGLED: "audit:orchestrator:scheduler-toggled",
  PANEL_TOGGLED: "audit:orchestrator:panel-toggled",
  ACCESS_DENIED: "audit:orchestrator:access-denied",
  MOUNT: "audit:orchestrator:mount",
  UNMOUNT: "audit:orchestrator:unmount",
  ERROR: "audit:orchestrator:error"
};
const _getUserContext = () => {
  const gs = _getPort("globalState");
  if (!gs?.get) return { userId: null, userName: null };
  const auth = gs.get("auth") || {};
  return { userId: auth.userId || auth.id, userName: auth.userName || auth.name || auth.email, sessionId: auth.sessionId, level: auth.level || auth.userLevel || 0 };
};
const _emit = (eventType, data = {}) => {
  _initPorts();
  const bus = _getPort("eventBus");
  if (!bus?.emit) return false;
  const user = _getUserContext();
  const payload = { eventType, source: "panel-orchestrator", moduleId: MODULE_ID, userId: user.userId, userName: user.userName, sessionId: user.sessionId, userLevel: user.level, timestamp: Date.now(), ...data };
  bus.emit(eventType, payload);
  bus.emit(AUDIT_EVENTS.ACTION, payload);
  return true;
};
const emitPresetApplied = (presetId, context) => _emit(AUDIT_EVENTS.PRESET_APPLIED, { action: "apply-preset", presetId, context: context || {}, severity: "INFO" });
const emitPresetDenied = (presetId, reason) => _emit(AUDIT_EVENTS.PRESET_DENIED, { action: "apply-preset-denied", presetId, reason, severity: "WARNING" });
const emitLayoutReset = () => _emit(AUDIT_EVENTS.LAYOUT_RESET, { action: "layout-reset", severity: "INFO" });
const emitRefreshAll = (panelCount) => _emit(AUDIT_EVENTS.REFRESH_ALL, { action: "refresh-all", panelCount, severity: "INFO" });
const emitSchedulerToggled = (newState) => _emit(AUDIT_EVENTS.SCHEDULER_TOGGLED, { action: "scheduler-toggle", newState, severity: "INFO" });
const emitPanelToggled = (panelId, visible) => _emit(AUDIT_EVENTS.PANEL_TOGGLED, { action: "panel-toggle", panelId, visible, severity: "INFO" });
const emitAccessDenied = (reason) => _emit(AUDIT_EVENTS.ACCESS_DENIED, { action: "access-denied", reason, severity: "SECURITY" });
const emitMount = (mountTime) => _emit(AUDIT_EVENTS.MOUNT, { action: "mount", mountTime, severity: "INFO" });
const emitUnmount = () => _emit(AUDIT_EVENTS.UNMOUNT, { action: "unmount", severity: "INFO" });
const emitError = (error, context) => _emit(AUDIT_EVENTS.ERROR, { action: "error", error: error?.message || String(error), context: context || {}, severity: "ERROR" });
const getVersion = () => VERSION;
var audit_emitter_default = { VERSION, MODULE_ID, AUDIT_EVENTS, emitPresetApplied, emitPresetDenied, emitLayoutReset, emitRefreshAll, emitSchedulerToggled, emitPanelToggled, emitAccessDenied, emitMount, emitUnmount, emitError, getVersion, injectPorts, getPorts };
export {
  AUDIT_EVENTS,
  MODULE_ID,
  VERSION,
  audit_emitter_default as default,
  emitAccessDenied,
  emitError,
  emitLayoutReset,
  emitMount,
  emitPanelToggled,
  emitPresetApplied,
  emitPresetDenied,
  emitRefreshAll,
  emitSchedulerToggled,
  emitUnmount,
  getPorts,
  getVersion,
  injectPorts
};
