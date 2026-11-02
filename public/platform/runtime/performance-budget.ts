// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.2.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: platform-performance-budget
// PURPOSE: Performance Budget Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   from /core/runtime/events/index.js
//
// PROVIDES:
//   VERSION
//   MODULE_ID
//   init
//   recordMetric
//   startTiming
//   enableDegradeMode
//   disableDegradeMode
//   isDegradeMode
//   getMetric
//   getAllMetrics
//   getViolations
//   getBudgets
//   info
//   default export
// ═══════════════════════════════════════════════════════════════
'use strict';

import { PERFORMANCE_EVENTS } from '/core/runtime/events/catalog/performance.events.js';

interface EventBus {
  emit(event: string, data: Record<string, unknown>): void;
}

interface Metric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

interface Violation {
  metric: string;
  value: number;
  budget: number;
  timestamp: number;
}

const VERSION = '3.2.0-P2-ENTERPRISE';
const MODULE_ID = 'platform-performance-budget';

const BUDGETS: Record<string, number> = {
  CPU_LIMIT: 80,
  MEMORY_LIMIT_MB: 500,
  RENDER_TIME_MS: 100,
  LOAD_TIME_MS: 3000,
  INTERACTION_TIME_MS: 50
};

const _metrics: Record<string, Metric> = {};
const _violations: Violation[] = [];
let _eventBus: EventBus | null = null;
let _degradeMode = false;

function init(context: Record<string, unknown>) {
  if (!context) context = {};
  _eventBus = (context.eventBus as EventBus) || null;
  _emit(PERFORMANCE_EVENTS.INIT, { version: VERSION, budgets: BUDGETS });
  return { version: VERSION, moduleId: MODULE_ID };
}

function recordMetric(name: string, value: number, unit: string) {
  if (!unit) unit = 'ms';
  const metric: Metric = { name, value, unit, timestamp: Date.now() };
  _metrics[name] = metric;
  checkBudget(name, value);
  return metric;
}

function startTiming(name: string) {
  const start = performance.now();
  return () => {
    const duration = performance.now() - start;
    recordMetric(name, duration, 'ms');
    return duration;
  };
}

function checkBudget(name: string, value: number) {
  let violated = false;
  let budget: number | null = null;

  if (name.indexOf('render') !== -1 && value > BUDGETS.RENDER_TIME_MS) {
    violated = true; budget = BUDGETS.RENDER_TIME_MS;
  } else if (name.indexOf('load') !== -1 && value > BUDGETS.LOAD_TIME_MS) {
    violated = true; budget = BUDGETS.LOAD_TIME_MS;
  } else if (name.indexOf('interaction') !== -1 && value > BUDGETS.INTERACTION_TIME_MS) {
    violated = true; budget = BUDGETS.INTERACTION_TIME_MS;
  }

  if (violated) {
    const violation: Violation = { metric: name, value, budget: budget!, timestamp: Date.now() };
    _violations.push(violation);
    _emit(PERFORMANCE_EVENTS.VIOLATION, violation as unknown as Record<string, unknown>);
    if (_violations.length > 5) enableDegradeMode();
  }
}

function enableDegradeMode() {
  if (_degradeMode) return;
  _degradeMode = true;
  _emit(PERFORMANCE_EVENTS.DEGRADE_MODE, { enabled: true });
}

function disableDegradeMode() {
  _degradeMode = false;
  _violations.length = 0;
  _emit(PERFORMANCE_EVENTS.DEGRADE_MODE, { enabled: false });
}

function isDegradeMode() { return _degradeMode; }
function getMetric(name: string) { return _metrics[name] || null; }
function getAllMetrics() { return Object.assign({}, _metrics); }
function getViolations() { return _violations.slice(); }
function getBudgets() { return Object.assign({}, BUDGETS); }

function _emit(event: string, data: Record<string, unknown>) {
  if (!data) data = {};
  if (_eventBus && _eventBus.emit) _eventBus.emit(event, Object.assign({}, data, { source: MODULE_ID, timestamp: Date.now() }));
}

function info() {
  return { version: VERSION, moduleId: MODULE_ID, degradeMode: _degradeMode, metricsCount: Object.keys(_metrics).length, violationsCount: _violations.length, budgets: BUDGETS };
}

export { VERSION, MODULE_ID, init, recordMetric, startTiming, enableDegradeMode, disableDegradeMode, isDegradeMode, getMetric, getAllMetrics, getViolations, getBudgets, info };
export default { VERSION, MODULE_ID, init, recordMetric, startTiming, enableDegradeMode, disableDegradeMode, isDegradeMode, getMetric, getAllMetrics, getViolations, getBudgets, info };
