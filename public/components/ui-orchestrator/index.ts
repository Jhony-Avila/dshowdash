// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.9.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.ui-orchestrator
// PURPOSE: Central UI governance with intent resolution and permissions
// ───────────────────────────────────────────────────────────────
// @contract INIT - init(context) initializes orchestrator
// @contract EMIT - emit(intentId, meta, source) emits intent
// @contract RESOLVE - resolve(intentId, context) resolves intent
// @contract CAN_EXECUTE - canExecuteIntent(intentId) checks permission
// @contract SET_OVERRIDE - setOverride(intentId, rule) sets intent override
// @contract KEYBOARD - registerShortcut/unregisterShortcut for keyboard
// @contract DESTROY - destroy() destroys orchestrator
// @contract PORTS - injectPorts()/getPorts() for dependency injection
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: createCorePorts from /core/runtime/ports-profiles.js
// IMPORTS: ORCHESTRATOR_EVENTS from /core/runtime/events/index.js
// IMPORTS: isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
// IMPORTS: IntentResolver, OverlayAdapter, PermissionsAdapter, KeyboardAdapter
// PROVIDES: UIOrchestrator, getUIOrchestrator, createUIOrchestrator,
//           IntentResolver, OverlayAdapter, PermissionsAdapter, KeyboardAdapter,
//           RESOLUTION_ACTIONS, REGIONS, RESOLUTION_SOURCES, VERSION, MODULE_ID
// @changelog v2.9.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v2.8.0-STRICT-MODE: Strict mode integration
// @changelog v2.8.0-ENTERPRISE: ES6 modernization
// @changelog v2.7.1-ENTERPRISE: ES5 conversion
// @changelog P17WI: PortsFactory/PortsProfiles migration
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { ORCHESTRATOR_EVENTS } from '/core/runtime/events/catalog/orchestrator.events.js';
import { IntentResolver, createIntentResolver, RESOLUTION_ACTIONS, REGIONS, RESOLUTION_SOURCES } from './core/intent-resolver.js';
import * as intentRules from './manifest/intent-rules.js';
import * as telemetry from './telemetry/tracker.js';
import { OverlayAdapter, getOverlayAdapter, createOverlayAdapter } from './adapters/overlay-adapter.js';
import * as PermissionsAdapter from './adapters/permissions-adapter.js';
import * as KeyboardAdapter from './adapters/keyboard-adapter.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';

export const VERSION = '2.9.0-P2-ENTERPRISE';
export const MODULE_ID = 'ui-orchestrator';

const hasWindow = typeof window !== 'undefined';

// P17WI PORTS PATTERN (global logger)
const LoggerPorts = createCorePorts({ moduleId: `${MODULE_ID}.logger` });
const _initLoggerPort = (): unknown => LoggerPorts.init();
const _getLoggerPort = (): Record<string, unknown> => LoggerPorts.get('logger');

const _log = (level: string, ...args: unknown[]): void => { const logger = _getLoggerPort() as Record<string, unknown> | null; if (!logger) return; const fn = (logger[level] as ((...a: unknown[]) => void) | undefined) || (logger.info as (...a: unknown[]) => void); if (typeof fn === 'function') fn(`[${MODULE_ID}]`, ...args); };

const _exposeGlobal = (instance: UIOrchestrator): void => {
  if (hasWindow) {
    // DevTools sempre permitido
    const w = window as unknown as Record<string, unknown>;
    w.__dev = w.__dev || {};
    (w.__dev as Record<string, unknown>).UIOrchestrator = instance;

    // Exposição global só em modo não-strict
    if (!isStrict()) {
      w.UIOrchestrator = instance;
    } else {
      recordViolation('GLOBAL_EXPOSURE_BLOCKED', { module: MODULE_ID, target: 'window.UIOrchestrator' });
    }
  }
};
const _unexposeGlobal = (instance: UIOrchestrator): void => {
  if (hasWindow) {
    const w = window as unknown as Record<string, unknown>;
    const dev = w.__dev as Record<string, unknown> | undefined;
    if (dev?.UIOrchestrator === instance) delete dev.UIOrchestrator;
    if (w.UIOrchestrator === instance) delete w.UIOrchestrator;
  }
};

class UIOrchestrator {
  [key: string]: unknown;
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
    // P17WI: Instance-level ports usando factory
    this._Ports = createCorePorts({ moduleId: MODULE_ID });
  }

  _initPorts(): void { (this._Ports as { init: () => void }).init(); }
  _getPort(name: string): unknown { return (this._Ports as { get: (n: string) => unknown }).get(name); }
  injectPorts(ports: Record<string, unknown>): unknown { return (this._Ports as { inject: (p: Record<string, unknown>) => unknown }).inject(ports); }
  getPorts(): Record<string, unknown> { return (this._Ports as { snapshot: () => Record<string, unknown> }).snapshot(); }

  init(context: { ports?: { events?: unknown; globalState?: unknown; authState?: unknown; permissions?: unknown }; overlayLayer?: unknown } & Record<string, unknown> = {}): this {
    if (this._initialized) return this;
    _initLoggerPort();
    this._initPorts();
    const ports = this._Ports as { inject: (p: Record<string, unknown>) => void };
    if (context.ports?.events) ports.inject({ eventBus: context.ports.events });
    if (context.ports?.globalState) ports.inject({ globalState: context.ports.globalState });
    if (context.ports?.authState) ports.inject({ authState: context.ports.authState });
    if (context.overlayLayer) ports.inject({ overlayLayer: context.overlayLayer });
    this._events = this._getPort('eventBus');
    this._enforcePermissions = context.enforcePermissions !== false;
    this._keyboardEnabled = context.keyboardEnabled !== false;
    telemetry.init({ events: this._events as Record<string, unknown> });
    this._resolver = createIntentResolver({ rules: intentRules, ports: { events: this._events, telemetry, permissions: context.ports?.permissions || null } });
    (this._resolver as IntentResolver).init(intentRules);
    this._overlayAdapter = createOverlayAdapter({ ports: { events: this._events }, overlayLayer: this._getPort('overlayLayer') });
    PermissionsAdapter.init({ eventBus: this._events as Record<string, unknown> });
    this._permissionsAdapter = PermissionsAdapter;
    if (this._keyboardEnabled && hasWindow) { KeyboardAdapter.init({ orchestrator: this, eventBus: this._events as Record<string, unknown>, enabled: this._keyboardEnabled as boolean }); this._keyboardAdapter = KeyboardAdapter; }
    this._initialized = true;
    this._emit(ORCHESTRATOR_EVENTS.INIT, { version: VERSION, hasOverlayAdapter: true, hasPermissionsAdapter: true, hasKeyboardAdapter: this._keyboardEnabled });
    telemetry.track(ORCHESTRATOR_EVENTS.INIT, { version: VERSION, rulesCount: intentRules.getAllRules().length, permissionsConnected: PermissionsAdapter.isConnected(), keyboardEnabled: this._keyboardEnabled as boolean });
    _exposeGlobal(this);
    return this;
  }

  emit(intentId: string, meta: Record<string, unknown> = {}, source = 'unknown'): Promise<Record<string, unknown>> {
    return new Promise((resolve) => {
      if (!this._initialized) { _log('warn', 'Não inicializado. Chamando init()...'); this.init(); }
      (this._metrics as { intentsEmitted: number }).intentsEmitted++;
      if (this._enforcePermissions) {
        const rule = intentRules.getRule(intentId);
        if (rule) {
          const permCheck = (this._permissionsAdapter as typeof PermissionsAdapter).canExecuteIntent(rule) as { allowed: boolean; reason: string; required: unknown };
          if (!permCheck.allowed) {
            (this._metrics as { intentsDenied: number }).intentsDenied++;
            telemetry.track(ORCHESTRATOR_EVENTS.INTENT_DENIED, { intentId, reason: permCheck.reason, required: permCheck.required as Record<string, unknown> });
            this._emit(ORCHESTRATOR_EVENTS.INTENT_DENIED, { intentId, allowed: permCheck.allowed, reason: permCheck.reason, required: permCheck.required, source });
            resolve({ success: false, denied: true, reason: permCheck.reason, required: permCheck.required as Record<string, unknown> });
            return;
          }
        }
      }
      const context = { source, meta, userId: meta.userId || this._getUserId(), role: meta.role || this._getUserRole(), timestamp: Date.now() };
      telemetry.track(ORCHESTRATOR_EVENTS.INTENT_EMITTED, { intentId, source });
      (this._resolver as IntentResolver).resolve(intentId, context).then((resolution: Record<string, unknown>) => {
        if (resolution.success) { (this._metrics as { intentsResolved: number }).intentsResolved++; this._emit(ORCHESTRATOR_EVENTS.INTENT_RESOLVED, { intentId, resolution, source }); resolve(resolution); }
        else { (this._metrics as { intentsFailed: number }).intentsFailed++; this._emit(ORCHESTRATOR_EVENTS.INTENT_FAILED, { intentId, reason: resolution.reason, source }); telemetry.track(ORCHESTRATOR_EVENTS.INTENT_FAILED, { intentId, reason: resolution.reason as string }); resolve(resolution); }
      });
    });
  }

  resolve(intentId: string, context: Record<string, unknown> = {}): Promise<Record<string, unknown>> { if (!this._initialized) this.init(); return (this._resolver as IntentResolver).resolve(intentId, context); }
  canExecuteIntent(intentId: string): Record<string, unknown> { const rule = intentRules.getRule(intentId); if (!rule) return { allowed: true, reason: 'no-rule' }; return (this._permissionsAdapter as typeof PermissionsAdapter).canExecuteIntent(rule) as Record<string, unknown>; }
  getAccessibleIntents(): Record<string, unknown>[] { const allRules = intentRules.getAllRules(); return (this._permissionsAdapter as typeof PermissionsAdapter).filterAccessibleRules(allRules).map((r: Record<string, unknown>) => ({ intentId: r.intentId, action: r.action, targetId: r.targetId, label: r.label, icon: r.icon })); }

  getDeniedIntents(): Record<string, unknown>[] { const protectedRules = intentRules.getProtectedRules(); return protectedRules.filter((rule: Record<string, unknown>) => !(this._permissionsAdapter as typeof PermissionsAdapter).canExecuteIntent(rule).allowed).map((r: Record<string, unknown>) => ({ intentId: r.intentId, label: r.label, requiresPermission: r.requiresPermission, minLevel: r.minLevel })); }
  setEnforcePermissions(enforce: boolean): void { this._enforcePermissions = enforce; telemetry.track(ORCHESTRATOR_EVENTS.PERMISSIONS_ENFORCEMENT, { enforce }); }
  hasIntent(intentId: string): boolean { return intentRules.hasRule(intentId) || ((this._resolver as IntentResolver)._dbOverrides as Map<string, unknown>).has(intentId); }

  listIntents(): Record<string, unknown>[] { return intentRules.getAllRules().map((r: Record<string, unknown>) => ({ intentId: r.intentId, action: r.action, targetId: r.targetId, label: r.label, icon: r.icon, shortcut: r.shortcut || null, protected: !!(r.requiresPermission || r.minLevel), accessible: (this._permissionsAdapter as typeof PermissionsAdapter).canExecuteIntent(r).allowed })); }
  listIntentsBySource(source: string): Record<string, unknown>[] { return intentRules.getRulesBySource(source); }
  listKeyboardShortcuts(): unknown[] { return (this._keyboardAdapter as typeof KeyboardAdapter | null)?.listShortcuts?.() || intentRules.getKeyboardRules?.() || []; }
  emitByShortcut(shortcut: string, source = 'keyboard'): Promise<Record<string, unknown>> { const rule = intentRules.getRuleByShortcut?.(shortcut); if (!rule) return Promise.resolve({ success: false, reason: 'no-shortcut-rule' }); return this.emit(rule.intentId as string, { shortcut }, source); }
  registerShortcut(shortcut: string, callback: (ctx: { shortcut: string }) => void, label = ''): () => boolean { return (this._keyboardAdapter as typeof KeyboardAdapter | null)?.register?.(shortcut, callback, label) || (() => false); }
  unregisterShortcut(shortcut: string): boolean { return (this._keyboardAdapter as typeof KeyboardAdapter | null)?.unregister?.(shortcut) || false; }
  simulateShortcut(shortcut: string): Promise<Record<string, unknown>> { return (this._keyboardAdapter as typeof KeyboardAdapter | null)?.simulate?.(shortcut) || Promise.resolve({ executed: false, reason: 'no-adapter' }); }
  enableKeyboard(): void { (this._keyboardAdapter as typeof KeyboardAdapter | null)?.enable?.(); this._keyboardEnabled = true; }
  disableKeyboard(): void { (this._keyboardAdapter as typeof KeyboardAdapter | null)?.disable?.(); this._keyboardEnabled = false; }
  isKeyboardEnabled(): boolean { return (this._keyboardEnabled as boolean) && !!((this._keyboardAdapter as typeof KeyboardAdapter | null)?.isEnabled?.()); }
  setOverride(intentId: string, rule: Record<string, unknown>): void { (this._resolver as IntentResolver).setOverride(intentId, rule); this._emit(ORCHESTRATOR_EVENTS.OVERRIDE_SET, { intentId }); }
  removeOverride(intentId: string): boolean { return (this._resolver as IntentResolver).removeOverride(intentId); }
  getOverrides(): unknown[] { return (this._resolver as IntentResolver).getOverrides(); }
  clearCache(): void { (this._resolver as IntentResolver).clearCache(); }
  connectOverlayLayer(overlayLayer: unknown): void { (this._Ports as { inject: (p: Record<string, unknown>) => void }).inject({ overlayLayer }); }

  _getUserId(): unknown { const gs = this._getPort('globalState') as { get?: (k: string) => unknown } | null; if (gs?.get) { const id = gs.get('auth.userId'); if (id) return id; } const authState = this._getPort('authState') as { userId?: unknown } | null; return authState?.userId || null; }

  _getUserRole(): unknown { const gs = this._getPort('globalState') as { get?: (k: string) => unknown } | null; if (gs?.get) { const role = gs.get('auth.role'); if (role) return role; } const authState = this._getPort('authState') as { role?: unknown } | null; return authState?.role || 'guest'; }

  _emit(event: string, data: Record<string, unknown> = {}): void { (this._events as { emit?: (e: string, d: unknown) => void } | null)?.emit?.(event, { ...data, source: MODULE_ID, timestamp: Date.now() }); }
  getResolver(): IntentResolver { return this._resolver as IntentResolver; }
  getOverlayAdapter(): unknown { return this._overlayAdapter; }
  getPermissionsAdapter(): typeof PermissionsAdapter { return this._permissionsAdapter as typeof PermissionsAdapter; }
  getKeyboardAdapter(): typeof KeyboardAdapter { return this._keyboardAdapter as typeof KeyboardAdapter; }
  getRules(): typeof intentRules { return intentRules; }
  getMetrics(): Record<string, unknown> { return { intentsEmitted: (this._metrics as { intentsEmitted: number }).intentsEmitted, intentsResolved: (this._metrics as { intentsResolved: number }).intentsResolved, intentsFailed: (this._metrics as { intentsFailed: number }).intentsFailed, intentsDenied: (this._metrics as { intentsDenied: number }).intentsDenied, resolver: (this._resolver as IntentResolver | null)?.getMetrics?.() || {}, overlayAdapter: (this._overlayAdapter as { getMetrics?: () => unknown } | null)?.getMetrics?.() || {}, permissionsAdapter: (this._permissionsAdapter as typeof PermissionsAdapter | null)?.getMetrics?.() || {}, keyboardAdapter: (this._keyboardAdapter as typeof KeyboardAdapter | null)?.getMetrics?.() || {}, telemetry: telemetry.getMetrics() }; }
  info(): Record<string, unknown> { return { version: VERSION, moduleId: MODULE_ID, initialized: this._initialized, enforcePermissions: this._enforcePermissions, keyboardEnabled: this._keyboardEnabled, metrics: this.getMetrics(), rulesInfo: intentRules.info(), resolverInfo: (this._resolver as IntentResolver | null)?.info?.() || null, overlayAdapterInfo: (this._overlayAdapter as { info?: () => unknown } | null)?.info?.() || null, permissionsAdapterInfo: (this._permissionsAdapter as typeof PermissionsAdapter | null)?.info?.() || null, keyboardAdapterInfo: (this._keyboardAdapter as typeof KeyboardAdapter | null)?.info?.() || null, telemetryInfo: telemetry.info(), portsInitialized: (this._Ports as { isInitialized: () => boolean }).isInitialized(), usingP18EventsConstants: true }; }

  healthCheck(): Record<string, unknown> {
    const logger = _getLoggerPort();
    const checks = { initialized: this._initialized as boolean, resolverHealthy: ((this._resolver as IntentResolver | null)?.healthCheck?.() as { status?: string } | undefined)?.status === 'healthy', rulesHealthy: (intentRules.healthCheck() as { status: string }).status === 'healthy', overlayAdapterHealthy: ((this._overlayAdapter as { healthCheck?: () => { status?: string } } | null)?.healthCheck?.() as { status?: string } | undefined)?.status !== 'unhealthy', permissionsAdapterHealthy: ((this._permissionsAdapter as typeof PermissionsAdapter | null)?.healthCheck?.() as { status?: string } | undefined)?.status !== 'UNHEALTHY', keyboardAdapterHealthy: !(this._keyboardEnabled as boolean) || ((this._keyboardAdapter as typeof KeyboardAdapter | null)?.healthCheck?.() as { status?: string } | undefined)?.status !== 'UNHEALTHY', hasEvents: !!this._events, loggerReady: !!logger, portsInitialized: (this._Ports as { isInitialized: () => boolean }).isInitialized(), p18EventsCompliant: true };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed >= 8 ? 'healthy' : passed >= 5 ? 'degraded' : 'unhealthy', score: `${passed}/10`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: (this._Ports as { isInitialized: () => boolean }).isInitialized() };
  }

  destroy(): void { (this._resolver as IntentResolver | null)?.destroy?.(); (this._overlayAdapter as { destroy?: () => void } | null)?.destroy?.(); (this._keyboardAdapter as { destroy?: () => void } | null)?.destroy?.(); this._initialized = false; _unexposeGlobal(this); }
}

let _instance: UIOrchestrator | null = null;
const getUIOrchestrator = (): UIOrchestrator => { if (!_instance) _instance = new UIOrchestrator(); return _instance; };
const createUIOrchestrator = (context: Record<string, unknown> = {}): UIOrchestrator => { const orchestrator = new UIOrchestrator(); orchestrator.init(context); return orchestrator; };

_exposeGlobal(getUIOrchestrator());

export { UIOrchestrator, IntentResolver, OverlayAdapter, PermissionsAdapter, KeyboardAdapter, RESOLUTION_ACTIONS, REGIONS, RESOLUTION_SOURCES };
export default { UIOrchestrator, getUIOrchestrator, createUIOrchestrator, IntentResolver, OverlayAdapter, PermissionsAdapter, KeyboardAdapter, RESOLUTION_ACTIONS, REGIONS, RESOLUTION_SOURCES, VERSION, MODULE_ID };
