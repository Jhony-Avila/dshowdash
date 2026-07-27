const VERSION = "1.1.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell-performance-metrics";
const _metrics = {
  bootTime: null,
  initDuration: null,
  firstPaint: null,
  firstContentfulPaint: null,
  domInteractive: null,
  domComplete: null,
  resourceCount: 0,
  resourceSize: 0,
  jsHeapUsed: null,
  jsHeapTotal: null,
  longTasks: [],
  layoutShifts: [],
  cumulativeLayoutShift: 0
};
const _history = [];
const _config = { maxHistory: 100, sampleInterval: 5e3 };
const _subscribers = [];
let _initialized = false;
let _sampleInterval = null;
let _observers = [];
function init() {
  if (_initialized) return true;
  if (typeof performance === "undefined") return false;
  _collectNavigationTiming();
  _collectPaintTiming();
  _collectResourceTiming();
  _collectMemoryUsage();
  _setupObservers();
  _startSampling();
  _initialized = true;
  return true;
}
function destroy() {
  if (_sampleInterval) {
    clearInterval(_sampleInterval);
    _sampleInterval = null;
  }
  for (let i = 0; i < _observers.length; i++) {
    try {
      _observers[i].disconnect();
    } catch (e) {
    }
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
  const entries = performance.getEntriesByType("paint");
  for (let i = 0; i < entries.length; i++) {
    if (entries[i].name === "first-paint") _metrics.firstPaint = Math.round(entries[i].startTime);
    if (entries[i].name === "first-contentful-paint") _metrics.firstContentfulPaint = Math.round(entries[i].startTime);
  }
}
function _collectResourceTiming() {
  const resources = performance.getEntriesByType("resource");
  _metrics.resourceCount = resources.length;
  _metrics.resourceSize = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
}
function _collectMemoryUsage() {
  if (performance.memory) {
    _metrics.jsHeapUsed = performance.memory.usedJSHeapSize;
    _metrics.jsHeapTotal = performance.memory.totalJSHeapSize;
  }
}
function _setupObservers() {
  if (typeof PerformanceObserver === "undefined") return;
  try {
    const longTaskObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      for (let i = 0; i < entries.length; i++) {
        _metrics.longTasks.push({ duration: entries[i].duration, startTime: entries[i].startTime });
        if (_metrics.longTasks.length > 50) _metrics.longTasks.shift();
      }
    });
    longTaskObserver.observe({ entryTypes: ["longtask"] });
    _observers.push(longTaskObserver);
  } catch (e) {
  }
  try {
    const layoutShiftObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      for (let i = 0; i < entries.length; i++) {
        if (!entries[i].hadRecentInput) {
          _metrics.cumulativeLayoutShift += entries[i].value;
          _metrics.layoutShifts.push({ value: entries[i].value, startTime: entries[i].startTime });
          if (_metrics.layoutShifts.length > 50) _metrics.layoutShifts.shift();
        }
      }
    });
    layoutShiftObserver.observe({ entryTypes: ["layout-shift"] });
    _observers.push(layoutShiftObserver);
  } catch (e) {
  }
}
function mark(name) {
  if (performance.mark) performance.mark(name);
}
function measure(name, start, end) {
  if (performance.measure) try {
    performance.measure(name, start, end);
  } catch (e) {
  }
}
function clearMarks(name) {
  if (performance.clearMarks) performance.clearMarks(name);
}
function clearMeasures(name) {
  if (performance.clearMeasures) performance.clearMeasures(name);
}
function getMarks() {
  if (!performance.getEntriesByType) return [];
  return performance.getEntriesByType("mark").map(function(e) {
    return { name: e.name, startTime: e.startTime };
  });
}
function getMeasures() {
  if (!performance.getEntriesByType) return [];
  return performance.getEntriesByType("measure").map(function(e) {
    return { name: e.name, startTime: e.startTime, duration: e.duration };
  });
}
function setInitDuration(duration) {
  _metrics.initDuration = duration;
}
function setBootTime(time) {
  _metrics.bootTime = time;
}
function getMetrics() {
  _collectMemoryUsage();
  _collectResourceTiming();
  return Object.assign({}, _metrics);
}
function getSampleHistory() {
  return _history.slice();
}
function getWebVitals() {
  return {
    FCP: _metrics.firstContentfulPaint,
    CLS: Math.round(_metrics.cumulativeLayoutShift * 1e3) / 1e3,
    TTFB: _metrics.bootTime
  };
}
function getResourceBreakdown() {
  const resources = performance.getEntriesByType("resource");
  const breakdown = { script: 0, stylesheet: 0, img: 0, font: 0, fetch: 0, other: 0 };
  for (let i = 0; i < resources.length; i++) {
    const type = resources[i].initiatorType;
    if (breakdown.hasOwnProperty(type)) breakdown[type]++;
    else breakdown.other++;
  }
  return breakdown;
}
function subscribe(callback) {
  if (typeof callback === "function") _subscribers.push(callback);
  return () => {
    const idx = _subscribers.indexOf(callback);
    if (idx >= 0) _subscribers.splice(idx, 1);
  };
}
function _notifySubscribers(event, data) {
  _subscribers.forEach((cb) => {
    try {
      cb(event, data);
    } catch (e) {
    }
  });
}
function healthCheck() {
  const checks = {
    initialized: _initialized,
    fcp: _metrics.firstContentfulPaint !== null,
    noExcessiveCLS: _metrics.cumulativeLayoutShift < 0.25
  };
  const passed = Object.values(checks).filter(Boolean).length;
  return {
    status: passed === 3 ? "HEALTHY" : "DEGRADED",
    score: `${passed}/3`,
    checks,
    webVitals: getWebVitals(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
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
var performance_metrics_default = {
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
export {
  MODULE_ID,
  VERSION,
  clearMarks,
  clearMeasures,
  performance_metrics_default as default,
  destroy,
  getMarks,
  getMeasures,
  getMetrics,
  getResourceBreakdown,
  getSampleHistory,
  getWebVitals,
  healthCheck,
  info,
  init,
  mark,
  measure,
  setBootTime,
  setInitDuration,
  subscribe
};
