import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { ORCHESTRATOR_EVENTS } from "/core/runtime/events/catalog/orchestrator.events.js";
import { IntentResolver, createIntentResolver, RESOLUTION_ACTIONS, REGIONS, RESOLUTION_SOURCES } from "./core/intent-resolver.js";
import * as intentRules from "./manifest/intent-rules.js";
import * as telemetry from "./telemetry/tracker.js";
import { OverlayAdapter, createOverlayAdapter } from "./adapters/overlay-adapter.js";
import * as PermissionsAdapter from "./adapters/permissions-adapter.js";
import * as KeyboardAdapter from "./adapters/keyboard-adapter.js";
import { isStrict, recordViolation } from "/core/runtime/enterprise/strict-mode.js";
const VERSION = "2.9.0-P2-ENTERPRISE";
const MODULE_ID = "ui-orchestrator";
const hasWindow = typeof window !== "undefined";
const LoggerPorts = createCorePorts({ moduleId: `${MODULE_ID}.logger` });
const _initLoggerPort = () => LoggerPorts.init();
const _getLoggerPort = () => LoggerPorts.get("logger");
const _log = (level, ...args) => {
  const logger = _getLoggerPort();
  if (!logger) return;
  const fn = logger[level] || logger.info;
  if (typeof fn === "function") fn(`[${MODULE_ID}]`, ...args);
};
const _exposeGlobal = (instance) => {
  if (hasWindow) {
    const w = window;
    w.__dev = w.__dev || {};
    w.__dev.UIOrchestrator = instance;
    if (!isStrict()) {
      w.UIOrchestrator = instance;
    } else {
      recordViolation("GLOBAL_EXPOSURE_BLOCKED", { module: MODULE_ID, target: "window.UIOrchestrator" });
    }
  }
};
const _unexposeGlobal = (instance) => {
  if (hasWindow) {
    const w = window;
    const dev = w.__dev;
    if (dev?.UIOrchestrator === instance) delete dev.UIOrchestrator;
    if (w.UIOrchestrator === instance) delete w.UIOrchestrator;
  }
};
class UIOrchestrator {
  constructor() {
    this._resolver = null;
    this._overlayAdapter = null;
    this._permissionsAdapter = null;
    this._keyboardAdapter = null;
    this._events = null;
    this._initialized = false;
    this._enforcePermissions = true;
    this._keyboardEnabled = true;
    this._metrics = { intentsEmitted: 0, intentsResolved: 0, intentsFailed: 0, intentsDenied: 0 };
    this._Ports = createCorePorts({ moduleId: MODULE_ID });
  }
  _initPorts() {
    this._Ports.init();
  }
  _getPort(name) {
    return this._Ports.get(name);
  }
  injectPorts(ports) {
    return this._Ports.inject(ports);
  }
  getPorts() {
    return this._Ports.snapshot();
  }
  init(context = {}) {
    if (this._initialized) return this;
    _initLoggerPort();
    this._initPorts();
    const ports = this._Ports;
    if (context.ports?.events) ports.inject({ eventBus: context.ports.events });
    if (context.ports?.globalState) ports.inject({ globalState: context.ports.globalState });
    if (context.ports?.authState) ports.inject({ authState: context.ports.authState });
    if (context.overlayLayer) ports.inject({ overlayLayer: context.overlayLayer });
    this._events = this._getPort("eventBus");
    this._enforcePermissions = context.enforcePermissions !== false;
    this._keyboardEnabled = context.keyboardEnabled !== false;
    telemetry.init({ events: this._events });
    this._resolver = createIntentResolver({ rules: intentRules, ports: { events: this._events, telemetry, permissions: context.ports?.permissions || null } });
    this._resolver.init(intentRules);
    this._overlayAdapter = createOverlayAdapter({ ports: { events: this._events }, overlayLayer: this._getPort("overlayLayer") });
    PermissionsAdapter.init({ eventBus: this._events });
    this._permissionsAdapter = PermissionsAdapter;
    if (this._keyboardEnabled && hasWindow) {
      KeyboardAdapter.init({ orchestrator: this, eventBus: this._events, enabled: this._keyboardEnabled });
      this._keyboardAdapter = KeyboardAdapter;
    }
    this._initialized = true;
    this._emit(ORCHESTRATOR_EVENTS.INIT, { version: VERSION, hasOverlayAdapter: true, hasPermissionsAdapter: true, hasKeyboardAdapter: this._keyboardEnabled });
    telemetry.track(ORCHESTRATOR_EVENTS.INIT, { version: VERSION, rulesCount: intentRules.getAllRules().length, permissionsConnected: PermissionsAdapter.isConnected(), keyboardEnabled: this._keyboardEnabled });
    _exposeGlobal(this);
    return this;
  }
  emit(intentId, meta = {}, source = "unknown") {
    return new Promise((resolve) => {
      if (!this._initialized) {
        _log("warn", "N\xE3o inicializado. Chamando init()...");
        this.init();
      }
      this._metrics.intentsEmitted++;
      if (this._enforcePermissions) {
        const rule = intentRules.getRule(intentId);
        if (rule) {
          const permCheck = this._permissionsAdapter.canExecuteIntent(rule);
          if (!permCheck.allowed) {
            this._metrics.intentsDenied++;
            telemetry.track(ORCHESTRATOR_EVENTS.INTENT_DENIED, { intentId, reason: permCheck.reason, required: permCheck.required });
            this._emit(ORCHESTRATOR_EVENTS.INTENT_DENIED, { intentId, allowed: permCheck.allowed, reason: permCheck.reason, required: permCheck.required, source });
            resolve({ success: false, denied: true, reason: permCheck.reason, required: permCheck.required });
            return;
          }
        }
      }
      const context = { source, meta, userId: meta.userId || this._getUserId(), role: meta.role || this._getUserRole(), timestamp: Date.now() };
      telemetry.track(ORCHESTRATOR_EVENTS.INTENT_EMITTED, { intentId, source });
      this._resolver.resolve(intentId, context).then((resolution) => {
        if (resolution.success) {
          this._metrics.intentsResolved++;
          this._emit(ORCHESTRATOR_EVENTS.INTENT_RESOLVED, { intentId, resolution, source });
          resolve(resolution);
        } else {
          this._metrics.intentsFailed++;
          this._emit(ORCHESTRATOR_EVENTS.INTENT_FAILED, { intentId, reason: resolution.reason, source });
          telemetry.track(ORCHESTRATOR_EVENTS.INTENT_FAILED, { intentId, reason: resolution.reason });
          resolve(resolution);
        }
      });
    });
  }
  resolve(intentId, context = {}) {
    if (!this._initialized) this.init();
    return this._resolver.resolve(intentId, context);
  }
  canExecuteIntent(intentId) {
    const rule = intentRules.getRule(intentId);
    if (!rule) return { allowed: true, reason: "no-rule" };
    return this._permissionsAdapter.canExecuteIntent(rule);
  }
  getAccessibleIntents() {
    const allRules = intentRules.getAllRules();
    return this._permissionsAdapter.filterAccessibleRules(allRules).map((r) => ({ intentId: r.intentId, action: r.action, targetId: r.targetId, label: r.label, icon: r.icon }));
  }
  getDeniedIntents() {
    const protectedRules = intentRules.getProtectedRules();
    return protectedRules.filter((rule) => !this._permissionsAdapter.canExecuteIntent(rule).allowed).map((r) => ({ intentId: r.intentId, label: r.label, requiresPermission: r.requiresPermission, minLevel: r.minLevel }));
  }
  setEnforcePermissions(enforce) {
    this._enforcePermissions = enforce;
    telemetry.track(ORCHESTRATOR_EVENTS.PERMISSIONS_ENFORCEMENT, { enforce });
  }
  hasIntent(intentId) {
    return intentRules.hasRule(intentId) || this._resolver._dbOverrides.has(intentId);
  }
  listIntents() {
    return intentRules.getAllRules().map((r) => ({ intentId: r.intentId, action: r.action, targetId: r.targetId, label: r.label, icon: r.icon, shortcut: r.shortcut || null, protected: !!(r.requiresPermission || r.minLevel), accessible: this._permissionsAdapter.canExecuteIntent(r).allowed }));
  }
  listIntentsBySource(source) {
    return intentRules.getRulesBySource(source);
  }
  listKeyboardShortcuts() {
    return this._keyboardAdapter?.listShortcuts?.() || intentRules.getKeyboardRules?.() || [];
  }
  emitByShortcut(shortcut, source = "keyboard") {
    const rule = intentRules.getRuleByShortcut?.(shortcut);
    if (!rule) return Promise.resolve({ success: false, reason: "no-shortcut-rule" });
    return this.emit(rule.intentId, { shortcut }, source);
  }
  registerShortcut(shortcut, callback, label = "") {
    return this._keyboardAdapter?.register?.(shortcut, callback, label) || (() => false);
  }
  unregisterShortcut(shortcut) {
    return this._keyboardAdapter?.unregister?.(shortcut) || false;
  }
  simulateShortcut(shortcut) {
    return this._keyboardAdapter?.simulate?.(shortcut) || Promise.resolve({ executed: false, reason: "no-adapter" });
  }
  enableKeyboard() {
    this._keyboardAdapter?.enable?.();
    this._keyboardEnabled = true;
  }
  disableKeyboard() {
    this._keyboardAdapter?.disable?.();
    this._keyboardEnabled = false;
  }
  isKeyboardEnabled() {
    return this._keyboardEnabled && !!this._keyboardAdapter?.isEnabled?.();
  }
  setOverride(intentId, rule) {
    this._resolver.setOverride(intentId, rule);
    this._emit(ORCHESTRATOR_EVENTS.OVERRIDE_SET, { intentId });
  }
  removeOverride(intentId) {
    return this._resolver.removeOverride(intentId);
  }
  getOverrides() {
    return this._resolver.getOverrides();
  }
  clearCache() {
    this._resolver.clearCache();
  }
  connectOverlayLayer(overlayLayer) {
    this._Ports.inject({ overlayLayer });
  }
  _getUserId() {
    const gs = this._getPort("globalState");
    if (gs?.get) {
      const id = gs.get("auth.userId");
      if (id) return id;
    }
    const authState = this._getPort("authState");
    return authState?.userId || null;
  }
  _getUserRole() {
    const gs = this._getPort("globalState");
    if (gs?.get) {
      const role = gs.get("auth.role");
      if (role) return role;
    }
    const authState = this._getPort("authState");
    return authState?.role || "guest";
  }
  _emit(event, data = {}) {
    this._events?.emit?.(event, { ...data, source: MODULE_ID, timestamp: Date.now() });
  }
  getResolver() {
    return this._resolver;
  }
  getOverlayAdapter() {
    return this._overlayAdapter;
  }
  getPermissionsAdapter() {
    return this._permissionsAdapter;
  }
  getKeyboardAdapter() {
    return this._keyboardAdapter;
  }
  getRules() {
    return intentRules;
  }
  getMetrics() {
    return { intentsEmitted: this._metrics.intentsEmitted, intentsResolved: this._metrics.intentsResolved, intentsFailed: this._metrics.intentsFailed, intentsDenied: this._metrics.intentsDenied, resolver: this._resolver?.getMetrics?.() || {}, overlayAdapter: this._overlayAdapter?.getMetrics?.() || {}, permissionsAdapter: this._permissionsAdapter?.getMetrics?.() || {}, keyboardAdapter: this._keyboardAdapter?.getMetrics?.() || {}, telemetry: telemetry.getMetrics() };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, initialized: this._initialized, enforcePermissions: this._enforcePermissions, keyboardEnabled: this._keyboardEnabled, metrics: this.getMetrics(), rulesInfo: intentRules.info(), resolverInfo: this._resolver?.info?.() || null, overlayAdapterInfo: this._overlayAdapter?.info?.() || null, permissionsAdapterInfo: this._permissionsAdapter?.info?.() || null, keyboardAdapterInfo: this._keyboardAdapter?.info?.() || null, telemetryInfo: telemetry.info(), portsInitialized: this._Ports.isInitialized(), usingP18EventsConstants: true };
  }
  healthCheck() {
    const logger = _getLoggerPort();
    const checks = { initialized: this._initialized, resolverHealthy: this._resolver?.healthCheck?.()?.status === "healthy", rulesHealthy: intentRules.healthCheck().status === "healthy", overlayAdapterHealthy: this._overlayAdapter?.healthCheck?.()?.status !== "unhealthy", permissionsAdapterHealthy: this._permissionsAdapter?.healthCheck?.()?.status !== "UNHEALTHY", keyboardAdapterHealthy: !this._keyboardEnabled || this._keyboardAdapter?.healthCheck?.()?.status !== "UNHEALTHY", hasEvents: !!this._events, loggerReady: !!logger, portsInitialized: this._Ports.isInitialized(), p18EventsCompliant: true };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed >= 8 ? "healthy" : passed >= 5 ? "degraded" : "unhealthy", score: `${passed}/10`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: this._Ports.isInitialized() };
  }
  destroy() {
    this._resolver?.destroy?.();
    this._overlayAdapter?.destroy?.();
    this._keyboardAdapter?.destroy?.();
    this._initialized = false;
    _unexposeGlobal(this);
  }
}
let _instance = null;
const getUIOrchestrator = () => {
  if (!_instance) _instance = new UIOrchestrator();
  return _instance;
};
const createUIOrchestrator = (context = {}) => {
  const orchestrator = new UIOrchestrator();
  orchestrator.init(context);
  return orchestrator;
};
_exposeGlobal(getUIOrchestrator());
var ui_orchestrator_default = { UIOrchestrator, getUIOrchestrator, createUIOrchestrator, IntentResolver, OverlayAdapter, PermissionsAdapter, KeyboardAdapter, RESOLUTION_ACTIONS, REGIONS, RESOLUTION_SOURCES, VERSION, MODULE_ID };
export {
  IntentResolver,
  KeyboardAdapter,
  MODULE_ID,
  OverlayAdapter,
  PermissionsAdapter,
  REGIONS,
  RESOLUTION_ACTIONS,
  RESOLUTION_SOURCES,
  UIOrchestrator,
  VERSION,
  ui_orchestrator_default as default
};
