// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.9.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.navigation.navigation-broker
// PURPOSE: Enterprise Intent Pipeline - Pipeline de navegação
// ───────────────────────────────────────────────────────────────
// @contract INTENT_PIPELINE - Pipeline único de navegação
// @contract P2_POLICY - Integrado com NavigationAccessPolicy
// ───────────────────────────────────────────────────────────────
// IMPORTS: createCorePorts, navigation-intent, events, navigation-access-policy
// PROVIDES: navigate, executeIntent, addMiddleware, healthCheck
// @changelog v1.9.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// @changelog v1.8.0-P2-ENTERPRISE: NavigationAccessPolicy integration
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { INTENT_TYPES, NAV_MODES, INTENT_STATUS, createIntent, validateIntent, cloneIntent } from './navigation-intent.js';
import type { NavigationIntent, NavigationIntentMeta, NavigationIntentState, NavigationIntentPolicy, NavigationIntentOptions } from './navigation-intent.js';
import { NAV_EVENTS, NAV_INTENTS } from '/core/runtime/events/catalog/nav.events.js';
import { UI_EVENTS } from '/core/runtime/events/catalog/ui.events.js';
import { recordNavigation, NAV_ACCESS_TYPES, NAV_SOURCES } from '/core/policies/navigation-access-policy.js';

const MODULE_ID = 'core.navigation.navigation-broker';
const VERSION = '1.8.0-P2-ENTERPRISE';

const Ports = createCorePorts({ moduleId: MODULE_ID });

const _initPorts = (): void => { Ports.init(); };
const _getPort = (name: string): unknown => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>): boolean => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

type GuardFn = (intent: NavigationIntent) => boolean | { allowed: boolean; reason?: string } | undefined;

const _state: {
  initialized: boolean;
  processing: boolean;
  history: { intent: NavigationIntent | null; timestamp: number }[];
  maxHistory: number;
  guards: GuardFn[];
  blockedIntents: number;
  successIntents: number;
  errorIntents: number;
} = { initialized: false, processing: false, history: [], maxHistory: 50, guards: [], blockedIntents: 0, successIntents: 0, errorIntents: 0 };

const _metrics = { received: 0, resolved: 0, executed: 0, blocked: 0, errors: 0 };
let _cleanups: (() => void)[] = [];

const _log = (level: string, message: string, data: Record<string, unknown> = {}): void => { const logger = _getPort('logger') as Record<string, (msg: string, data: unknown) => void> | null; logger?.[level]?.(`[${MODULE_ID}] ${message}`, data); };
const _track = (eventName: string, payload: Record<string, unknown>): void => { try { const tk = _getPort('telemetry') as { track?: (event: string, data: unknown) => void } | null; tk?.track?.(eventName, { moduleId: MODULE_ID, ...payload }); } catch (e) { } };
const _emit = (eventName: string, data: Record<string, unknown> = {}): void => { const eb = _getPort('eventBus') as { emit?: (event: string, data: unknown) => void } | null; eb?.emit?.(eventName, { source: MODULE_ID, timestamp: Date.now(), ...data }); };
const _addToHistory = (intent: NavigationIntent): void => { _state.history.unshift({ intent: cloneIntent(intent), timestamp: Date.now() }); if (_state.history.length > _state.maxHistory) _state.history.pop(); };

const _checkGuards = (intent: NavigationIntent): { allowed: boolean; reason?: string } => { for (let i = 0; i < _state.guards.length; i++) { try { const result = _state.guards[i](intent); if (result === false) return { allowed: false, reason: `Guard ${i} blocked` }; if (result && typeof result === 'object' && result.allowed === false) return result as { allowed: false; reason?: string }; } catch (e) { _log('error', 'Guard error', { index: i, error: (e as Error).message }); } } return { allowed: true }; };
const _checkPermissions = (intent: NavigationIntent): { allowed: boolean; reason?: string } => { if (!intent.policy?.permissions?.length) return { allowed: true }; const pg = _getPort('permissionsGuard') as { hasPermission?: (perm: string) => boolean } | null; if (!pg?.hasPermission) return { allowed: true, reason: 'PermissionsGuard not available' }; for (const perm of (intent.policy.permissions as string[])) { if (!pg.hasPermission(perm)) return { allowed: false, reason: `Missing permission: ${perm}` }; } return { allowed: true }; };

const _executeNavigation = (intent: NavigationIntent): { ok: boolean; via?: string; error?: string } => {
  const router = _getPort('router') as { navigate?: (path: string | null, opts: Record<string, unknown>) => void } | null;
  try {
    _emit(NAV_EVENTS.NAVIGATE_START, { intentId: intent.intentId, target: intent.target as unknown as Record<string, unknown> });

    // P2: Record navigation via NavigationAccessPolicy
    const _recordNav = (type: string, via: string): void => {
      try {
        recordNavigation({
          type,
          source: NAV_SOURCES.NAVIGATION_BROKER,
          target: intent.target.value || intent.target.type,
          reason: (intent.meta as NavigationIntentMeta)?.reason || 'intent-execution',
          caller: (intent.meta as NavigationIntentMeta)?.source || MODULE_ID,
          moduleId: MODULE_ID,
          isUIComponent: false
        });
      } catch (e) { /* policy not initialized yet */ }
    };

    switch (intent.target.type) {
      case INTENT_TYPES.BACK:
        if (typeof window !== 'undefined' && window.history) {
          _recordNav(NAV_ACCESS_TYPES.BACK, 'history.back');
          window.history.back();
          return { ok: true, via: 'history.back' };
        }
        break;
      case INTENT_TYPES.FORWARD:
        if (typeof window !== 'undefined' && window.history) {
          _recordNav(NAV_ACCESS_TYPES.FORWARD, 'history.forward');
          window.history.forward();
          return { ok: true, via: 'history.forward' };
        }
        break;
      case INTENT_TYPES.ROUTE: case INTENT_TYPES.PANEL: case INTENT_TYPES.HOME: {
        const path = intent.target.value;
        if (router?.navigate) {
          _recordNav(NAV_ACCESS_TYPES.SOFT, 'RouterGlobal');
          router.navigate(path, { replace: intent.replace, source: 'navigation-broker', intentId: intent.intentId });
          return { ok: true, via: 'RouterGlobal' };
        }
        if (typeof window !== 'undefined') {
          _recordNav(NAV_ACCESS_TYPES.HARD, 'hash-fallback');
          _emit(UI_EVENTS.HARD_NAV, { path, reason: 'No RouterGlobal available', source: MODULE_ID, intentId: intent.intentId });
          window.location.hash = path || '';
          return { ok: true, via: 'hash-fallback' };
        }
        break;
      }
      case INTENT_TYPES.EXTERNAL:
        if (typeof window !== 'undefined' && intent.target.value) {
          _recordNav(NAV_ACCESS_TYPES.EXTERNAL, 'location.href');
          _emit(UI_EVENTS.HARD_NAV, { path: intent.target.value, reason: 'External navigation', source: MODULE_ID, intentId: intent.intentId });
          window.location.href = intent.target.value;
          return { ok: true, via: 'location.href' };
        }
        break;
    }
    return { ok: false, error: 'No execution path available' };
  } catch (e) { return { ok: false, error: (e as Error).message }; }
};

const processIntent = (intentOrOptions: NavigationIntent | NavigationIntentOptions): NavigationIntent => {
  _metrics.received++;
  const intent = (intentOrOptions as NavigationIntent).intentId ? (intentOrOptions as NavigationIntent) : createIntent(intentOrOptions as NavigationIntentOptions);
  _emit(NAV_EVENTS.INTENT_RECEIVED, { intentId: intent.intentId, target: intent.target as unknown as Record<string, unknown>, meta: intent.meta as unknown as Record<string, unknown> });
  _log('info', 'Intent received', { intentId: intent.intentId, target: intent.target as unknown as Record<string, unknown> });
  const validation = validateIntent(intent);
  if (!validation.valid) { intent.status = INTENT_STATUS.ERROR; intent.result = { ok: false, errors: validation.errors }; _metrics.errors++; _emit(NAV_EVENTS.INTENT_ERROR, { intentId: intent.intentId, errors: validation.errors }); _track('navigation:intent:error', { intentId: intent.intentId, errors: validation.errors }); _addToHistory(intent); return intent; }
  if ((intent.policy as NavigationIntentPolicy)?.enforceGuards !== false) { const guardResult = _checkGuards(intent); if (!guardResult.allowed) { intent.status = INTENT_STATUS.BLOCKED; intent.result = { ok: false, reason: guardResult.reason, blockedBy: 'guard' }; intent.resolvedAt = Date.now(); _metrics.blocked++; _state.blockedIntents++; _emit(NAV_EVENTS.INTENT_BLOCKED, { intentId: intent.intentId, reason: guardResult.reason }); _emit(NAV_EVENTS.NAVIGATE_BLOCKED, { intentId: intent.intentId, reason: guardResult.reason }); _track('navigation:intent:blocked', { intentId: intent.intentId, reason: guardResult.reason || '' }); _addToHistory(intent); return intent; } }
  const permResult = _checkPermissions(intent);
  if (!permResult.allowed) { intent.status = INTENT_STATUS.BLOCKED; intent.result = { ok: false, reason: permResult.reason, blockedBy: 'permissions' }; intent.resolvedAt = Date.now(); _metrics.blocked++; _state.blockedIntents++; _emit(NAV_EVENTS.INTENT_BLOCKED, { intentId: intent.intentId, reason: permResult.reason }); _emit(NAV_EVENTS.NAVIGATE_BLOCKED, { intentId: intent.intentId, reason: permResult.reason }); _track('navigation:intent:blocked', { intentId: intent.intentId, reason: permResult.reason || '' }); _addToHistory(intent); return intent; }
  intent.status = INTENT_STATUS.RESOLVED; intent.resolvedAt = Date.now(); _metrics.resolved++; _emit(NAV_EVENTS.INTENT_RESOLVED, { intentId: intent.intentId, target: intent.target as unknown as Record<string, unknown> });
  intent.status = INTENT_STATUS.EXECUTING; const execResult = _executeNavigation(intent); intent.executedAt = Date.now();
  if (execResult.ok) { intent.status = INTENT_STATUS.SUCCESS; intent.result = execResult; _metrics.executed++; _state.successIntents++; _emit(NAV_EVENTS.NAVIGATE_SUCCESS, { intentId: intent.intentId, target: intent.target as unknown as Record<string, unknown>, via: execResult.via || '' }); _track('navigation:intent:success', { intentId: intent.intentId, via: execResult.via || '', latency: intent.executedAt - intent.createdAt }); _log('info', 'Intent executed', { intentId: intent.intentId, via: execResult.via || '' }); }
  else { intent.status = INTENT_STATUS.ERROR; intent.result = execResult; _metrics.errors++; _state.errorIntents++; _emit(NAV_EVENTS.NAVIGATE_ERROR, { intentId: intent.intentId, error: execResult.error || '' }); _track('navigation:intent:error', { intentId: intent.intentId, error: execResult.error || '' }); _log('error', 'Intent execution failed', { intentId: intent.intentId, error: execResult.error || '' }); }
  _addToHistory(intent); return intent;
};

const navigate = (path: string, options: { mode?: string; replace?: boolean; meta?: NavigationIntentMeta; state?: NavigationIntentState; policy?: NavigationIntentPolicy } = {}): NavigationIntent => processIntent({ target: { type: INTENT_TYPES.ROUTE, value: path }, mode: options.mode, replace: options.replace, meta: options.meta, state: options.state, policy: options.policy });
const registerGuard = (guardFn: GuardFn): (() => void) => { if (typeof guardFn === 'function') { _state.guards.push(guardFn); return () => { const idx = _state.guards.indexOf(guardFn); if (idx >= 0) _state.guards.splice(idx, 1); }; } return () => {}; };

// P18EC: Listener migrado para NAV_INTENTS.NAVIGATE (contrato canônico de comandos)
const _setupListeners = (): void => {
  const eb = _getPort('eventBus') as { on?: (event: string, handler: (data: NavigationIntentOptions) => void) => void; off?: (event: string, handler: (data: NavigationIntentOptions) => void) => void } | null;
  if (!eb?.on) return;
  const intentHandler = (data: NavigationIntentOptions & { path?: string }): void => { if (data?.path || data?.target) processIntent(data); };
  eb.on(NAV_INTENTS.NAVIGATE, intentHandler);
  _cleanups.push(() => { eb.off?.(NAV_INTENTS.NAVIGATE, intentHandler); });
};

const init = (ctx: { ports?: Record<string, unknown> } | null): { ok: boolean; alreadyInitialized?: boolean; version?: string } => { if (_state.initialized) return { ok: true, alreadyInitialized: true }; _initPorts(); if (ctx?.ports) injectPorts(ctx.ports); _setupListeners(); const tk = _getPort('telemetry') as { register?: (info: Record<string, unknown>) => void } | null; tk?.register?.({ id: MODULE_ID, version: VERSION, healthCheck, info }); _state.initialized = true; _emit(NAV_EVENTS.BROKER_READY, { version: VERSION }); _track('navigation-broker:init', { version: VERSION }); _log('info', 'NavigationBroker initialized (P18EC compliant)'); return { ok: true, version: VERSION }; };
const cleanup = (): { ok: boolean } => { for (const c of _cleanups) { try { c(); } catch (e) { } } _cleanups = []; _state.initialized = false; _state.guards = []; _state.history = []; return { ok: true }; };
const healthCheck = () => { const issues: { code: string; severity: string; message: string }[] = []; let score = 100; if (!_state.initialized) { issues.push({ code: 'NOT_INIT', severity: 'crit', message: 'Not initialized' }); score -= 50; } if (!_getPort('eventBus')) { issues.push({ code: 'NO_EVENTBUS', severity: 'warn', message: 'EventBus not available' }); score -= 20; } if (!_getPort('router')) { issues.push({ code: 'NO_ROUTER', severity: 'warn', message: 'RouterGlobal not available' }); score -= 15; } if (_state.blockedIntents > _state.successIntents * 0.5) { issues.push({ code: 'HIGH_BLOCK_RATE', severity: 'warn', message: 'High block rate' }); score -= 10; } const status = score >= 80 ? 'HEALTHY' : score >= 50 ? 'DEGRADED' : 'UNHEALTHY'; return { status, score: Math.max(0, score), moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: 'crit' }, hasEventBus: { ok: !!_getPort('eventBus'), severity: 'warn' }, hasRouter: { ok: !!_getPort('router'), severity: 'warn' }, portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, issues, metrics: _metrics }; };
const getNavigationDiagnostics = () => ({ history: _state.history.slice(0, 20), metrics: { ..._metrics }, guards: _state.guards.length, blockedIntents: _state.blockedIntents, successIntents: _state.successIntents, errorIntents: _state.errorIntents });
const info = () => ({ moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, metrics: _metrics, guardsCount: _state.guards.length, historySize: _state.history.length, portsInitialized: Ports.isInitialized() });

export { MODULE_ID, VERSION, INTENT_TYPES, NAV_MODES, INTENT_STATUS, init, cleanup, processIntent, navigate, registerGuard, getNavigationDiagnostics, healthCheck, info };
export default { MODULE_ID, VERSION, INTENT_TYPES, NAV_MODES, INTENT_STATUS, init, cleanup, processIntent, navigate, registerGuard, getNavigationDiagnostics, healthCheck, info, injectPorts, getPorts };
