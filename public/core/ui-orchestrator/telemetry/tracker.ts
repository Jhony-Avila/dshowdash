// UI Orchestrator - Telemetry Tracker
// DEPENDENCY CONTRACT — UI Orchestrator module
// @version 1.0.0-ENTERPRISE
// Rastreamento de métricas e eventos do Orchestrator
'use strict';

export const VERSION = '1.0.0-P2-ENTERPRISE';
export const MODULE_ID = 'ui-orchestrator-telemetry';

interface TrackerMetrics {
  intents: { total: number; resolved: number; failed: number; fallback: number };
  triggers: { total: number; bySource: Record<string, number> };
  navigation: { total: number; byRoute: Record<string, number> };
  panels: { opened: number; byPanel: Record<string, number> };
  performance: { avgResolveTime: number; maxResolveTime: number; samples: number[] };
  errorCount: number;
}

const _metrics: TrackerMetrics = {
  intents: { total: 0, resolved: 0, failed: 0, fallback: 0 },
  triggers: { total: 0, bySource: {} },
  navigation: { total: 0, byRoute: {} },
  panels: { opened: 0, byPanel: {} },
  performance: { avgResolveTime: 0, maxResolveTime: 0, samples: [] },
  errorCount: 0
};

const _events: { type: string; data: unknown; timestamp: number }[] = [];
const MAX_EVENTS = 100;

export function trackIntent(intentId: string, success: boolean, resolveTime = 0) {
  _metrics.intents.total++;
  if (success) _metrics.intents.resolved++;
  else _metrics.intents.failed++;

  _updatePerformance(resolveTime);
  _addEvent('intent', { intentId, success, resolveTime });
}

export function trackFallback(intentId: string) {
  _metrics.intents.fallback++;
  _addEvent('fallback', { intentId });
}

export function trackTrigger(triggerId: string, source: string) {
  _metrics.triggers.total++;
  _metrics.triggers.bySource[source] = (_metrics.triggers.bySource[source] || 0) + 1;
  _addEvent('trigger', { triggerId, source });
}

export function trackNavigation(path: string, routeId: string) {
  _metrics.navigation.total++;
  _metrics.navigation.byRoute[routeId] = (_metrics.navigation.byRoute[routeId] || 0) + 1;
  _addEvent('navigation', { path, routeId });
}

export function trackPanelOpen(panelId: string, region: string) {
  _metrics.panels.opened++;
  _metrics.panels.byPanel[panelId] = (_metrics.panels.byPanel[panelId] || 0) + 1;
  _addEvent('panel', { panelId, region });
}

function _updatePerformance(resolveTime: number) {
  if (resolveTime <= 0) return;

  _metrics.performance.samples.push(resolveTime);
  if (_metrics.performance.samples.length > 100) {
    _metrics.performance.samples.shift();
  }

  const sum = _metrics.performance.samples.reduce((a: number, b: number) => a + b, 0);
  _metrics.performance.avgResolveTime = sum / _metrics.performance.samples.length;
  _metrics.performance.maxResolveTime = Math.max(_metrics.performance.maxResolveTime, resolveTime);
}

function _addEvent(type: string, data: unknown) {
  _events.push({ type, data, timestamp: Date.now() });
  if (_events.length > MAX_EVENTS) _events.shift();
}

export function getMetrics() { return JSON.parse(JSON.stringify(_metrics)); }
export function getRecentEvents(count = 20) { return _events.slice(-count); }
export function reset() {
  _metrics.intents = { total: 0, resolved: 0, failed: 0, fallback: 0 };
  _metrics.triggers = { total: 0, bySource: {} };
  _metrics.navigation = { total: 0, byRoute: {} };
  _metrics.panels = { opened: 0, byPanel: {} };
  _metrics.performance = { avgResolveTime: 0, maxResolveTime: 0, samples: [] };
  _metrics.errorCount = 0;
  _events.length = 0;
}

export function healthCheck() {
  return {
    status: (_metrics.errorCount === 0) ? 'HEALTHY' : 'DEGRADED',
    metrics: getMetrics(),
    eventsBuffered: _events.length
  };
}

export default { VERSION, MODULE_ID, trackIntent, trackFallback, trackTrigger, trackNavigation, trackPanelOpen, getMetrics, getRecentEvents, reset, healthCheck };
