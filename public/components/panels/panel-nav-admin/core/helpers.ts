// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.core.helpers
// PURPOSE: Panel Nav Admin - Helpers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   AUTH_INTENTS from /core/runtime/events/catalog/auth.events.js
//   PANEL_ID, PANEL_NAME from ./contracts.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//   PANEL_ID — exported value
//   PANEL_NAME — exported value
//   metrics — exported value
//   loadCSS() — exported function
//   isAuthenticated() — exported function
//   ensureAuth() — exported function
//   checkPanelAccess() — exported function
//   getUserLevel() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   event
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { AUTH_INTENTS } from '/core/runtime/events/catalog/auth.events.js';

// @ts-expect-error TS migration - TS2614
import { PANEL_ID, PANEL_NAME } from './contracts.js';
import * as tracker from '../telemetry/tracker.js';

const VERSION = '9.3.0-P2-ENTERPRISE';
const MODULE_ID = 'panel-nav-admin.core.helpers';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => { Ports.init(); };
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: unknown) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

_initPorts();

const metrics: { mountCount: number; refreshCount: number; errorCount: number; authFailCount: number; lastMount: number | null; lastRefresh: number | null } = { mountCount: 0, refreshCount: 0, errorCount: 0, authFailCount: 0, lastMount: null, lastRefresh: null };

const _emit = (event: string, data: Record<string, unknown> = {}) => { const eb = _getPort('eventBus'); if (eb?.emit) eb.emit(event, { source: MODULE_ID, timestamp: Date.now(), ...data }); };

const loadCSS = () => { const cssPath = '/components/panels/panel-nav-admin/styles.css'; const al = _getPort('assetLoader'); if (al?.loadCSS) { al.loadCSS(cssPath); } else if (typeof document !== 'undefined' && !document.querySelector(`link[href="${cssPath}"]`)) { const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = cssPath; document.head.appendChild(link); } };

const isAuthenticated = () => { const auth = _getPort('auth'); return auth?.isAuthenticated ? auth.isAuthenticated() : false; };


const ensureAuth = (action = 'operation') => { if (isAuthenticated()) return true; tracker.trackAuthRequired(action); _emit(AUTH_INTENTS.LOGIN, { reason: 'session-expired', action }); return false; };

const checkPanelAccess = () => { const auth = _getPort('auth'); if (!auth?.isAuthenticated || !auth.isAuthenticated()) return false; if (auth.canAccessPanel) return auth.canAccessPanel(PANEL_ID); if (auth.can) return auth.can('nav:admin') || auth.can('admin:full'); return getUserLevel() >= 100; };

const getUserLevel = () => { const auth = _getPort('auth'); return auth?.getLevel ? auth.getLevel() : 0; };

const healthCheck = (isInitialized: boolean, container: HTMLElement | null, stateHealth: Record<string, unknown>, adapterHealth: Record<string, unknown>) => { const ps = Ports.snapshot(); const checks: Record<string, boolean> = { initialized: isInitialized, mounted: !!container, authenticated: isAuthenticated(), stateHealthy: stateHealth?.status === 'HEALTHY', adapterHealthy: adapterHealth?.status === 'HEALTHY', portsInitialized: ps._initialized }; let passed = 0, total = 0; for (const k in checks) { total++; if (checks[k]) passed++; } return { status: passed === total ? 'HEALTHY' : passed >= 3 ? 'DEGRADED' : 'UNHEALTHY', score: `${passed}/${total}`, checks, state: stateHealth, adapter: adapterHealth, metrics: { ...metrics }, version: VERSION, timestamp: Date.now() }; };

const info = (isInitialized: boolean, container: HTMLElement | null, healthCheckResult: unknown) => { const ps = Ports.snapshot(); return { id: PANEL_ID, name: PANEL_NAME, version: VERSION, moduleId: MODULE_ID, initialized: isInitialized, mounted: !!container, portsInitialized: ps._initialized, metrics: { ...metrics }, healthCheck: healthCheckResult, timestamp: Date.now() }; };

export { VERSION, MODULE_ID, PANEL_ID, PANEL_NAME, metrics, loadCSS, isAuthenticated, ensureAuth, checkPanelAccess, getUserLevel, healthCheck, info };
