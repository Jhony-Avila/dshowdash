// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-audit-trail.core.helpers
// PURPOSE: Panel Audit Trail - Helpers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   MODULE_ID as CONTROLLER_MODULE_ID, PRESET_DAYS from ./constants.js
//   TABS from ./contracts.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//   log() — exported function
//   checkAuth() — exported function
//   getCurrentLogs() — exported function
//   delay() — exported function
//   formatDateFilename() — exported function
//   getPresetDays() — exported function
//   buildInlineFilters() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { MODULE_ID as CONTROLLER_MODULE_ID, PRESET_DAYS } from './constants.js';
import { TABS } from './contracts.js';

const VERSION = '9.3.0-P2-ENTERPRISE';
const MODULE_ID = 'panel-audit-trail.core.helpers';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

const _initPorts = () => { Ports.init(); };
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

_initPorts();

const log = (level: string, ...args: unknown[]) => { const logger = _getPort('logger') as Record<string, unknown> | null; if (!logger) return; const prefix = `[${CONTROLLER_MODULE_ID}]`; if (level === 'error' && logger.error) { (logger.error as (...a: unknown[]) => void)(prefix, ...args); return; } if (level === 'warn' && logger.warn) { (logger.warn as (...a: unknown[]) => void)(prefix, ...args); return; } if (logger.debug) (logger.debug as (...a: unknown[]) => void)(prefix, ...args); };

const checkAuth = () => { try { const gs = _getPort('globalState'); if (gs && typeof gs.isAuthenticated === 'function') return Promise.resolve(gs.isAuthenticated()); return Promise.resolve(true); } catch (e) { return Promise.resolve(true); } };

const getCurrentLogs = (state: Record<string, unknown>) => { const logMap: Record<string, unknown> = { [TABS.AUDIT]: state.auditLogs, [TABS.PERMISSIONS]: state.permissionLogs, [TABS.FRONTEND]: state.frontendLogs, [TABS.SECURITY]: state.securityLogs }; return logMap[state.activeTab as string] || state.auditLogs; };

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const formatDateFilename = () => { const now = new Date(); const m = String(now.getMonth() + 1).padStart(2, '0'); const d = String(now.getDate()).padStart(2, '0'); const h = String(now.getHours()).padStart(2, '0'); const min = String(now.getMinutes()).padStart(2, '0'); return `${now.getFullYear() + m + d}_${h}${min}`; };

const getPresetDays = (preset: string) => (PRESET_DAYS as Record<string, number>)[preset] || 30;

const buildInlineFilters = (filters: Record<string, unknown>) => { const inlineFilters: Record<string, unknown> = {}; const keys = Object.keys(filters); for (let i = 0; i < keys.length; i++) { const key = keys[i]; if (key.indexOf('inline_') === 0 && filters[key]) { inlineFilters[key.replace('inline_', '')] = filters[key]; } } return inlineFilters; };

const info = () => ({ moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() });
const healthCheck = () => { const logger = _getPort('logger'); return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { helpersReady: true, loggerReady: !!logger }, timestamp: Date.now() }; };

export { VERSION, MODULE_ID, log, checkAuth, getCurrentLogs, delay, formatDateFilename, getPresetDays, buildInlineFilters, info, healthCheck };
export default { VERSION, MODULE_ID, log, checkAuth, getCurrentLogs, delay, formatDateFilename, getPresetDays, buildInlineFilters, info, healthCheck, injectPorts, getPorts };
