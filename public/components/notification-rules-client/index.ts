// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.8.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.notification-rules-client
// PURPOSE: Notification rules client with CRUD operations and event integration
// ───────────────────────────────────────────────────────────────
// @contract INIT - init() initializes notification rules client
// @contract DESTROY - destroy() destroys notification rules client
// @contract RESET - reset() resets notification rules client
// @contract LIST - list(options) lists notification rules
// @contract GET - get(idOrKey) gets a notification rule
// @contract CREATE - create(ruleData) creates a notification rule
// @contract UPDATE - update(ruleId, updates) updates a notification rule
// @contract TOGGLE - toggle(ruleId) toggles rule enabled state
// @contract REMOVE - remove(ruleId) removes a notification rule
// @contract ON - on(event, callback) subscribes to events
// @contract OFF - off(event, callback) unsubscribes from events
// @contract PORTS - injectPorts()/getPorts() for dependency injection
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: createCorePorts from /core/runtime/ports-profiles.js
// IMPORTS: isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
// PROVIDES: NotificationRulesClient, init, destroy, reset, list, get, create,
//           update, toggle, remove, on, off, healthCheck, info, getMetrics,
//           injectPorts, getPorts, VERSION, MODULE_ID, NOTIFICATION_RULES_EVENTS
// @changelog v2.8.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v2.7.0-STRICT-MODE: Strict mode integration
// @changelog v2.7.0-ENTERPRISE: ES6 modernization
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';

export const VERSION = '2.8.0-P2-ENTERPRISE';
export const MODULE_ID = 'notification-rules-client';

const NOTIFICATION_RULES_EVENTS = {
  READY: 'notification-rules:ready',
  LIST: 'notification-rules:list',
  CREATED: 'notification-rules:created',
  UPDATED: 'notification-rules:updated',
  TOGGLED: 'notification-rules:toggled',
  REMOVED: 'notification-rules:removed',
  ERROR: 'notification-rules:error'
};

const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => { Ports.init(); };
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: unknown) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const _isDebugEnabled = () => { const cfg = _getPort('config'); return cfg?.app?.debug; };

const _log = (level: string, msg: string, extra?: unknown) => {
  const logger = _getPort('logger');
  if (!logger) return;
  if (level === 'error') { logger.error?.(`[${MODULE_ID}] ${msg}`, extra); return; }
  if (level === 'warn') { logger.warn?.(`[${MODULE_ID}] ${msg}`, extra); return; }
  if (_isDebugEnabled()) logger.debug?.(`[${MODULE_ID}] ${msg}`, extra);
};

const NotificationRulesClient = (() => {
  const CONFIG = { endpoints: { list: '/api/notification-rules/?action=list', get: '/api/notification-rules/?action=get', triggers: '/api/notification-rules/?action=triggers', create: '/api/notification-rules/?action=create', update: '/api/notification-rules/?action=update', toggle: '/api/notification-rules/?action=toggle', delete: '/api/notification-rules/' }, retry: { maxAttempts: 3, baseDelay: 1000, maxDelay: 5000 }, timeout: 10000 };
  let rules: Record<string, unknown>[] = [];
  let triggers: Record<string, unknown> = {};
  let isInitialized = false;
  let abortController: AbortController | null = null;
  const listeners = new Map();
  const _metrics: { listCount: number; createCount: number; updateCount: number; deleteCount: number; errorCount: number; lastActivity: number | null } = { listCount: 0, createCount: 0, updateCount: 0, deleteCount: 0, errorCount: 0, lastActivity: null };

  const emit = (event: string, data: unknown) => {
    if (listeners.has(event)) {
      for (const fn of listeners.get(event)) { try { fn(data); } catch (e) { _log('error', 'Listener error:', e); } }
    }
    const eb = _getPort('eventBus');
    if (eb?.emit) {
      const eventKey = NOTIFICATION_RULES_EVENTS[event.toUpperCase() as keyof typeof NOTIFICATION_RULES_EVENTS] || `notification-rules:${event}`;
      eb.emit(eventKey, data);
    }
  };
  const on = (event: string, callback: (data: unknown) => void) => { if (!listeners.has(event)) listeners.set(event, new Set()); listeners.get(event).add(callback); return () => { listeners.get(event).delete(callback); }; };
  const off = (event: string, callback?: (data: unknown) => void) => { if (listeners.has(event)) { if (callback) listeners.get(event).delete(callback); else listeners.delete(event); } };
  const sleep = (ms: number) => new Promise((resolve) => { setTimeout(resolve, ms); });

  const fetchWithRetry = (url: string, options: RequestInit = {}, attempt = 1): Promise<Response> => {
    const { maxAttempts, baseDelay, maxDelay } = CONFIG.retry;
    if (!abortController || abortController.signal.aborted) abortController = new AbortController();
    const fetchOptions: RequestInit = { ...options, credentials: 'include' as RequestCredentials, signal: abortController.signal };
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => { abortController!.abort(); }, CONFIG.timeout);
      fetch(url, fetchOptions).then((response) => {
        clearTimeout(timeoutId);
        if (!response.ok && attempt < maxAttempts) {
          const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
          _log('warn', `Request failed (${response.status}), retry ${attempt}/${maxAttempts} in ${delay}ms`);
          return sleep(delay).then(() => fetchWithRetry(url, options, attempt + 1)).then(resolve);
        }
        resolve(response);
      }).catch((error) => {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') { reject(new Error('REQUEST_TIMEOUT')); return; }
        if (attempt < maxAttempts) {
          const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
          _log('warn', `Request error, retry ${attempt}/${maxAttempts} in ${delay}ms: ${error.message}`);
          sleep(delay).then(() => { abortController = new AbortController(); return fetchWithRetry(url, options, attempt + 1); }).then(resolve).catch(reject);
        } else reject(error);
      });
    });
  };

  const trackTelemetry = (action: string, data: Record<string, unknown> = {}) => { _metrics.lastActivity = Date.now(); const tt = _getPort('telemetry'); tt?.track?.(`${MODULE_ID}:${action}`, { timestamp: Date.now(), ...data }); };

  const list = (options: { enabled?: string; trigger?: string } = {}) => {
    const params = new URLSearchParams();
    if (options.enabled !== undefined) params.append('enabled', options.enabled);
    if (options.trigger) params.append('trigger', options.trigger);
    const url = CONFIG.endpoints.list + (params.toString() ? `&${params.toString()}` : '');
    return fetchWithRetry(url).then((r) => r.json()).then((data) => {
      if (data.ok) { rules = data.rules || []; _metrics.listCount++; trackTelemetry('list', { count: rules.length }); emit('list', { rules, total: data.total }); return rules; }
      throw new Error(data.error || 'FETCH_ERROR');
    }).catch((error) => { _metrics.errorCount++; trackTelemetry('error', { action: 'list', error: error.message }); emit('error', { action: 'list', error: error.message }); throw error; });
  };

  const get = (idOrKey: string | number) => {
    const param = typeof idOrKey === 'number' ? `id=${idOrKey}` : `key=${idOrKey}`;
    return fetchWithRetry(`${CONFIG.endpoints.get}&${param}`).then((r) => r.json()).then((data) => {
      if (data.ok) { trackTelemetry('get', { idOrKey }); return data.rule; }
      throw new Error(data.error || 'FETCH_ERROR');
    }).catch((error) => { _metrics.errorCount++; trackTelemetry('error', { action: 'get', error: error.message }); emit('error', { action: 'get', error: error.message }); throw error; });
  };

  const getTriggers = () => fetchWithRetry(CONFIG.endpoints.triggers).then((r) => r.json()).then((data) => {
    if (data.ok) { triggers = data.triggers || {}; trackTelemetry('triggers', { count: Object.keys(triggers).length }); return triggers; }
    throw new Error(data.error || 'FETCH_ERROR');
  }).catch((error) => { _metrics.errorCount++; trackTelemetry('error', { action: 'triggers', error: error.message }); emit('error', { action: 'triggers', error: error.message }); throw error; });

  const create = (ruleData: Record<string, unknown>) => fetchWithRetry(CONFIG.endpoints.create, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ruleData) }).then((r) => r.json()).then((data) => {
    if (data.ok) { _metrics.createCount++; trackTelemetry('created', { ruleId: data.rule_id }); emit('created', { rule_id: data.rule_id }); return list().then(() => data); }
    throw new Error(data.error || 'CREATE_ERROR');
  }).catch((error) => { _metrics.errorCount++; trackTelemetry('error', { action: 'create', error: error.message }); emit('error', { action: 'create', error: error.message }); throw error; });

  const update = (ruleId: string | number, updates: Record<string, unknown>) => fetchWithRetry(CONFIG.endpoints.update, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: ruleId, ...updates }) }).then((r) => r.json()).then((data) => {
    if (data.ok) { _metrics.updateCount++; trackTelemetry('updated', { ruleId }); emit('updated', { rule_id: ruleId }); return list().then(() => data); }
    throw new Error(data.error || 'UPDATE_ERROR');
  }).catch((error) => { _metrics.errorCount++; trackTelemetry('error', { action: 'update', error: error.message }); emit('error', { action: 'update', error: error.message }); throw error; });

  const toggle = (ruleId: string | number) => fetchWithRetry(`${CONFIG.endpoints.toggle}&id=${ruleId}`, { method: 'PATCH' }).then((r) => r.json()).then((data) => {
    if (data.ok) { const rule = rules.find((r) => r.id == ruleId); if (rule) rule.is_enabled = data.is_enabled; trackTelemetry('toggled', { ruleId, enabled: data.is_enabled }); emit('toggled', { rule_id: ruleId, is_enabled: data.is_enabled }); return data; }
    throw new Error(data.error || 'TOGGLE_ERROR');
  }).catch((error) => { _metrics.errorCount++; trackTelemetry('error', { action: 'toggle', error: error.message }); emit('error', { action: 'toggle', error: error.message }); throw error; });

  const remove = (ruleId: string | number) => fetchWithRetry(`${CONFIG.endpoints.delete}?id=${ruleId}`, { method: 'DELETE' }).then((r) => r.json()).then((data) => {
    if (data.ok) { rules = rules.filter((r) => r.id != ruleId); _metrics.deleteCount++; trackTelemetry('removed', { ruleId }); emit('removed', { rule_id: ruleId }); return data; }
    throw new Error(data.error || 'DELETE_ERROR');
  }).catch((error) => { _metrics.errorCount++; trackTelemetry('error', { action: 'remove', error: error.message }); emit('error', { action: 'remove', error: error.message }); throw error; });

  const getRulesByTrigger = (triggerEvent: string) => rules.filter((r) => r.trigger_event === triggerEvent && r.is_enabled);
  const getEnabledRules = () => rules.filter((r) => r.is_enabled);
  const getDisabledRules = () => rules.filter((r) => !r.is_enabled);
  const getRuleById = (ruleId: string | number) => rules.find((r) => r.id == ruleId) || null;

  const init = () => {
    if (isInitialized) return Promise.resolve(true);
    _initPorts();
    abortController = new AbortController();
    return Promise.all([list(), getTriggers()]).then(() => {
      isInitialized = true;
      trackTelemetry('ready', { rulesCount: rules.length });
      emit('ready', { initialized: true, rulesCount: rules.length });
      _log('info', `${VERSION} initialized with ${rules.length} rules`);
      return true;
    }).catch((error) => { _log('error', 'Init error:', error); emit('error', { action: 'init', error: error.message }); return false; });
  };

  const destroy = () => { if (abortController) { abortController.abort(); abortController = null; } listeners.clear(); rules = []; triggers = {}; isInitialized = false; _log('info', 'Destroyed'); };
  const reset = () => { destroy(); _metrics.listCount = 0; _metrics.createCount = 0; _metrics.updateCount = 0; _metrics.deleteCount = 0; _metrics.errorCount = 0; _metrics.lastActivity = null; _log('info', 'Reset complete'); };

  const healthCheck = () => {
    const logger = _getPort('logger');
    const checks = { initialized: isInitialized, hasRules: rules.length > 0, hasTriggers: Object.keys(triggers).length > 0, abortControllerActive: !!abortController && !abortController.signal.aborted, lowErrorRate: _metrics.errorCount < (_metrics.listCount + _metrics.createCount) * 0.1 || _metrics.listCount === 0, loggerAvailable: !!logger, portsInitialized: Ports.isInitialized() };
    let passed = 0, total = 0;
    for (const key of Object.keys(checks)) { total++; if (checks[key as keyof typeof checks]) passed++; }
    const status = passed < total * 0.5 ? 'UNHEALTHY' : passed < total ? 'DEGRADED' : 'HEALTHY';
    return { status, score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
  };

  const getStatus = () => ({ name: MODULE_ID, version: VERSION, initialized: isInitialized, rulesCount: rules.length, enabledRulesCount: getEnabledRules().length, triggersCount: Object.keys(triggers).length, metrics: { ..._metrics }, healthCheck: healthCheck() });
  const info = () => ({ version: VERSION, moduleId: MODULE_ID, initialized: isInitialized, portsInitialized: Ports.isInitialized(), rulesCount: rules.length, enabledRulesCount: getEnabledRules().length, triggersCount: Object.keys(triggers).length, metrics: { ..._metrics } });
  const getMetrics = () => ({ ..._metrics });

  return { init, destroy, reset, list, get, getTriggers, create, update, toggle, remove, on, off, getRulesByTrigger, getEnabledRules, getDisabledRules, getRuleById, getRules: () => rules.slice(), getTriggersList: () => ({ ...triggers }), isInitialized: () => isInitialized, healthCheck, getStatus, info, getMetrics, getVersion: () => VERSION, injectPorts, getPorts, PRIORITIES: ['low', 'normal', 'high', 'urgent'], TARGET_TYPES: ['all', 'role', 'user', 'custom'], NOTIFICATION_RULES_EVENTS, VERSION, MODULE_ID };
})();

if (typeof window !== 'undefined') {
  // DevTools sempre permitido
  window.__dev = window.__dev || {};
  window.__dev.notificationRulesClient = NotificationRulesClient;

  // Global só exposto fora do strict mode
  if (!isStrict()) {
    (window as any).NotificationRulesClient = NotificationRulesClient;
  } else {
    recordViolation('GLOBAL_EXPOSURE_BLOCKED', { module: MODULE_ID, target: 'window.NotificationRulesClient' });
  }
}

export default NotificationRulesClient;
export { NotificationRulesClient, NOTIFICATION_RULES_EVENTS };
