// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.2.0-P18G2-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.telemetry.tracker
// PURPOSE: Telemetry Tracker - Panel Nav Admin
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   PANEL_ID, LOCAL_EVENTS from ../core/contracts.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   tracker — exported value
//   track() — exported function
//   trackInit() — exported function
//   trackInitComplete() — exported function
//   trackInitError() — exported function
//   trackMounted() — exported function
//   trackUnmounted() — exported function
//   trackLoadStart() — exported function
//   trackLoadSuccess() — exported function
//   trackLoadError() — exported function
//   trackItemCreated() — exported function
//   trackItemUpdated() — exported function
//   trackItemDeleted() — exported function
//   ... and 16 more exports
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
import { PANEL_ID, LOCAL_EVENTS } from '../core/contracts.js';

const VERSION = '9.3.0-P2-ENTERPRISE';
const MODULE_ID = 'panel-nav-admin.telemetry.tracker';
const NAMESPACE = 'panel_nav_admin';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: unknown) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

function _getCurrentRoute() { const r = _getPort('router'); if (r && r.getCurrentRoute) { const c = r.getCurrentRoute(); return (c && c.hash) ? c.hash : (typeof c === 'string' ? c : ''); } if (r && r.current) return r.current; return ''; }

let _events: Record<string, unknown>[] = [];
const _metrics = { eventsTracked: 0, errorsTracked: 0, itemsCreated: 0, itemsUpdated: 0, itemsDeleted: 0, sectionsCreated: 0, scaffoldsRun: 0 };
const MAX_EVENTS = 100;

function _getActorContext() {
  const auth = _getPort('auth');
  if (!auth || !auth.isAuthenticated || !auth.isAuthenticated()) return { userId: null, roles: [], sessionId: null };
  const user = auth.getUser ? auth.getUser() : null;
  return { userId: user && user.id ? user.id : null, roles: auth.getRoles ? auth.getRoles() : [], sessionId: auth.getSessionId ? auth.getSessionId() : null };
}

function _createPayload(event: string, data: Record<string, unknown>) { data = data || {}; return Object.assign({ event, namespace: NAMESPACE, panelId: PANEL_ID, component: MODULE_ID, route: _getCurrentRoute(), actor: _getActorContext(), timestamp: Date.now() }, data); }

function _track(eventName: string, payload: Record<string, unknown>) { try { const tc = _getPort('telemetryCore'); if (tc && tc.track) tc.track(eventName, payload); } catch (e) {} }

function track(event: string, data: Record<string, unknown> = {}) { const payload = _createPayload(event, data); _events.push(payload); if (_events.length > MAX_EVENTS) _events.shift(); _metrics.eventsTracked++; _track(event, payload); return payload; }

function trackInit(data: Record<string, unknown> = {}) { return track(LOCAL_EVENTS.INIT_START, Object.assign({ action: 'init' }, data)); }
function trackInitComplete(data: Record<string, unknown> = {}) { return track(LOCAL_EVENTS.INIT_COMPLETE, Object.assign({ action: 'init_complete' }, data)); }
function trackInitError(error: Error | unknown, data: Record<string, unknown> = {}) { _metrics.errorsTracked++; return track(LOCAL_EVENTS.INIT_ERROR, Object.assign({ action: 'init_error', error: (error as Error)?.message ? (error as Error).message : String(error) }, data)); }
function trackMounted(data: Record<string, unknown> = {}) { return track(LOCAL_EVENTS.MOUNTED, Object.assign({ action: 'mounted' }, data)); }
function trackUnmounted(data: Record<string, unknown> = {}) { return track(LOCAL_EVENTS.UNMOUNTED, Object.assign({ action: 'unmounted' }, data)); }
function trackLoadStart(data: Record<string, unknown> = {}) { return track(LOCAL_EVENTS.LOAD_START, Object.assign({ action: 'load_start' }, data)); }
function trackLoadSuccess(data: Record<string, unknown> = {}) { return track(LOCAL_EVENTS.LOAD_SUCCESS, Object.assign({ action: 'load_success' }, data)); }
function trackLoadError(error: Error | unknown, data: Record<string, unknown> = {}) { _metrics.errorsTracked++; return track(LOCAL_EVENTS.LOAD_ERROR, Object.assign({ action: 'load_error', error: (error as Error)?.message ? (error as Error).message : String(error) }, data)); }
function trackItemCreated(item: Record<string, unknown> | null, data: Record<string, unknown> = {}) { _metrics.itemsCreated++; return track(LOCAL_EVENTS.ITEM_CREATED, Object.assign({ action: 'item_created', itemId: item ? item.id : null }, data)); }
function trackItemUpdated(item: Record<string, unknown> | null, data: Record<string, unknown> = {}) { _metrics.itemsUpdated++; return track(LOCAL_EVENTS.ITEM_UPDATED, Object.assign({ action: 'item_updated', itemId: item ? item.id : null }, data)); }
function trackItemDeleted(itemId: unknown, data: Record<string, unknown> = {}) { _metrics.itemsDeleted++; return track(LOCAL_EVENTS.ITEM_DELETED, Object.assign({ action: 'item_deleted', itemId }, data)); }
function trackItemReordered(data: Record<string, unknown> = {}) { return track(LOCAL_EVENTS.ITEM_REORDERED, Object.assign({ action: 'item_reordered' }, data)); }
function trackSectionCreated(section: Record<string, unknown> | null, data: Record<string, unknown> = {}) { _metrics.sectionsCreated++; return track(LOCAL_EVENTS.SECTION_CREATED, Object.assign({ action: 'section_created', sectionKey: section ? section.key : null }, data)); }
function trackSectionUpdated(section: Record<string, unknown> | null, data: Record<string, unknown> = {}) { return track(LOCAL_EVENTS.SECTION_UPDATED, Object.assign({ action: 'section_updated', sectionKey: section ? section.key : null }, data)); }
function trackSectionDeleted(key: string, data: Record<string, unknown> = {}) { return track(LOCAL_EVENTS.SECTION_DELETED, Object.assign({ action: 'section_deleted', sectionKey: key }, data)); }
function trackScaffoldStarted(config: Record<string, unknown> | null, data: Record<string, unknown> = {}) { return track(LOCAL_EVENTS.SCAFFOLD_STARTED, Object.assign({ action: 'scaffold_started', pageId: config ? config.id : null }, data)); }
function trackScaffoldCompleted(config: Record<string, unknown> | null, data: Record<string, unknown> = {}) { _metrics.scaffoldsRun++; return track(LOCAL_EVENTS.SCAFFOLD_COMPLETED, Object.assign({ action: 'scaffold_completed', pageId: config ? config.id : null }, data)); }
function trackScaffoldError(error: Error | unknown, data: Record<string, unknown> = {}) { _metrics.errorsTracked++; return track(LOCAL_EVENTS.SCAFFOLD_ERROR, Object.assign({ action: 'scaffold_error', error: (error as Error)?.message ? (error as Error).message : String(error) }, data)); }
function trackAuthRequired(action: string, data: Record<string, unknown> = {}) { return track('nav-admin:auth:required', Object.assign({ action }, data)); }
function trackAccessDenied(action: string, data: Record<string, unknown> = {}) { return track('nav-admin:access:denied', Object.assign({ action }, data)); }

function getEvents() { return _events.slice(); }
function getMetrics() { return Object.assign({}, _metrics); }
function clear() { _events = []; return { success: true }; }

function healthCheck() { const tc = _getPort('telemetryCore'); const auth = _getPort('auth'); const checks: Record<string, boolean> = { telemetryCoreAvailable: !!(tc && tc.track), eventsNotOverflowing: _events.length <= MAX_EVENTS, portsInitialized: Ports.isInitialized(), authPortAvailable: !!auth }; let passed = 0, total = 0; for (const k in checks) { total++; if (checks[k]) passed++; } return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${total}`, checks, metrics: _metrics, version: VERSION, timestamp: Date.now() }; }

function info() { return { version: VERSION, moduleId: MODULE_ID, namespace: NAMESPACE, eventCount: _events.length, portsInitialized: Ports.isInitialized(), metrics: _metrics, healthCheck: healthCheck() }; }

const tracker = { track, trackInit, trackInitComplete, trackInitError, trackMounted, trackUnmounted, trackLoadStart, trackLoadSuccess, trackLoadError, trackItemCreated, trackItemUpdated, trackItemDeleted, trackItemReordered, trackSectionCreated, trackSectionUpdated, trackSectionDeleted, trackScaffoldStarted, trackScaffoldCompleted, trackScaffoldError, trackAuthRequired, trackAccessDenied, getEvents, getMetrics, clear, healthCheck, info, injectPorts, getPorts };

export { tracker, track, trackInit, trackInitComplete, trackInitError, trackMounted, trackUnmounted, trackLoadStart, trackLoadSuccess, trackLoadError, trackItemCreated, trackItemUpdated, trackItemDeleted, trackItemReordered, trackSectionCreated, trackSectionUpdated, trackSectionDeleted, trackScaffoldStarted, trackScaffoldCompleted, trackScaffoldError, trackAuthRequired, trackAccessDenied, getEvents, getMetrics, clear, healthCheck, info, VERSION, MODULE_ID };
export default tracker;
