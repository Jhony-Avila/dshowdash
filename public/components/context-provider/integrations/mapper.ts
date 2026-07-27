// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.4.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: context-provider:mapper
// PURPOSE: Context Provider - GlobalState Mapper
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   CORE_CONTEXTS from ../core/registry.js
//   integrationState from ./state.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   defaultGlobalStateMapper() — exported function
//   getMapper() — exported function
//   setMapper() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { CORE_CONTEXTS } from '../core/registry.js';
import { integrationState } from './state.js';
export const MODULE_ID = 'context-provider:mapper';
export const VERSION = '5.4.0-P17WI';
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
export function defaultGlobalStateMapper(state: Record<string, any>) { try { if (!state || typeof state !== 'object') return state; const mapped: Record<string, unknown> = {}; mapped[CORE_CONTEXTS.GLOBAL_STATE] = { session: state.session, navigation: state.navigation, preferences: state.preferences, ui: state.ui }; if (state.session) { mapped[CORE_CONTEXTS.SESSION] = { authenticated: state.session.isAuthenticated || state.session.authenticated || false, user: state.session.user || null, token: state.session.token || null }; } if (state.ui && state.ui.layout || state.layout) { mapped[CORE_CONTEXTS.LAYOUT] = { mode: (state.ui && state.ui.layout && state.ui.layout.mode) || (state.layout && state.layout.mode) || 'default', breakpoint: (state.ui && state.ui.layout && state.ui.layout.breakpoint) || (state.layout && state.layout.breakpoint) || 'desktop', compact: (state.ui && state.ui.layout && state.ui.layout.compact) || (state.layout && state.layout.compact) || false }; } if (state.preferences && (state.preferences.language || state.preferences.locale)) { mapped[CORE_CONTEXTS.LOCALE] = { language: state.preferences.language || state.preferences.locale || 'pt-BR', fallback: 'en-US' }; } if ((state.session && state.session.user && state.session.user.roles) || state.permissions) { mapped[CORE_CONTEXTS.PERMISSIONS] = { roles: (state.session && state.session.user && state.session.user.roles) || (state.permissions && state.permissions.roles) || [], capabilities: (state.session && state.session.user && state.session.user.capabilities) || (state.permissions && state.permissions.capabilities) || [] }; } return mapped; } catch (error: any) { const logger = _getPort('logger'); if (logger && logger.warn) logger.warn(`[${MODULE_ID}]`, 'defaultGlobalStateMapper error:', error.message); return integrationState.lastValidGlobalState; } }
export function getMapper() { return integrationState.mapGlobalStateContext || defaultGlobalStateMapper; }
export function setMapper(mapper: ((state: Record<string, any>) => Record<string, unknown>) | null) { integrationState.mapGlobalStateContext = mapper; }
export function info() { const ps = Ports.snapshot(); return { moduleId: MODULE_ID, version: VERSION, portsInitialized: ps._initialized }; }
export function healthCheck() { const ps = Ports.snapshot(); return { status: ps._initialized ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, portsInitialized: ps._initialized }; }
export default { defaultGlobalStateMapper, getMapper, setMapper, injectPorts, getPorts, info, healthCheck, MODULE_ID, VERSION };
