// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-audit-trail-lifecycle
// PURPOSE: Panel Audit Trail - Lifecycle
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   AUDIT_TRAIL_EVENTS from /core/runtime/events/catalog/audit-trail.events.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//   LIFECYCLE_STATES — exported value
//   mount() — exported function
//   unmount() — exported function
//   isMounted() — exported function
//   getState() — exported function
//   getLifecycleInfo() — exported function
//   markDegraded() — exported function
//   markFailed() — exported function
//   markReady() — exported function
//   healthCheck() — exported function
//   getVersion() — exported function
//   ... and 1 more exports
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   AUDIT_TRAIL_EVENTS.LIFECYCLE_STATE_CHANGED
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { AUDIT_TRAIL_EVENTS } from '/core/runtime/events/catalog/audit-trail.events.js';
import * as Controller from './controller.js';

const VERSION = '9.3.0-P2-ENTERPRISE';
const MODULE_ID = 'panel-audit-trail-lifecycle';
const hasWindow = typeof window !== 'undefined';
const hasDocument = typeof document !== 'undefined';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

const _initPorts = () => { Ports.init(); };
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const log = { info: (msg: string, ctx: Record<string, unknown> = {}) => { const logger = _getPort('logger'); if (logger?.info) logger.info(`[${MODULE_ID}]`, msg, ctx); }, warn: (msg: string, ctx: Record<string, unknown> = {}) => { const logger = _getPort('logger'); if (logger?.warn) logger.warn(`[${MODULE_ID}]`, msg, ctx); }, error: (msg: string, ctx: Record<string, unknown> = {}) => { const logger = _getPort('logger'); if (logger?.error) logger.error(`[${MODULE_ID}]`, msg, ctx); }, debug: (msg: string, ctx: Record<string, unknown> = {}) => { const logger = _getPort('logger'); if (logger?.debug) logger.debug(`[${MODULE_ID}]`, msg, ctx); } };

const LIFECYCLE_STATES = Object.freeze({ IDLE: 'IDLE', MOUNTING: 'MOUNTING', READY: 'READY', DEGRADED: 'DEGRADED', FAILED: 'FAILED', RECOVERING: 'RECOVERING', UNMOUNTED: 'UNMOUNTED' });

const _metrics = { mounts: 0, unmounts: 0, stateTransitions: 0, recoveryAttempts: 0, errors: 0 };
const _lifecycleState: { state: string; previousState: string | null; mountedAt: number | null; lastStateChange: number | null; lastError: string | null; degradedReasons: string[]; failedReason: string | null; container: HTMLElement | null; cssLoaded: boolean } = { state: LIFECYCLE_STATES.IDLE, previousState: null, mountedAt: null, lastStateChange: null, lastError: null, degradedReasons: [], failedReason: null, container: null, cssLoaded: false };
let _recoveryTimeoutId: ReturnType<typeof setTimeout> | null = null;
const CSS_PATH = '/components/panels/panel-audit-trail/styles/index.css';
const CSS_ID = 'pat-styles';

const _transitionTo = (newState: string, reason: string | null = null) => { const oldState = _lifecycleState.state; if (oldState === newState) return false; _lifecycleState.previousState = oldState; _lifecycleState.state = newState; _lifecycleState.lastStateChange = Date.now(); _metrics.stateTransitions++; if (newState === LIFECYCLE_STATES.DEGRADED && reason) { if (_lifecycleState.degradedReasons.indexOf(reason) === -1) _lifecycleState.degradedReasons.push(reason); } if (newState === LIFECYCLE_STATES.FAILED) _lifecycleState.failedReason = reason; if (newState === LIFECYCLE_STATES.READY) { _lifecycleState.degradedReasons = []; _lifecycleState.failedReason = null; } log.debug('Lifecycle state transition', { from: oldState, to: newState, reason }); const eb = _getPort('eventBus'); if (eb?.emit) eb.emit(AUDIT_TRAIL_EVENTS.LIFECYCLE_STATE_CHANGED, { oldState, newState, reason, timestamp: Date.now() }); return true; };

const markDegraded = (reason: string) => { if (_lifecycleState.state === LIFECYCLE_STATES.FAILED) return false; _transitionTo(LIFECYCLE_STATES.DEGRADED, reason); return true; };
const markFailed = (reason: string) => { _transitionTo(LIFECYCLE_STATES.FAILED, reason); _startRecovery(); return true; };
const markReady = () => { _lifecycleState.degradedReasons = []; _lifecycleState.failedReason = null; _transitionTo(LIFECYCLE_STATES.READY); _stopRecovery(); return true; };

const _startRecovery = () => { if (_recoveryTimeoutId) return; _recoveryTimeoutId = setTimeout(() => { _metrics.recoveryAttempts++; log.info('Attempting recovery', { attempt: _metrics.recoveryAttempts }); _transitionTo(LIFECYCLE_STATES.RECOVERING); if (_lifecycleState.container) { Controller.init(_lifecycleState.container).then(result => { if (result.ok) { return Controller.mount().then(() => { markReady(); log.info('Recovery successful'); }); } else { _transitionTo(LIFECYCLE_STATES.FAILED, 'recovery-init-failed'); _recoveryTimeoutId = null; _startRecovery(); } }).catch(e => { _metrics.errors++; _transitionTo(LIFECYCLE_STATES.FAILED, e.message); _recoveryTimeoutId = null; _startRecovery(); }); } }, 10000); };

const _stopRecovery = () => { if (_recoveryTimeoutId) { clearTimeout(_recoveryTimeoutId); _recoveryTimeoutId = null; } };

const _loadCSS = () => { if (_lifecycleState.cssLoaded || !hasDocument) return Promise.resolve({ ok: true }); const existing = document.getElementById(CSS_ID) || document.querySelector('link[href*="panel-audit-trail/styles"]'); if (existing) { _lifecycleState.cssLoaded = true; log.debug('CSS already loaded'); return Promise.resolve({ ok: true }); } return new Promise(resolve => { const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = CSS_PATH; link.id = CSS_ID; const timeout = setTimeout(() => { log.warn('CSS load timeout, continuing anyway'); _lifecycleState.cssLoaded = true; markDegraded('css-timeout'); resolve({ ok: true, warning: 'timeout' }); }, 5000); link.onload = () => { clearTimeout(timeout); _lifecycleState.cssLoaded = true; log.debug('CSS loaded'); resolve({ ok: true }); }; link.onerror = () => { clearTimeout(timeout); log.error('CSS load failed'); markDegraded('css-failed'); resolve({ ok: false, error: 'CSS load failed' }); }; document.head.appendChild(link); }); };

const _unloadCSS = () => { if (!hasDocument) return; const link = document.getElementById(CSS_ID); if (link) { link.remove(); _lifecycleState.cssLoaded = false; log.debug('CSS unloaded'); } };

// @ts-expect-error strict migration — TS2345
const mount = (container: HTMLElement, config: Record<string, unknown> = {}) => { if (_lifecycleState.state === LIFECYCLE_STATES.READY) { log.debug('Already mounted, skipping'); return Promise.resolve({ ok: true, warning: 'already_mounted', state: _lifecycleState.state }); } if (_lifecycleState.state === LIFECYCLE_STATES.MOUNTING) return Promise.resolve({ ok: false, error: 'Already mounting', state: _lifecycleState.state }); if (!container) { log.error('Container required'); return Promise.resolve({ ok: false, error: 'Container required' }); } _metrics.mounts++; _lifecycleState.container = container; _transitionTo(LIFECYCLE_STATES.MOUNTING); return _loadCSS().then((cssResult: { ok: boolean; error?: string; warning?: string }) => { if (!cssResult.ok) log.warn('CSS failed but continuing:', { error: cssResult.error }); return Controller.init(container); }).then(initResult => { if (!initResult.ok) { log.error('Controller init failed:', { error: initResult.error }); markFailed(initResult.error); return { ok: false, error: initResult.error, state: _lifecycleState.state }; } return Controller.mount(); }).then((mountResult: { ok?: boolean; error?: string }) => { if (mountResult && mountResult.ok === false) { log.error('Controller mount failed:', { error: mountResult.error }); markFailed(mountResult.error); return { ok: false, error: mountResult.error, state: _lifecycleState.state }; } _lifecycleState.mountedAt = Date.now(); _lifecycleState.lastError = null; if (_lifecycleState.degradedReasons.length > 0) _transitionTo(LIFECYCLE_STATES.DEGRADED); else _transitionTo(LIFECYCLE_STATES.READY); log.debug('Lifecycle mounted successfully', { state: _lifecycleState.state }); return { ok: true, state: _lifecycleState.state }; }).catch(err => { _metrics.errors++; log.error('Mount error:', err); _lifecycleState.lastError = err.message; markFailed(err.message); return { ok: false, error: err.message, state: _lifecycleState.state }; }); };

// @ts-expect-error strict migration — TS2345
const unmount = () => { if (_lifecycleState.state === LIFECYCLE_STATES.IDLE || _lifecycleState.state === LIFECYCLE_STATES.UNMOUNTED) return { ok: true, state: _lifecycleState.state }; _metrics.unmounts++; _stopRecovery(); try { Controller.unmount(); } catch (err) { log.error('Controller unmount error:', err); } _lifecycleState.mountedAt = null; _lifecycleState.container = null; _lifecycleState.degradedReasons = []; _lifecycleState.failedReason = null; _transitionTo(LIFECYCLE_STATES.UNMOUNTED); log.info('Lifecycle unmounted'); return { ok: true, state: _lifecycleState.state }; };

const isMounted = () => _lifecycleState.state === LIFECYCLE_STATES.READY || _lifecycleState.state === LIFECYCLE_STATES.DEGRADED;
const getState = () => _lifecycleState.state;
const getLifecycleInfo = () => ({ state: _lifecycleState.state, previousState: _lifecycleState.previousState, mounted: isMounted(), mountedAt: _lifecycleState.mountedAt, lastStateChange: _lifecycleState.lastStateChange, lastError: _lifecycleState.lastError, degradedReasons: _lifecycleState.degradedReasons.slice(), failedReason: _lifecycleState.failedReason, cssLoaded: _lifecycleState.cssLoaded, hasContainer: !!_lifecycleState.container });

const healthCheck = () => { const ps = Ports.snapshot(); const controllerHealth = Controller.healthCheck ? Controller.healthCheck() : null; const isReady = _lifecycleState.state === LIFECYCLE_STATES.READY; const isDegraded = _lifecycleState.state === LIFECYCLE_STATES.DEGRADED; const isFailed = _lifecycleState.state === LIFECYCLE_STATES.FAILED; const logger = _getPort('logger'); const checks: Record<string, boolean> = { stateValid: (Object.values(LIFECYCLE_STATES) as string[]).includes(_lifecycleState.state), mounted: isMounted(), notFailed: !isFailed, noRecentErrors: !_lifecycleState.lastError, cssLoaded: _lifecycleState.cssLoaded, hasContainer: !!_lifecycleState.container || _lifecycleState.state === LIFECYCLE_STATES.IDLE, controllerHealthy: (controllerHealth as Record<string, unknown>)?.status === 'healthy', loggerReady: !!logger, portsInitialized: !!(ps as Record<string, unknown>)._initialized }; let passed = 0; let total = 0; for (const k in checks) { if (checks.hasOwnProperty(k)) { total++; if (checks[k]) passed++; } } let status: 'HEALTHY' | 'UNHEALTHY' | 'DEGRADED' = 'HEALTHY'; if (isFailed) status = 'UNHEALTHY'; else if (isDegraded || passed < total) status = 'DEGRADED'; return { status, score: `${passed}/${total}`, healthy: passed >= 5, checks, state: _lifecycleState.state, degradedReasons: _lifecycleState.degradedReasons, failedReason: _lifecycleState.failedReason, uptime: _lifecycleState.mountedAt ? Date.now() - _lifecycleState.mountedAt : 0, controller: controllerHealth, metrics: { ..._metrics }, portsInitialized: ps._initialized, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; };

const getVersion = () => VERSION;
const info = () => { const ps = Ports.snapshot(); return { moduleId: MODULE_ID, version: VERSION, portsInitialized: ps._initialized, lifecycleInfo: getLifecycleInfo(), metrics: { ..._metrics }, timestamp: Date.now() }; };

export { VERSION, MODULE_ID, LIFECYCLE_STATES, mount, unmount, isMounted, getState, getLifecycleInfo, markDegraded, markFailed, markReady, healthCheck, getVersion, info };
export default { VERSION, MODULE_ID, LIFECYCLE_STATES, mount, unmount, isMounted, getState, getLifecycleInfo, markDegraded, markFailed, markReady, healthCheck, getVersion, info, injectPorts, getPorts };
