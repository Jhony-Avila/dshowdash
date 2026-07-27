// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: components-saved-views-manager-api
// PURPOSE: SavedViewsManager - API Module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CONFIG, logger from ./config.js
//   SAVED_VIEWS_EVENTS from /core/runtime/events/index.js
//
// PROVIDES:
//   getAbortController() — exported function
//   createAbortController() — exported function
//   abortAll() — exported function
//   fetchWithRetry() — exported function
//   list() — exported function
//   get() — exported function
//   getTypes() — exported function
//   create() — exported function
//   update() — exported function
//   setDefault() — exported function
//   remove() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
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

import { CONFIG, logger } from './config.js';
import { SAVED_VIEWS_EVENTS } from '/core/runtime/events/catalog/saved-views.events.js';
import type { SavedView, ViewType } from './state.js';

const MODULE_ID = 'components-saved-views-manager-api';
const VERSION = '2.1.0-P18EC';
let _abortController: AbortController | null = null;

export function getAbortController(): AbortController | null { return _abortController; }
export function createAbortController(): AbortController { _abortController = new AbortController(); return _abortController; }
export function abortAll(): void { if (_abortController) { _abortController.abort(); _abortController = null; } }

function sleep(ms: number): Promise<void> { return new Promise(resolve => { setTimeout(resolve, ms); }); }

export function fetchWithRetry(url: string, options: RequestInit = {}, attempt = 1): Promise<Response> {
  const maxAttempts = CONFIG.retry.maxAttempts;
  const baseDelay = CONFIG.retry.baseDelay;
  const maxDelay = CONFIG.retry.maxDelay;
  if (!_abortController || _abortController.signal.aborted) _abortController = new AbortController();
  const fetchOptions = Object.assign({}, options, { credentials: 'include' as RequestCredentials, signal: _abortController.signal });
  const timeoutId = setTimeout(() => { if (_abortController) _abortController.abort(); }, CONFIG.timeout);
  return fetch(url, fetchOptions as RequestInit).then((response: Response) => {
    clearTimeout(timeoutId);
    if (!response.ok && attempt < maxAttempts) {
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      logger.warn(`Request failed (${response.status}), retry ${attempt}/${maxAttempts} in ${delay}ms`);
      return sleep(delay).then(() => fetchWithRetry(url, options, attempt + 1));
    }
    return response;
  }).catch((error: Error) => {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') throw new Error('REQUEST_TIMEOUT');
    if (attempt < maxAttempts) {
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      logger.warn(`Request error, retry ${attempt}/${maxAttempts} in ${delay}ms: ${error.message}`);
      return sleep(delay).then(() => { _abortController = new AbortController(); return fetchWithRetry(url, options, attempt + 1); });
    }
    throw error;
  });
}

interface StateModule {
  setViews(views: SavedView[]): void;
  getViews(): SavedView[];
  setViewTypes(types: ViewType[]): void;
  getViewTypes(): ViewType[];
  updateViewDefault(viewId: number | string): void;
  removeView(viewId: number | string): void;
}

interface MetricsModule {
  listCount: number;
  createCount: number;
  updateCount: number;
  deleteCount: number;
  applyCount: number;
  errorCount: number;
  lastActivity: number | null;
}

export interface ApiResponse {
  ok: boolean;
  error?: string;
  views?: SavedView[];
  view?: SavedView;
  types?: ViewType[];
  view_id?: number;
  total?: number;
  [key: string]: unknown;
}

export function list(options: Record<string, unknown>, state: StateModule, metrics: MetricsModule, trackTelemetry: (action: string, data?: Record<string, unknown>) => void, emit: (event: string, data: Record<string, unknown>) => void): Promise<SavedView[]> {
  const params = new URLSearchParams();
  if (options.type) params.append('type', options.type as string);
  if (options.shared !== undefined) params.append('shared', options.shared as string);
  const url = CONFIG.endpoints.list + (params.toString() ? `&${params.toString()}` : '');
  return fetchWithRetry(url).then((response: Response) => response.json()).then((data: ApiResponse) => {
    if (data.ok) { state.setViews(data.views || []); metrics.listCount++; trackTelemetry('list', { count: state.getViews().length }); emit(SAVED_VIEWS_EVENTS.LIST, { views: state.getViews(), total: data.total }); return state.getViews(); }
    throw new Error(data.error || 'FETCH_ERROR');
  }).catch((error: Error) => { metrics.errorCount++; trackTelemetry('error', { action: 'list', error: error.message }); emit(SAVED_VIEWS_EVENTS.ERROR, { action: 'list', error: error.message }); throw error; });
}

export function get(idOrKey: number | string, trackTelemetry: (action: string, data?: Record<string, unknown>) => void, emit: (event: string, data: Record<string, unknown>) => void): Promise<SavedView> {
  const param = typeof idOrKey === 'number' ? `id=${idOrKey}` : `key=${idOrKey}`;
  return fetchWithRetry(`${CONFIG.endpoints.get}&${param}`).then((response: Response) => response.json()).then((data: ApiResponse) => {
    if (data.ok) { trackTelemetry('loaded', { idOrKey }); emit(SAVED_VIEWS_EVENTS.LOADED, { view: data.view as Record<string, unknown> }); return data.view as SavedView; }
    throw new Error(data.error || 'FETCH_ERROR');
  }).catch((error: Error) => { trackTelemetry('error', { action: 'get', error: error.message }); emit(SAVED_VIEWS_EVENTS.ERROR, { action: 'get', error: error.message }); throw error; });
}

export function getTypes(state: StateModule, trackTelemetry: (action: string, data?: Record<string, unknown>) => void): Promise<ViewType[]> {
  return fetchWithRetry(CONFIG.endpoints.types).then((response: Response) => response.json()).then((data: ApiResponse) => {
    if (data.ok) { state.setViewTypes(data.types || []); trackTelemetry('types', { count: state.getViewTypes().length }); return state.getViewTypes(); }
    throw new Error(data.error || 'FETCH_ERROR');
  }).catch((error: Error) => { trackTelemetry('error', { action: 'types', error: error.message }); throw error; });
}

export function create(viewData: Record<string, unknown>, listFn: () => Promise<SavedView[]>, metrics: MetricsModule, trackTelemetry: (action: string, data?: Record<string, unknown>) => void, emit: (event: string, data: Record<string, unknown>) => void): Promise<ApiResponse> {
  return fetchWithRetry(CONFIG.endpoints.create, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(viewData) }).then((response: Response) => response.json()).then((data: ApiResponse) => {
    if (data.ok) { metrics.createCount++; trackTelemetry('created', { viewId: data.view_id }); emit(SAVED_VIEWS_EVENTS.CREATED, { view_id: data.view_id as number }); return listFn().then(() => data); }
    throw new Error(data.error || 'CREATE_ERROR');
  }).catch((error: Error) => { metrics.errorCount++; trackTelemetry('error', { action: 'create', error: error.message }); emit(SAVED_VIEWS_EVENTS.ERROR, { action: 'create', error: error.message }); throw error; });
}

export function update(viewId: number | string, updates: Record<string, unknown>, listFn: () => Promise<SavedView[]>, metrics: MetricsModule, trackTelemetry: (action: string, data?: Record<string, unknown>) => void, emit: (event: string, data: Record<string, unknown>) => void): Promise<ApiResponse> {
  return fetchWithRetry(CONFIG.endpoints.update, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.assign({ id: viewId }, updates)) }).then((response: Response) => response.json()).then((data: ApiResponse) => {
    if (data.ok) { metrics.updateCount++; trackTelemetry('updated', { viewId }); emit(SAVED_VIEWS_EVENTS.UPDATED, { view_id: viewId }); return listFn().then(() => data); }
    throw new Error(data.error || 'UPDATE_ERROR');
  }).catch((error: Error) => { metrics.errorCount++; trackTelemetry('error', { action: 'update', error: error.message }); emit(SAVED_VIEWS_EVENTS.ERROR, { action: 'update', error: error.message }); throw error; });
}

export function setDefault(viewId: number | string, state: StateModule, trackTelemetry: (action: string, data?: Record<string, unknown>) => void, emit: (event: string, data: Record<string, unknown>) => void): Promise<ApiResponse> {
  return fetchWithRetry(`${CONFIG.endpoints.setDefault}&id=${viewId}`, { method: 'PATCH' }).then((response: Response) => response.json()).then((data: ApiResponse) => {
    if (data.ok) { state.updateViewDefault(viewId); trackTelemetry('default-changed', { viewId }); emit(SAVED_VIEWS_EVENTS.DEFAULT_CHANGED, { view_id: viewId }); return data; }
    throw new Error(data.error || 'SET_DEFAULT_ERROR');
  }).catch((error: Error) => { trackTelemetry('error', { action: 'setDefault', error: error.message }); emit(SAVED_VIEWS_EVENTS.ERROR, { action: 'setDefault', error: error.message }); throw error; });
}

export function remove(viewId: number | string, state: StateModule, metrics: MetricsModule, trackTelemetry: (action: string, data?: Record<string, unknown>) => void, emit: (event: string, data: Record<string, unknown>) => void): Promise<ApiResponse> {
  return fetchWithRetry(`${CONFIG.endpoints.delete}?id=${viewId}`, { method: 'DELETE' }).then((response: Response) => response.json()).then((data: ApiResponse) => {
    if (data.ok) { state.removeView(viewId); metrics.deleteCount++; trackTelemetry('removed', { viewId }); emit(SAVED_VIEWS_EVENTS.REMOVED, { view_id: viewId }); return data; }
    throw new Error(data.error || 'DELETE_ERROR');
  }).catch((error: Error) => { metrics.errorCount++; trackTelemetry('error', { action: 'remove', error: error.message }); emit(SAVED_VIEWS_EVENTS.ERROR, { action: 'remove', error: error.message }); throw error; });
}

export { MODULE_ID, VERSION };
export function info(): Record<string, string> { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck(): Record<string, unknown> { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { ready: true } }; }
