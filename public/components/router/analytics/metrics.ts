// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: router.analytics.metrics
// PURPOSE: Router Performance Metrics v1.2.0-P17WI
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   RouterMetrics — exported value
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
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

import { createUiPorts } from '/core/runtime/ports-profiles.js';

const VERSION = '1.2.0-P17WI';
const MODULE_ID = 'router.analytics.metrics';

const hasWindow = typeof window !== 'undefined';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }

function _log(level: string, msg: string, ctx: Record<string, unknown>) {
  if (!ctx) ctx = {};
  const logger = _getPort('logger');
  if (!logger || typeof logger[level] !== 'function') return;
  ctx.component = MODULE_ID;
  logger[level](msg, ctx);
}

interface MetricEntry { count: number; totalTime: number; minTime: number; maxTime: number; times: { duration: number; timestamp: number; path: string | null }[]; }
const _metrics: Record<string, MetricEntry> = {
  static: { count: 0, totalTime: 0, minTime: Infinity, maxTime: 0, times: [] },
  dynamic: { count: 0, totalTime: 0, minTime: Infinity, maxTime: 0, times: [] },
  'dynamic-pattern': { count: 0, totalTime: 0, minTime: Infinity, maxTime: 0, times: [] },
  fallback: { count: 0, totalTime: 0, minTime: Infinity, maxTime: 0, times: [] },
  inferred: { count: 0, totalTime: 0, minTime: Infinity, maxTime: 0, times: [] }
};

const _global: { totalResolves: number; totalTime: number; startTime: number; lastResolveTime: number | null; slowResolves: number; slowThreshold: number } = { totalResolves: 0, totalTime: 0, startTime: Date.now(), lastResolveTime: null, slowResolves: 0, slowThreshold: 50 };

const _histogram: { buckets: number[]; counts: Record<string, number> } = { buckets: [5, 10, 25, 50, 100, 250, 500, 1000], counts: {} };
_histogram.buckets.forEach(b => { _histogram.counts[`<=${b}ms`] = 0; });
_histogram.counts['>1000ms'] = 0;

const CONFIG = { keepSamples: 100, enabled: true };

const RouterMetrics = {
  record(matchType: string, duration: number, route: Record<string, unknown> | null) {
    if (!CONFIG.enabled) return;
    const type = matchType || 'unknown';
    if (!_metrics[type]) { _metrics[type] = { count: 0, totalTime: 0, minTime: Infinity, maxTime: 0, times: [] }; }
    const m = _metrics[type];
    m.count++;
    m.totalTime += duration;
    m.minTime = Math.min(m.minTime, duration);
    m.maxTime = Math.max(m.maxTime, duration);
    m.times.push({ duration, timestamp: Date.now(), path: route ? (route.path as string) : null });
    if (m.times.length > CONFIG.keepSamples) m.times.shift();
    _global.totalResolves++;
    _global.totalTime += duration;
    _global.lastResolveTime = Date.now();
    if (duration > _global.slowThreshold) { _global.slowResolves++; _log('debug', 'Slow resolve detected', { type, duration, path: route ? route.path : null }); }
    let bucket = null;
    for (let i = 0; i < _histogram.buckets.length; i++) { if (duration <= _histogram.buckets[i]) { bucket = _histogram.buckets[i]; break; } }
    if (bucket) { _histogram.counts[`<=${bucket}ms`]++; } else { _histogram.counts['>1000ms']++; }
  },
  startTimer() { return performance.now(); },
  endTimer(startTime: number, matchType: string, route: Record<string, unknown> | null) { const duration = performance.now() - startTime; this.record(matchType, duration, route); return duration; },
  getByType(type: string) { const m = _metrics[type]; if (!m || m.count === 0) return null; return { count: m.count, avgTime: `${(m.totalTime / m.count).toFixed(2)}ms`, minTime: m.minTime === Infinity ? '0ms' : `${m.minTime.toFixed(2)}ms`, maxTime: `${m.maxTime.toFixed(2)}ms`, totalTime: `${m.totalTime.toFixed(2)}ms` }; },
  getAll() { const result: Record<string, unknown> = {}; const self = this; Object.keys(_metrics).forEach(type => { if (_metrics[type].count > 0) { result[type] = self.getByType(type); } }); return result; },
  getGlobal() { const uptime = Date.now() - _global.startTime; return { totalResolves: _global.totalResolves, totalTime: `${_global.totalTime.toFixed(2)}ms`, avgTime: _global.totalResolves > 0 ? `${(_global.totalTime / _global.totalResolves).toFixed(2)}ms` : '0ms', slowResolves: _global.slowResolves, slowPercentage: _global.totalResolves > 0 ? `${((_global.slowResolves / _global.totalResolves) * 100).toFixed(2)}%` : '0%', uptime: `${Math.floor(uptime / 1000)}s`, resolvesPerMinute: uptime > 0 ? ((_global.totalResolves / uptime) * 60000).toFixed(2) : 0 }; },
  getHistogram() { return Object.assign({}, _histogram.counts); },
  getPercentiles(type?: string) { let samples: number[] = []; if (type && _metrics[type]) { samples = _metrics[type].times.map(t => t.duration); } else { Object.values(_metrics).forEach(m => { m.times.forEach((t: { duration: number }) => { samples.push(t.duration); }); }); } if (samples.length === 0) return { p50: 0, p90: 0, p99: 0 }; samples.sort((a: number, b: number) => a - b); const p = (pct: number) => { const idx = Math.floor(samples.length * pct / 100); return samples[Math.min(idx, samples.length - 1)]; }; return { p50: `${p(50).toFixed(2)}ms`, p90: `${p(90).toFixed(2)}ms`, p99: `${p(99).toFixed(2)}ms`, sampleSize: samples.length }; },
  getSlowestRoutes(n: number) { if (!n) n = 10; const all: { duration: number; timestamp: number; path: string | null }[] = []; Object.values(_metrics).forEach(m => { m.times.forEach((t: { duration: number; timestamp: number; path: string | null }) => { all.push(t); }); }); return all.sort((a, b) => b.duration - a.duration).slice(0, n).map(t => ({
    path: t.path,
    duration: `${t.duration.toFixed(2)}ms`,
    timestamp: t.timestamp
  })); },
  configure(options: Record<string, unknown>) { Object.assign(CONFIG, options); if (options.slowThreshold) _global.slowThreshold = options.slowThreshold as number; },
  enable() { CONFIG.enabled = true; },
  disable() { CONFIG.enabled = false; },
  isEnabled() { return CONFIG.enabled; },
  reset() { Object.values(_metrics).forEach(m => { m.count = 0; m.totalTime = 0; m.minTime = Infinity; m.maxTime = 0; m.times = []; }); _global.totalResolves = 0; _global.totalTime = 0; _global.slowResolves = 0; _global.startTime = Date.now(); Object.keys(_histogram.counts).forEach(k => { _histogram.counts[k] = 0; }); },
  getStatus() { return { version: VERSION, moduleId: MODULE_ID, enabled: CONFIG.enabled, portsInitialized: Ports.isInitialized(), global: this.getGlobal(), byType: this.getAll(), percentiles: this.getPercentiles(), histogram: this.getHistogram() }; },
  healthCheck() { const slowPct = _global.totalResolves > 0 ? (_global.slowResolves / _global.totalResolves) : 0; return { status: slowPct < 0.1 ? 'HEALTHY' : (slowPct < 0.25 ? 'DEGRADED' : 'UNHEALTHY'), moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), checks: { enabled: CONFIG.enabled, slowResolveRate: `${(slowPct * 100).toFixed(2)}%`, acceptable: slowPct < 0.25 } }; }
};

export { RouterMetrics, VERSION, MODULE_ID, injectPorts, getPorts };
export default RouterMetrics;
