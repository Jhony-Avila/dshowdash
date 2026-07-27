// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-12.handlers.data
// PURPOSE: Panel 12 - Data Handler
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   PANEL_EVENTS from /core/runtime/events/catalog/panels.events.js
//   LIFECYCLE_EVENTS from /core/runtime/events/catalog/lifecycle.events.js
//   ALL_COLUMNS from ../config/columns.js
//   state, markLoadedOnce, handleSessionExpired, PANEL_ID from ../core/lifecycle.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
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
import { PANEL_EVENTS } from '/core/runtime/events/catalog/panels.events.js';
import { LIFECYCLE_EVENTS } from '/core/runtime/events/catalog/lifecycle.events.js';
import * as api from '../services/api.js';
import * as http from '../services/http.js';
import * as store from '../state/store.js';
import * as table from '../ui/table.js';
import * as panelHeader from '../ui/header.js';
import * as modals from '../ui/modals.js';
import * as logger from '../utils/logger.js';
import { ALL_COLUMNS } from '../config/columns.js';
import { state, markLoadedOnce, handleSessionExpired, PANEL_ID } from '../core/lifecycle.js';

export const MODULE_ID = 'panel-12.handlers.data';
export const VERSION = '9.3.0-P2-ENTERPRISE';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

type DataCallbacks = { handleSort: (c: HTMLElement, col: string, el: HTMLElement) => void; setupTooltipsWrapper: (c: HTMLElement, id: string) => void; setupDelegatedEventListeners: (c: HTMLElement) => void; [key: string]: unknown };
export async function loadData(container: HTMLElement, callbacks: DataCallbacks) {
  const { handleSort, setupTooltipsWrapper, setupDelegatedEventListeners } = callbacks;
  if (state.activeLoadRequest) { logger.debug('load.skipped.concurrent', { hasActive: true }); return; }
  if (document.hidden || modals.isOpen() || state.pollingPaused) { logger.debug('load.skipped', { hidden: document.hidden, modal: modals.isOpen(), paused: state.pollingPaused }); return; }
  const requestId = ++state.currentRequestId; state.activeLoadRequest = requestId;
  const loadController = new AbortController();
  try {
    if (!state.loadedOnce) table.renderSkeleton(container, PANEL_ID);
    else panelHeader.showRefreshIndicator(container);
    const timer = logger.startTimer('load.data');
    const result = await api.loadJobs(loadController.signal);
    if (state.activeLoadRequest !== requestId) { logger.warn('load.discarded.stale', { requestId, current: state.activeLoadRequest }); return; }
    timer.end({ success: result.success, count: result.data?.jobs?.length || 0 });

    // @ts-expect-error TS migration - TS2339
    if (http.isSessionExpired(result)) { logger.warn('load.sessionExpired', { status: result.status }); handleSessionExpired(container); (_getPort('telemetry') as any)?.track(PANEL_EVENTS.DATA_ERROR, { panelId: 'panel-12', phase: 'session-expired', status: result.status }); return; }
    if (!result.success) { state.consecutiveErrors++; if (state.consecutiveErrors >= 3 && !state.isDegraded) { state.isDegraded = true; logger.warn('load.degraded.activated', { errors: state.consecutiveErrors }); (_getPort('telemetry') as any)?.track(LIFECYCLE_EVENTS.MODE_DEGRADED, { panelId: 'panel-12', consecutiveErrors: state.consecutiveErrors }); } logger.error('load.failed', { error: result.error, consecutiveErrors: state.consecutiveErrors, degraded: state.isDegraded }); table.renderError(container, result.error, PANEL_ID); markLoadedOnce(); (_getPort('telemetry') as any)?.track(PANEL_EVENTS.DATA_ERROR, { panelId: 'panel-12', error: result.error, consecutiveErrors: state.consecutiveErrors }); return; }
    state.consecutiveErrors = 0; if (state.isDegraded) { state.isDegraded = false; logger.logInfo('load.degraded.recovered', {}); (_getPort('telemetry') as any)?.track(LIFECYCLE_EVENTS.READY, { panelId: 'panel-12', phase: 'recovered' }); }
    store.setJobs(result.data?.jobs || []);
    const filtered = store.getFilteredAndSorted();
    table.render(container, filtered, ALL_COLUMNS, handleSort, setupTooltipsWrapper, setupDelegatedEventListeners, panelHeader.applyDensity, PANEL_ID);
    panelHeader.updateFilterCounts(container); panelHeader.hideRefreshIndicator(container); markLoadedOnce();
    logger.logInfo('load.success', { count: filtered.length, total: store.getJobs().length }); (_getPort('telemetry') as any)?.track(PANEL_EVENTS.DATA_LOADED, { panelId: 'panel-12', count: filtered.length });
  } catch (error: any) { state.consecutiveErrors++; logger.error('load.exception', { error: error.message }); table.renderError(container, error.message || 'Erro ao carregar dados', PANEL_ID); (_getPort('telemetry') as any)?.track(PANEL_EVENTS.DATA_ERROR, { panelId: 'panel-12', phase: 'exception', error: error.message }); }
  finally { state.activeLoadRequest = null; }
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, checks: { dataReady: true, portsInitialized: Ports.isInitialized() } }; }
