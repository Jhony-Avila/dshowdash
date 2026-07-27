// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.5.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: security.csrf-token-manager.diagnostics.csrf-diagnostics
// PURPOSE: SecurityCSRF - Diagnostics v1.5.0-P17WI
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   csrfStore from ../state/store.js
//   getStatus, getToken from ../core/csrf-core.js
//   getHeadersInfo, getHeaders, getAuthHeaders from ../core/auth-core.js
//   info, getDiagnostics, getLifecycleStatus, healthCheck, VERSION as LIFECYCLE_VERSION, MODULE_ID as LIFECYCLE_MODULE_ID from ../core/lifecycle.js
//   getRecentEvents, getTrackerStats, clearEvents from ../telemetry/tracker.js
//   getInterceptorInfo from ../infra/axios-interceptor.js
//   getBridgeInfo from ../infra/event-bridge.js
//   maskToken from ../utils/helpers.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   dumpStatus() — exported function
//   quickStatus() — exported function
//   testHeaders() — exported function
//   showRecentEvents() — exported function
//   registerWindowDebugHook() — exported function
//   unregisterWindowDebugHook() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.CSRF_DEBUG
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createCorePorts } from '/core/runtime/ports-profiles.js';
export const VERSION = '1.5.0-P17WI';
export const MODULE_ID = 'security.csrf-token-manager.diagnostics.csrf-diagnostics';
const hasWindow = typeof window !== 'undefined';
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
const log = { info(msg: string, ctx: Record<string, unknown>) { const logger = _getPort('logger'); if (logger && logger.info) logger.info(msg, Object.assign({ component: MODULE_ID }, ctx || {})); }, warn(msg: string, ctx: Record<string, unknown>) { const logger = _getPort('logger'); if (logger && logger.warn) logger.warn(msg, Object.assign({ component: MODULE_ID }, ctx || {})); }, error(msg: string, ctx: Record<string, unknown>) { const logger = _getPort('logger'); if (logger && logger.error) logger.error(msg, Object.assign({ component: MODULE_ID }, ctx || {})); }, debug(msg: string, ctx: Record<string, unknown>) { const logger = _getPort('logger'); if (logger && logger.debug) logger.debug(msg, Object.assign({ component: MODULE_ID }, ctx || {})); } };
import { csrfStore } from '../state/store.js';
import { getStatus, getToken } from '../core/csrf-core.js';
import { getHeadersInfo, getHeaders, getAuthHeaders } from '../core/auth-core.js';
import { info, getDiagnostics, getLifecycleStatus, healthCheck, VERSION as LIFECYCLE_VERSION, MODULE_ID as LIFECYCLE_MODULE_ID } from '../core/lifecycle.js';
import { getRecentEvents, getTrackerStats, clearEvents } from '../telemetry/tracker.js';
import { getInterceptorInfo } from '../infra/axios-interceptor.js';
import { getBridgeInfo } from '../infra/event-bridge.js';
import { maskToken } from '../utils/helpers.js';
export function dumpStatus() { try { const data = { module: getDiagnostics(), csrfStatus: getStatus(), headersInfo: getHeadersInfo(), config: csrfStore.getConfig(), stats: csrfStore.getStats(), integrations: { axios: getInterceptorInfo(), bridge: getBridgeInfo() }, telemetry: getTrackerStats(), health: healthCheck() }; log.debug('dumpStatus executed', { sections: Object.keys(data) }); return data; } catch (err: any) { log.error('dumpStatus failed', { error: err.message }); return null; } }
export function quickStatus() { const status = getStatus(); const lifecycle = getLifecycleStatus(); const health = healthCheck(); return { version: LIFECYCLE_VERSION, ready: lifecycle.initialized, health: health.status, hasToken: status.hasToken, isStale: status.isStale, age: status.age ? `${Math.round(status.age / 1000)}s` : 'N/A', preview: status.tokenPreview }; }
export function testHeaders() { const result = { csrf: getHeaders(), auth: getAuthHeaders(), info: getHeadersInfo() }; log.debug('testHeaders executed', { hasCSRF: !!result.csrf, hasAuth: !!result.auth }); return result; }
export function showRecentEvents(limit: number) { if (!limit) limit = 10; const events = getRecentEvents(limit); log.debug('showRecentEvents', { limit, count: events.length }); return events; }
export function registerWindowDebugHook() { if (!hasWindow) return false; try { (window as any).CSRF_DEBUG = { dump: dumpStatus, quick: quickStatus, status: getStatus, headers: testHeaders, headersInfo: getHeadersInfo, events: showRecentEvents, health: healthCheck, info, clearEvents, getToken() { return maskToken(getToken()); }, version: LIFECYCLE_VERSION, moduleId: LIFECYCLE_MODULE_ID }; log.info('Debug hooks registered', { version: LIFECYCLE_VERSION }); return true; } catch (err: any) { log.error('registerWindowDebugHook failed', { error: err.message }); return false; } }

// @ts-expect-error TS migration - TS2554
export function unregisterWindowDebugHook() { if (!hasWindow) return; try { delete (window as any).CSRF_DEBUG; log.debug('Debug hooks unregistered'); } catch (e) {} }
export default { dumpStatus, quickStatus, testHeaders, showRecentEvents, registerWindowDebugHook, unregisterWindowDebugHook, VERSION, MODULE_ID, injectPorts, getPorts };
