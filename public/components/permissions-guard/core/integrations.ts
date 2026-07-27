// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.2.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: permissions-guard.core.integrations
// PURPOSE: Permissions Guard - Integrations
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   AUTH_EVENTS, PERMISSIONS_EVENTS from /core/runtime/events/index.js
//   _log, _metrics from ./logger.js
//   PermissionsLifecycle from ./lifecycle.js
//   * as Tracker from ../telemetry/tracker.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   _integrationsStatus — exported value
//   getIntegrationsStatus() — exported function
//   setupGlobalStateIntegration() — exported function
//   cleanupGlobalStateIntegration() — exported function
//   setupOrchestratorIntegration() — exported function
//   cleanupOrchestratorIntegration() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   AUTH_EVENTS.LOGIN_SUCCESS
//   AUTH_EVENTS.LOGOUT
//   AUTH_EVENTS.LOGOUT_SUCCESS
//   AUTH_EVENTS.SESSION_CHECKED
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { AUTH_EVENTS } from '/core/runtime/events/catalog/auth.events.js';
import { PERMISSIONS_EVENTS } from '/core/runtime/events/catalog/permissions.events.js';

// @ts-expect-error TS migration - TS2614
import { _log, _metrics as _metricsRaw } from './logger.js';

// @ts-expect-error TS migration - TS2614
import { PermissionsLifecycle } from './lifecycle.js';

const _metrics = _metricsRaw as any;
import * as Tracker from '../telemetry/tracker.js';

export const VERSION = '5.2.0-P18EC';
export const MODULE_ID = 'permissions-guard.core.integrations';

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

let globalStateCleanups: Array<() => void> = [];
let orchestratorCleanups: Array<() => void> = [];
const _integrationsStatus = { globalStateConnected: false, orchestratorConnected: false, globalStateSubscribeValid: false, orchestratorHandlersCount: 0 };

function getIntegrationsStatus() { return Object.assign({}, _integrationsStatus); }

function setupGlobalStateIntegration() { const globalState = _getPort('globalState'); if (typeof window === 'undefined' || !globalState) { Tracker.track('permissions:global-state:not-available'); _integrationsStatus.globalStateConnected = false; _integrationsStatus.globalStateSubscribeValid = false; return false; } try { const unsubscribeSession = globalState.subscribe((session: Record<string, unknown> & { isAuthenticated?: boolean; user?: Record<string, unknown> }) => { if (session && session.isAuthenticated && session.user) { PermissionsLifecycle.syncFromGlobalState(session); Tracker.track(PERMISSIONS_EVENTS.GLOBAL_STATE_SESSION_LOADED, { userId: session.user ? session.user.id : undefined }); } else if (session && session.isAuthenticated === false) { PermissionsLifecycle.reset(); Tracker.track(PERMISSIONS_EVENTS.GLOBAL_STATE_SESSION_CLEARED); } }, 'session'); if (typeof unsubscribeSession === 'function') { globalStateCleanups.push(unsubscribeSession); _integrationsStatus.globalStateConnected = true; _integrationsStatus.globalStateSubscribeValid = true; Tracker.track(PERMISSIONS_EVENTS.GLOBAL_STATE_CONNECTED); _log('info', 'GlobalState integration configurada'); return true; } else { _log('warn', 'GlobalState.subscribe retornou valor inválido'); _integrationsStatus.globalStateConnected = false; _integrationsStatus.globalStateSubscribeValid = false; return false; } } catch (e) { _metrics.errors++; _log('error', 'Erro ao configurar GlobalState integration:', e); _integrationsStatus.globalStateConnected = false; return false; } }

function cleanupGlobalStateIntegration() { globalStateCleanups.forEach(cleanup => { try { if (typeof cleanup === 'function') cleanup(); } catch (e) { _metrics.errors++; } }); globalStateCleanups = []; _integrationsStatus.globalStateConnected = false; _integrationsStatus.globalStateSubscribeValid = false; }

function setupOrchestratorIntegration() { const eventBus = _getPort('eventBus'); if (typeof window === 'undefined' || !eventBus) { Tracker.track('permissions:orchestrator:not-available'); _integrationsStatus.orchestratorConnected = false; _integrationsStatus.orchestratorHandlersCount = 0; return false; } let handlersRegistered = 0; try { const loginHandler = (data: Record<string, unknown> & { user?: Record<string, unknown> }) => { if (data && data.user) { PermissionsLifecycle.loadFromUser(Object.assign({}, data.user, { _source: 'eventbus-login' })); Tracker.track(PERMISSIONS_EVENTS.ORCHESTRATOR_USER_LOADED, { userId: data.user ? data.user.id : undefined }); } }; eventBus.on(AUTH_EVENTS.LOGIN_SUCCESS, loginHandler); orchestratorCleanups.push(() => { const eb = _getPort('eventBus'); if (eb && eb.off) eb.off(AUTH_EVENTS.LOGIN_SUCCESS, loginHandler); }); handlersRegistered++; const logoutHandler = () => { PermissionsLifecycle.reset(); Tracker.track(PERMISSIONS_EVENTS.ORCHESTRATOR_USER_CLEARED); }; eventBus.on(AUTH_EVENTS.LOGOUT, logoutHandler); eventBus.on(AUTH_EVENTS.LOGOUT_SUCCESS, logoutHandler); orchestratorCleanups.push(() => { const eb = _getPort('eventBus'); if (eb && eb.off) eb.off(AUTH_EVENTS.LOGOUT, logoutHandler); }); orchestratorCleanups.push(() => { const eb = _getPort('eventBus'); if (eb && eb.off) eb.off(AUTH_EVENTS.LOGOUT_SUCCESS, logoutHandler); }); handlersRegistered += 2; const sessionCheckedHandler = (data: Record<string, unknown> & { authenticated?: boolean; user?: Record<string, unknown> }) => { if (data && data.authenticated && data.user) { PermissionsLifecycle.loadFromUser(Object.assign({}, data.user, { _source: 'eventbus-session-checked' })); } else if (data && !data.authenticated) { PermissionsLifecycle.reset(); } }; eventBus.on(AUTH_EVENTS.SESSION_CHECKED, sessionCheckedHandler); orchestratorCleanups.push(() => { const eb = _getPort('eventBus'); if (eb && eb.off) eb.off(AUTH_EVENTS.SESSION_CHECKED, sessionCheckedHandler); }); handlersRegistered++; _integrationsStatus.orchestratorConnected = handlersRegistered > 0; _integrationsStatus.orchestratorHandlersCount = handlersRegistered; Tracker.track(PERMISSIONS_EVENTS.ORCHESTRATOR_CONNECTED, { handlersRegistered }); _log('info', 'Orchestrator integration configurada', { handlersRegistered }); return true; } catch (e) { _metrics.errors++; _log('error', 'Erro ao configurar Orchestrator integration:', e); _integrationsStatus.orchestratorConnected = false; _integrationsStatus.orchestratorHandlersCount = 0; return false; } }

function cleanupOrchestratorIntegration() { orchestratorCleanups.forEach(cleanup => { try { if (typeof cleanup === 'function') cleanup(); } catch (e) { _metrics.errors++; } }); orchestratorCleanups = []; _integrationsStatus.orchestratorConnected = false; _integrationsStatus.orchestratorHandlersCount = 0; }

function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() }; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, checks: { ready: true, portsInitialized: Ports.isInitialized() }, portsInitialized: Ports.isInitialized(), timestamp: Date.now() }; }

export { _integrationsStatus, getIntegrationsStatus, setupGlobalStateIntegration, cleanupGlobalStateIntegration, setupOrchestratorIntegration, cleanupOrchestratorIntegration, info, healthCheck };
