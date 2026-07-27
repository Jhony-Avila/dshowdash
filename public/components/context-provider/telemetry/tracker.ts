// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (4.4.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: context-telemetry
// PURPOSE: telemetry   tracker
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   TELEMETRY_EVENTS from /core/runtime/events/index.js
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   getVersion() — exported function
//   trackContextEvent() — exported function
//   getEventLog() — exported function
//   clearEventLog() — exported function
//   getEventsByType — exported value
//   getRecentEvents — exported value
//   getTrackerStats() — exported function
//   getSessionId() — exported function
//   getHotContexts — exported value
//   getTopContexts — exported value
//   resetMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   setDebug — exported value
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   TELEMETRY_EVENTS.EVENT
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window._contextProviderSessionId
// ═══════════════════════════════════════════════════════════════
'use strict';
// Context Provider Telemetry v4.4.0-P17WI
// @version 4.4.0-P17WI-ES6
// P17WI: Ports via PortsFactory/PortsProfiles

import { TELEMETRY_EVENTS } from '/core/runtime/events/catalog/telemetry.events.js';
import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '4.4.0-P17WI';
export const MODULE_ID = 'context-telemetry';

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debug = () => { const cfg = _getPort('config'); return cfg && cfg.app && cfg.app.debug ? true : false; };
const _log = function(level: string, ...args: any[]) { const logger = _getPort('logger'); if (!logger) return; const prefix = `[${MODULE_ID}]`; if (level === 'error') { if (logger.error) logger.error(...[prefix].concat(args)); return; } if (level === 'warn') { if (logger.warn) logger.warn(...[prefix].concat(args)); return; } if (_debug() && logger.debug) logger.debug(...[prefix].concat(args)); };

export function getVersion() { return VERSION; }

const COMPONENT_NAME = 'context-provider';
const eventLog: Array<Record<string, unknown>> = [];
const maxLogSize = 1000;
let _debugMode = false;
let metrics: { totalEvents: number; eventsByType: Record<string, number>; contextMetrics: Record<string, { events: number; lastEventAt: number | null }>; globalStateUpdates: number; orchestratorUpdates: number; subscriberErrors: number; telemetryCoreForwards: number; eventBusForwards: number; sanitizationCount: number; lastEventAt: number | null } = { totalEvents: 0, eventsByType: {}, contextMetrics: {}, globalStateUpdates: 0, orchestratorUpdates: 0, subscriberErrors: 0, telemetryCoreForwards: 0, eventBusForwards: 0, sanitizationCount: 0, lastEventAt: null };

const setDebug = (debug: boolean) => { _debugMode = debug; };

const trackContextEvent = (eventName: string, data?: Record<string, unknown>) => {
  if (!data) data = {};
  try {
    const event = { timestamp: Date.now(), component: COMPONENT_NAME, event: eventName, data: sanitizePayload(data), sessionId: getSessionId() };
    eventLog.push(event); if (eventLog.length > maxLogSize) eventLog.shift();
    metrics.totalEvents++; metrics.eventsByType[eventName] = (metrics.eventsByType[eventName] || 0) + 1; metrics.lastEventAt = Date.now();
    if (data.key) { const _key = data.key as string; if (!metrics.contextMetrics[_key]) metrics.contextMetrics[_key] = { events: 0, lastEventAt: null }; metrics.contextMetrics[_key].events++; metrics.contextMetrics[_key].lastEventAt = Date.now(); }
    if (eventName.indexOf('global-state') !== -1) metrics.globalStateUpdates++;
    if (eventName.indexOf('orchestrator') !== -1) metrics.orchestratorUpdates++;
    if (eventName.indexOf('subscriber:error') !== -1) metrics.subscriberErrors++;
    try { const t = _getPort('telemetry'); if (t && t.track) { t.track(eventName, Object.assign({ component: COMPONENT_NAME }, data)); metrics.telemetryCoreForwards++; } } catch (e) {}
    try { const eb = _getPort('eventBus'); if (eb && eb.emit) { eb.emit(TELEMETRY_EVENTS.EVENT, event); metrics.eventBusForwards++; } } catch (e) {}
    if (_debugMode) _log('info', 'Event tracked:', eventName);
    return event;
  } catch (error: any) { _log('error', 'trackContextEvent error:', error.message); return null; }
};

const sanitizePayload = (data: Record<string, unknown>) => { if (!data || typeof data !== 'object') return data; try { metrics.sanitizationCount++; const sanitized: Record<string, unknown> = {}; const MAX_STRING_LENGTH = 200; const MAX_KEYS = 10; let keyCount = 0; for (const key in data) { if (!data.hasOwnProperty(key)) continue; if (keyCount >= MAX_KEYS) { sanitized._truncated = true; break; } const value = data[key]; if (typeof value === 'string' && value.length > MAX_STRING_LENGTH) { sanitized[key] = `${value.substring(0, MAX_STRING_LENGTH)}...`; } else if (typeof value === 'object' && value !== null) { sanitized[key] = '[Object]'; } else { sanitized[key] = value; } keyCount++; } return sanitized; } catch (error: any) { return { error: 'sanitization-failed' }; } };
const getSessionId = () => { try { if (typeof window === 'undefined') return 'server-side'; if (!(window as any)._contextProviderSessionId) { (window as any)._contextProviderSessionId = `ctx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; } return (window as any)._contextProviderSessionId; } catch (error: any) { return 'unknown'; } };
const getEventLog = () => { try { return eventLog.slice(); } catch (error: any) { return []; } };
const clearEventLog = () => { eventLog.length = 0; _log('info', 'Event log cleared'); };
const getEventsByType = (eventType: string) => { try { return eventLog.filter(e => e.event === eventType); } catch (error: any) { return []; } };
const getRecentEvents = (count: number) => { if (!count) count = 10; try { const safeCount = Math.min(Math.max(1, count), eventLog.length); return eventLog.slice(-safeCount); } catch (error: any) { return []; } };
const getHotContexts = (threshold: number) => { if (!threshold) threshold = 50; const hot: Array<{ context: string; events: number; lastEventAt: number | null }> = []; for (const contextName in metrics.contextMetrics) { if (metrics.contextMetrics.hasOwnProperty(contextName)) { const data = metrics.contextMetrics[contextName]; if (data.events > threshold) hot.push({ context: contextName, events: data.events, lastEventAt: data.lastEventAt }); } } return hot.sort((a, b) => b.events - a.events); };

const healthCheck = () => { const portsSnapshot = Ports.snapshot(); const hotContexts = getHotContexts(100); const checks = { logInitialized: Array.isArray(eventLog), logNotOverflowing: eventLog.length < maxLogSize, noSubscriberErrors: metrics.subscriberErrors === 0, sessionIdAvailable: getSessionId() !== 'unknown', noHotContexts: hotContexts.length === 0, loggerAvailable: !!_getPort('logger'), telemetryAvailable: !!_getPort('telemetry'), portsInitialized: portsSnapshot._initialized }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; let status = 'HEALTHY'; if (passed < total * 0.5) status = 'UNHEALTHY'; else if (passed < total) status = 'DEGRADED'; const issues = []; if (!checks.logInitialized) issues.push('Event log not initialized'); if (!checks.logNotOverflowing) issues.push('Event log at max capacity'); if (!checks.noSubscriberErrors) issues.push(`${metrics.subscriberErrors} subscriber errors`); if (!checks.sessionIdAvailable) issues.push('Session ID not available'); if (!checks.noHotContexts) issues.push({ type: 'hot-contexts', contexts: hotContexts }); return { status, score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: issues.length > 0 ? issues : null, version: VERSION, moduleId: MODULE_ID, portsInitialized: portsSnapshot._initialized, timestamp: Date.now() }; };

const getTrackerStats = () => { const portsSnapshot = Ports.snapshot(); try { const hotContexts = getHotContexts(50); return { version: VERSION, moduleId: MODULE_ID, eventsCount: eventLog.length, maxSize: maxLogSize, recentCount: Math.min(eventLog.length, 10), sessionId: getSessionId(), metrics: { totalEvents: metrics.totalEvents, globalStateUpdates: metrics.globalStateUpdates, orchestratorUpdates: metrics.orchestratorUpdates, subscriberErrors: metrics.subscriberErrors, lastEventAt: metrics.lastEventAt, topEvents: getTopEvents(5), contextCount: Object.keys(metrics.contextMetrics).length }, hotContexts: hotContexts.length > 0 ? hotContexts : null, portsInitialized: portsSnapshot._initialized }; } catch (error: any) { return { version: VERSION, moduleId: MODULE_ID, eventsCount: 0, error: error.message }; } };

const getTopEvents = (n: number) => { if (!n) n = 5; try { const sorted = Object.entries(metrics.eventsByType).sort((a, b) => (b[1] as any) - (a[1] as any)).slice(0, n); return Object.fromEntries(sorted); } catch (error: any) { return {}; } };
const getTopContexts = (n: number) => { if (!n) n = 5; try { const sorted = Object.entries(metrics.contextMetrics).sort((a, b) => (b[1] as any).events - (a[1] as any).events).slice(0, n); return sorted.map(item => ({
  name: item[0],
  events: (item[1] as any).events
})); } catch (error: any) { return []; } };

const info = () => { const portsSnapshot = Ports.snapshot(); return { version: VERSION, moduleId: MODULE_ID, debug: _debugMode, eventLogSize: eventLog.length, maxLogSize, sessionId: getSessionId(), metrics: Object.assign({}, metrics), topContexts: getTopContexts(5), hotContexts: getHotContexts(50), healthCheck: healthCheck(), integrations: { telemetryAvailable: !!_getPort('telemetry'), eventBusAvailable: !!(_getPort('eventBus') && _getPort('eventBus').emit) }, portsInitialized: portsSnapshot._initialized }; };

const resetMetrics = () => { metrics = { totalEvents: 0, eventsByType: {}, contextMetrics: {}, globalStateUpdates: 0, orchestratorUpdates: 0, subscriberErrors: 0, telemetryCoreForwards: 0, eventBusForwards: 0, sanitizationCount: 0, lastEventAt: null }; _log('info', 'Metrics reset'); };

export { trackContextEvent, getEventLog, clearEventLog, getEventsByType, getRecentEvents, getTrackerStats, getSessionId, getHotContexts, getTopContexts, resetMetrics, healthCheck, info, setDebug };
export default trackContextEvent;
