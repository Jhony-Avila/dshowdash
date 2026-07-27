/**
 * @file App Shell — Performance Metrics
 * @version 1.1.0
 * @module app-shell/devtools/performance-metrics
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires none (uses browser Performance API)
 * 
 * @provides init, destroy, mark, measure, clearMarks, clearMeasures
 * @provides getMetrics, getMarks, getMeasures, getSampleHistory
 * @provides setInitDuration, setBootTime
 * @provides getWebVitals, getResourceBreakdown
 * @provides subscribe, healthCheck, info
 * 
 * @browserAPI performance.timing, performance.getEntriesByType
 * @browserAPI (performance as any).memory, PerformanceObserver
 * 
 * @changelog v1.1.0 - Adicionado setInitDuration, setBootTime, getMarks, getMeasures, getSampleHistory, destroy
 * ============================================================================
 */
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell-performance-metrics';

const _metrics = {
  bootTime: null as DynObj,
  initDuration: null as DynObj,
  firstPaint: null as DynObj,
  firstContentfulPaint: null as DynObj,
  domInteractive: null as DynObj,
  domComplete: null as DynObj,
  resourceCount: 0,
  resourceSize: 0,
  jsHeapUsed: null as DynObj,
  jsHeapTotal: null as DynObj,
  longTasks: [] as DynObj,
  layoutShifts: [] as DynObj,
  cumulativeLayoutShift: 0
};

const _history: DynObj[] = [];
const _config = { maxHistory: 100, sampleInterval: 5000 };
const _subscribers: DynObj[] = [];

let _initialized = false;
let _sampleInterval: DynObj = null;
let _observers: DynObj[] = [];

export function init() {
  if (_initialized) return true;
  if (typeof performance === 'undefined') return false;
  
  _collectNavigationTiming();
  _collectPaintTiming();
  _collectResourceTiming();
  _collectMemoryUsage();
  _setupObservers();
  _startSampling();
  
  _initialized = true;
  return true;
}

export function destroy() {
  if (_sampleInterval) {
    clearInterval(_sampleInterval);
    _sampleInterval = null;
  }
  for (let i = 0; i < _observers.length; i++) {
    try { _observers[i].disconnect(); } catch (e) {}
  }
  _observers = [];
  _initialized = false;
}

function _startSampling() {
  if (_sampleInterval) return;
  _sampleInterval = setInterval(function() {
    _collectMemoryUsage();
    _collectResourceTiming();
    _history.push({
      timestamp: Date.now(),
      metrics: Object.assign({}, _metrics)
    });
    if (_history.length > _config.maxHistory) _history.shift();
  }, _config.sampleInterval);
}

function _collectNavigationTiming() {
  if (!performance.timing) return;
  const t = performance.timing;
  _metrics.bootTime = t.responseStart - t.navigationStart;
  _metrics.domInteractive = t.domInteractive - t.navigationStart;
  _metrics.domComplete = t.domComplete - t.navigationStart;
}

function _collectPaintTiming() {
  const entries = performance.getEntriesByType('paint');
  for (let i = 0; i < entries.length; i++) {
    if (entries[i].name === 'first-paint') _metrics.firstPaint = Math.round(entries[i].startTime);
    if (entries[i].name === 'first-contentful-paint') _metrics.firstContentfulPaint = Math.round(entries[i].startTime);
  }
}

function _collectResourceTiming() {
  const resources = performance.getEntriesByType('resource');
  _metrics.resourceCount = resources.length;
  _metrics.resourceSize = resources.reduce((sum, r) => sum + ((r as any).transferSize || 0), 0);
}

function _collectMemoryUsage() {
  if ((performance as any).memory) {
    _metrics.jsHeapUsed = (performance as any).memory.usedJSHeapSize;
    _metrics.jsHeapTotal = (performance as any).memory.totalJSHeapSize;
  }
}

function _setupObservers() {
  if (typeof PerformanceObserver === 'undefined') return;
  
  try {
    const longTaskObserver = new PerformanceObserver(list => {
      const entries = list.getEntries();
      for (let i = 0; i < entries.length; i++) {
        _metrics.longTasks.push({ duration: entries[i].duration, startTime: entries[i].startTime });
        if (_metrics.longTasks.length > 50) _metrics.longTasks.shift();
      }
    });
    longTaskObserver.observe({ entryTypes: ['longtask'] });
    _observers.push(longTaskObserver);
  } catch (e) {}
  
  try {
    const layoutShiftObserver = new PerformanceObserver(list => {
      const entries = list.getEntries();
      for (let i = 0; i < entries.length; i++) {
        if (!(entries[i] as any).hadRecentInput) {
          _metrics.cumulativeLayoutShift += (entries[i] as any).value;
          _metrics.layoutShifts.push({ value: (entries[i] as any).value, startTime: entries[i].startTime });
          if (_metrics.layoutShifts.length > 50) _metrics.layoutShifts.shift();
        }
      }
    });
    layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
    _observers.push(layoutShiftObserver);
  } catch (e) {}
}

// ═══════════════════════════════════════════════════════════════
// MARKS & MEASURES
// ═══════════════════════════════════════════════════════════════
export function mark(name: string) { if (performance.mark) performance.mark(name); }
export function measure(name: string, start: DynObj, end: DynObj) { if (performance.measure) try { performance.measure(name, start, end); } catch (e) {} }
export function clearMarks(name: string) { if (performance.clearMarks) performance.clearMarks(name); }
export function clearMeasures(name: string) { if (performance.clearMeasures) performance.clearMeasures(name); }

export function getMarks() {
  if (!performance.getEntriesByType) return [];
  return performance.getEntriesByType('mark').map(function(e) {
    return { name: e.name, startTime: e.startTime };
  });
}

export function getMeasures() {
  if (!performance.getEntriesByType) return [];
  return performance.getEntriesByType('measure').map(function(e) {
    return { name: e.name, startTime: e.startTime, duration: e.duration };
  });
}

// ═══════════════════════════════════════════════════════════════
// SETTERS (v1.1.0)
// ═══════════════════════════════════════════════════════════════
export function setInitDuration(duration: number) {
  _metrics.initDuration = duration;
}

export function setBootTime(time: DynObj) {
  _metrics.bootTime = time;
}

// ═══════════════════════════════════════════════════════════════
// GETTERS
// ═══════════════════════════════════════════════════════════════
export function getMetrics() {
  _collectMemoryUsage();
  _collectResourceTiming();
  return Object.assign({}, _metrics);
}

export function getSampleHistory() {
  return _history.slice();
}

export function getWebVitals() {
  return {
    FCP: _metrics.firstContentfulPaint,
    CLS: Math.round(_metrics.cumulativeLayoutShift * 1000) / 1000,
    TTFB: _metrics.bootTime
  };
}

export function getResourceBreakdown() {
  const resources = performance.getEntriesByType('resource');
  const breakdown = { script: 0, stylesheet: 0, img: 0, font: 0, fetch: 0, other: 0 };
  for (let i = 0; i < resources.length; i++) {
    const type = (resources[i] as any).initiatorType;
    if (breakdown.hasOwnProperty(type)) (breakdown as DynObj)[type]++;
    else breakdown.other++;
  }
  return breakdown;
}

// ═══════════════════════════════════════════════════════════════
// SUBSCRIBE
// ═══════════════════════════════════════════════════════════════
export function subscribe(callback: DynObj) {
  if (typeof callback === 'function') _subscribers.push(callback);
  return () => {
    const idx = _subscribers.indexOf(callback);
    if (idx >= 0) _subscribers.splice(idx, 1);
  };
}

function _notifySubscribers(event: string, data: DynObj) {
  _subscribers.forEach(cb => { try { cb(event, data); } catch (e) {} });
}

// ═══════════════════════════════════════════════════════════════
// DIAGNOSTICS
// ═══════════════════════════════════════════════════════════════
export function healthCheck() {
  const checks = {
    initialized: _initialized,
    fcp: _metrics.firstContentfulPaint !== null,
    noExcessiveCLS: _metrics.cumulativeLayoutShift < 0.25
  };
  const passed = Object.values(checks).filter(Boolean).length;
  return {
    status: passed === 3 ? 'HEALTHY' : 'DEGRADED',
    score: `${passed}/3`,
    checks,
    webVitals: getWebVitals(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    initialized: _initialized,
    metrics: getMetrics(),
    webVitals: getWebVitals(),
    resourceBreakdown: getResourceBreakdown(),
    sampleHistorySize: _history.length,
    timestamp: Date.now()
  };
}

export default {
  VERSION,
  MODULE_ID,
  init,
  destroy,
  mark,
  measure,
  clearMarks,
  clearMeasures,
  getMetrics,
  getMarks,
  getMeasures,
  getSampleHistory,
  setInitDuration,
  setBootTime,
  getWebVitals,
  getResourceBreakdown,
  subscribe,
  healthCheck,
  info
};
