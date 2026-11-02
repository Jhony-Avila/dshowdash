// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.4.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.navigation.route-state-service
// PURPOSE: Enterprise URL State Management
// ───────────────────────────────────────────────────────────────
// IMPORTS: createCorePorts, SYSTEM_EVENTS
// PROVIDES: getState, pushState, replaceState, subscribe, healthCheck
// @changelog v2.4.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// @changelog v2.3.0-ENTERPRISE: ES6 modernization
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { SYSTEM_EVENTS } from '/core/runtime/events/catalog/system.events.js';

const MODULE_ID = 'core.navigation.route-state-service';
const VERSION = '2.3.0-ENTERPRISE';

const Ports = createCorePorts({ moduleId: MODULE_ID });

const _initPorts = (): void => { Ports.init(); };
const _getPort = (name: string): unknown => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>): boolean => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

type ScopeState = Record<string, unknown>;
type SubscriberFn = (state: ScopeState, scopeId: string) => void;

const _state: {
  initialized: boolean;
  scopes: Record<string, ScopeState>;
  subscribers: Record<string, SubscriberFn[]>;
  debounceTimers: Record<string, ReturnType<typeof setTimeout>>;
  version: number;
} = { initialized: false, scopes: {}, subscribers: {}, debounceTimers: {}, version: 1 };

const _metrics = { reads: 0, writes: 0, clears: 0, subscribes: 0, debounced: 0, syncs: 0, shareableUrls: 0 };
const _config: { defaultDebounceMs: number; maxScopeSize: number; storagePrefix: string; baseUrl: string | null } = { defaultDebounceMs: 300, maxScopeSize: 50, storagePrefix: 'dsd-route-state-', baseUrl: null };

const _track = (eventName: string, payload: Record<string, unknown>): void => { try { const tk = _getPort('telemetry') as { track?: (event: string, data: unknown) => void } | null; tk?.track?.(eventName, { moduleId: MODULE_ID, ...payload }); } catch (e) { } };

const getBaseUrl = (): string => { if (_config.baseUrl) return _config.baseUrl; const cfg = _getPort('config') as { app?: { baseUrl?: string }; baseUrl?: string } | null; if (cfg?.app?.baseUrl) return cfg.app.baseUrl; if (cfg?.baseUrl) return cfg.baseUrl; const router = _getPort('router') as { getBaseUrl?: () => string } | null; if (router?.getBaseUrl) return router.getBaseUrl(); if (typeof window !== 'undefined') return window.location.origin + window.location.pathname; return ''; };

const getShareableURL = (scopeId: string, state: ScopeState | null, options: { baseUrl?: string; allowedKeys?: string[] | null } = {}): string => { _metrics.shareableUrls++; const base = options.baseUrl || getBaseUrl(); const data: ScopeState = state || (scopeId ? (getState(scopeId).data || {}) : {}); const allowedKeys = options.allowedKeys || null; const params: string[] = []; for (const key in data) { if (data.hasOwnProperty(key) && data[key] != null && data[key] !== '') { if (!allowedKeys || allowedKeys.indexOf(key) >= 0) params.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(data[key]).trim().slice(0, 100).replace(/[<>]/g, ''))}`); } } return params.length > 0 ? `${base}?${params.join('&')}` : base; };

const _parseQuery = (queryString: string): Record<string, string | string[]> => { const params: Record<string, string | string[]> = {}; if (!queryString) return params; const query = queryString.charAt(0) === '?' ? queryString.substring(1) : queryString; const pairs = query.split('&'); for (const pair of pairs) { const [rawKey, rawValue] = pair.split('='); if (rawKey) { const key = decodeURIComponent(rawKey); const value = rawValue ? decodeURIComponent(rawValue) : ''; if (params[key]) { if (!Array.isArray(params[key])) params[key] = [params[key] as string]; (params[key] as string[]).push(value); } else params[key] = value; } } return params; };
const _buildQuery = (params: Record<string, unknown>): string => { const pairs: string[] = []; for (const key in params) { if (params.hasOwnProperty(key) && params[key] != null) { const value = params[key]; if (Array.isArray(value)) { for (const v of value) pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`); } else if (value !== '' && value !== null && value !== undefined) pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`); } } return pairs.length > 0 ? `?${pairs.join('&')}` : ''; };
const _getCurrentUrlState = (): { hash: string; path: string; query: Record<string, string | string[]> } => { if (typeof window === 'undefined') return { hash: '', query: {}, path: '' }; const hash = window.location.hash || ''; const queryStart = hash.indexOf('?'); const path = queryStart >= 0 ? hash.substring(0, queryStart) : hash; const queryString = queryStart >= 0 ? hash.substring(queryStart) : ''; return { hash, path, query: _parseQuery(queryString) }; };
const _notifySubscribers = (scopeId: string, state: ScopeState): void => { const subs = _state.subscribers[scopeId]; if (!subs?.length) return; for (const sub of subs) { try { sub(state, scopeId); } catch (e) { } } };

const getState = (scopeId: string): { ok: boolean; data: ScopeState; source: string } => { _metrics.reads++; if (!scopeId) { const urlState = _getCurrentUrlState(); return { ok: true, data: { query: urlState.query, path: urlState.path }, source: 'url' }; } const scopeState = _state.scopes[scopeId]; if (scopeState) return { ok: true, data: { ...scopeState }, source: 'memory' }; try { const stored = localStorage.getItem(_config.storagePrefix + scopeId); if (stored) { const parsed: ScopeState = JSON.parse(stored); _state.scopes[scopeId] = parsed; return { ok: true, data: parsed, source: 'storage' }; } } catch (e) { } return { ok: true, data: {}, source: 'empty' }; };

const setState = (scopeId: string, patch: ScopeState, options: { debounceMs?: number; syncUrl?: boolean; replace?: boolean } = {}): { ok: boolean; error?: string; data?: ScopeState } => { _metrics.writes++; if (!scopeId) return { ok: false, error: 'scopeId required' }; const current = _state.scopes[scopeId] || {}; const newState: ScopeState = { ...current, ...patch }; _state.scopes[scopeId] = newState; try { localStorage.setItem(_config.storagePrefix + scopeId, JSON.stringify(newState)); } catch (e) { } const debounceMs = options.debounceMs ?? _config.defaultDebounceMs; if (options.syncUrl !== false) { if (_state.debounceTimers[scopeId]) { clearTimeout(_state.debounceTimers[scopeId]); _metrics.debounced++; } _state.debounceTimers[scopeId] = setTimeout(() => { _syncToUrl(scopeId, newState, options.replace); delete _state.debounceTimers[scopeId]; }, debounceMs); } _notifySubscribers(scopeId, newState); _track('route-state:set', { scopeId, keys: Object.keys(patch) }); return { ok: true, data: newState }; };

const _syncToUrl = (scopeId: string, state: ScopeState, replace: boolean | undefined): void => { _metrics.syncs++; if (typeof window === 'undefined') return; const urlState = _getCurrentUrlState(); const newQuery: Record<string, unknown> = { ...urlState.query }; for (const key in state) { if (state.hasOwnProperty(key) && state[key] != null && state[key] !== '') newQuery[`${scopeId}_${key}`] = state[key]; else delete newQuery[`${scopeId}_${key}`]; } const newHash = urlState.path + _buildQuery(newQuery); const eb = _getPort('eventBus') as { emit?: (event: string, data: unknown) => void } | null; eb?.emit?.(SYSTEM_EVENTS.ROUTE_STATE_SYNC, { scopeId, hash: newHash, replace }); const router = _getPort('router') as { navigate?: (path: string, opts: Record<string, unknown>) => void } | null; if (router?.navigate) router.navigate(newHash, { replace: replace !== false, source: 'route-state-service' }); else if (replace !== false) window.history.replaceState(null, '', newHash); else window.history.pushState(null, '', newHash); };

const clearState = (scopeId: string): { ok: boolean; error?: string } => { _metrics.clears++; if (!scopeId) return { ok: false, error: 'scopeId required' }; delete _state.scopes[scopeId]; try { localStorage.removeItem(_config.storagePrefix + scopeId); } catch (e) { } if (typeof window !== 'undefined') { const urlState = _getCurrentUrlState(); const newQuery: Record<string, string | string[]> = {}; const prefix = `${scopeId}_`; for (const key in urlState.query) { if (!key.startsWith(prefix)) newQuery[key] = urlState.query[key]; } const newHash = urlState.path + _buildQuery(newQuery); window.history.replaceState(null, '', newHash); } _notifySubscribers(scopeId, {}); _track('route-state:clear', { scopeId }); return { ok: true }; };

const subscribe = (scopeId: string, callback: SubscriberFn): (() => void) => { _metrics.subscribes++; if (!scopeId || typeof callback !== 'function') return () => {}; if (!_state.subscribers[scopeId]) _state.subscribers[scopeId] = []; _state.subscribers[scopeId].push(callback); return () => { const subs = _state.subscribers[scopeId]; if (subs) { const idx = subs.indexOf(callback); if (idx >= 0) subs.splice(idx, 1); } }; };

const restoreFromUrl = (scopeId: string): { ok: boolean; error?: string; data?: ScopeState; source?: string } => { if (typeof window === 'undefined') return { ok: false, error: 'No window' }; const urlState = _getCurrentUrlState(); const prefix = `${scopeId}_`; const restored: ScopeState = {}; for (const key in urlState.query) { if (key.startsWith(prefix)) { const cleanKey = key.substring(prefix.length); restored[cleanKey] = urlState.query[key]; } } if (Object.keys(restored).length > 0) { _state.scopes[scopeId] = restored; _notifySubscribers(scopeId, restored); return { ok: true, data: restored, source: 'url' }; } return getState(scopeId); };

const exportState = () => ({ version: _state.version, scopes: { ..._state.scopes }, timestamp: Date.now() });
const importState = (data: { scopes?: Record<string, ScopeState> }): { ok: boolean; error?: string; imported?: number } => { if (!data?.scopes) return { ok: false, error: 'Invalid data' }; for (const scopeId in data.scopes) { if (data.scopes.hasOwnProperty(scopeId)) _state.scopes[scopeId] = data.scopes[scopeId]; } return { ok: true, imported: Object.keys(data.scopes).length }; };

const init = (ctx: { ports?: Record<string, unknown>; config?: Partial<typeof _config> } | null): { ok: boolean; alreadyInitialized?: boolean; version?: string } => { if (_state.initialized) return { ok: true, alreadyInitialized: true }; _initPorts(); if (ctx?.ports) injectPorts(ctx.ports); if (ctx?.config) Object.assign(_config, ctx.config); const tk = _getPort('telemetry') as { register?: (info: Record<string, unknown>) => void } | null; tk?.register?.({ id: MODULE_ID, version: VERSION, healthCheck, info }); _state.initialized = true; _track('route-state-service:init', { version: VERSION }); return { ok: true, version: VERSION }; };
const cleanup = (): { ok: boolean } => { for (const scopeId in _state.debounceTimers) { if (_state.debounceTimers[scopeId]) clearTimeout(_state.debounceTimers[scopeId]); } _state.scopes = {}; _state.subscribers = {}; _state.debounceTimers = {}; _state.initialized = false; return { ok: true }; };
const healthCheck = () => { let score = _state.initialized ? 100 : 50; const issues: { code: string; severity: string; message: string }[] = []; if (!_state.initialized) issues.push({ code: 'NOT_INIT', severity: 'warn', message: 'Not initialized' }); const scopeCount = Object.keys(_state.scopes).length; if (scopeCount > _config.maxScopeSize) { issues.push({ code: 'TOO_MANY_SCOPES', severity: 'warn', message: `${scopeCount} scopes` }); score -= 10; } const status = score >= 80 ? 'HEALTHY' : score >= 50 ? 'DEGRADED' : 'UNHEALTHY'; return { status, score, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: 'warn' }, portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, issues, metrics: _metrics }; };
const info = () => ({ moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, scopesCount: Object.keys(_state.scopes).length, subscribersCount: Object.keys(_state.subscribers).length, metrics: _metrics, baseUrl: getBaseUrl(), portsInitialized: Ports.isInitialized() });

export { MODULE_ID, VERSION, init, cleanup, getState, setState, clearState, subscribe, restoreFromUrl, exportState, importState, getShareableURL, getBaseUrl, healthCheck, info };
export default { MODULE_ID, VERSION, init, cleanup, getState, setState, clearState, subscribe, restoreFromUrl, exportState, importState, getShareableURL, getBaseUrl, healthCheck, info, injectPorts, getPorts };
