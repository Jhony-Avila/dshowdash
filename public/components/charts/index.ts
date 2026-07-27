// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.7.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.charts
// PURPOSE: Charts component with lazy loading and lifecycle management
// ───────────────────────────────────────────────────────────────
// @contract INIT - init(options) initializes charts module
// @contract LOAD_CHART - loadChart(chartId, container) loads a chart
// @contract DESTROY_CHART - destroyChart(chartId) destroys a chart
// @contract DESTROY_ALL - destroyAll() destroys all charts
// @contract CLEANUP - cleanup() cleans up charts module
// @contract RESET - reset() resets charts module
// @contract PORTS - injectPorts()/getPorts() for dependency injection
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: createCorePorts from /core/runtime/ports-profiles.js
// IMPORTS: CHARTS_EVENTS from /core/runtime/events/index.js
// IMPORTS: isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
// PROVIDES: init, loadChart, destroyChart, destroyAll, getChart, getLoadedCharts,
//           getAvailableCharts, getVersion, healthCheck, info, reset, cleanup,
//           injectPorts, getPorts, VERSION, MODULE_ID
// @changelog v1.7.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.6.0-STRICT-MODE: Strict mode integration
// @changelog v1.5.0-ENTERPRISE: ES6 modernization
// @changelog v1.4.0-ENTERPRISE: Removed console.* fallback
// ═══════════════════════════════════════════════════════════════
'use strict';

import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';
import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { CHARTS_EVENTS } from '/core/runtime/events/catalog/charts.events.js';

const MODULE_ID = 'charts';
const VERSION = '1.7.0-P2-ENTERPRISE';

const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

let _initialized = false;
let _debug = false;
let _charts: Record<string, any> = {};
const _metrics: { chartsLoaded: number; chartsDestroyed: number; errors: number; lastActivity: number | null } = { chartsLoaded: 0, chartsDestroyed: 0, errors: 0, lastActivity: null };

const _log = (level: 'error' | 'warn' | 'info' | 'debug', msg: string, extra?: unknown) => {
  const logger = _getPort('logger');
  if (!logger) return;
  if (level === 'error') { logger.error?.(`[${MODULE_ID}] ${msg}`, extra); return; }
  if (level === 'warn') { logger.warn?.(`[${MODULE_ID}] ${msg}`, extra); return; }
  if (level === 'info') { logger.info?.(`[${MODULE_ID}] ${msg}`, extra); return; }
  if (_debug) logger.debug?.(`[${MODULE_ID}] ${msg}`, extra);
};

const AVAILABLE_CHARTS = {
  'executions-timeline': { path: './executions-timeline/index.js', name: 'Executions Timeline', type: 'line' },
  'performance-comparison': { path: './performance-comparison/index.js', name: 'Performance Comparison', type: 'bar' }
};

const init = (options: { debug?: boolean } & Record<string, unknown> = {}) => {
  if (_initialized) { _log('warn', 'Já inicializado'); return Promise.resolve(); }
  _initPorts();
  _debug = options.debug || false;
  _initialized = true;
  _metrics.lastActivity = Date.now();
  _log('info', `${VERSION} inicializado`);
  const eb = _getPort('eventBus');
  eb?.emit?.(CHARTS_EVENTS.READY, { version: VERSION });
  return Promise.resolve();
};

const loadChart = (chartId: string, container: HTMLElement) => {
  if (!(AVAILABLE_CHARTS as any)[chartId]) { _log('error', `Chart não encontrado: ${chartId}`); _metrics.errors++; return Promise.resolve(null); }
  const chartConfig = (AVAILABLE_CHARTS as any)[chartId];
  return import(chartConfig.path).then((module: { default: new (container: HTMLElement) => unknown }) => {
    const ChartClass = module.default;
    const instance = new (ChartClass as any)(container);
    _charts[chartId] = instance;
    _metrics.chartsLoaded++;
    _metrics.lastActivity = Date.now();
    _log('info', `Chart carregado: ${chartId}`);
    return instance;
  }).catch((err: Error): null => { _log('error', `Erro ao carregar ${chartId}:`, err.message); _metrics.errors++; return null; });
};

const destroyChart = (chartId: string) => {
  const instance = _charts[chartId];
  if (instance?.destroy) { instance.destroy(); delete _charts[chartId]; _metrics.chartsDestroyed++; _metrics.lastActivity = Date.now(); _log('info', `Chart destruído: ${chartId}`); return true; }
  return false;
};

const destroyAll = () => {
  for (const [id, chart] of Object.entries(_charts)) { if ((chart as any)?.destroy) { (chart as any).destroy(); _metrics.chartsDestroyed++; } }
  _charts = {};
  _metrics.lastActivity = Date.now();
  _log('info', 'Todos os charts destruídos');
};

const cleanup = () => { destroyAll(); return { success: true, moduleId: MODULE_ID }; };
const getChart = (chartId: string) => _charts[chartId] || null;
const getLoadedCharts = () => Object.keys(_charts);
const getAvailableCharts = () => Object.keys(AVAILABLE_CHARTS);
const getVersion = () => VERSION;

const healthCheck = () => {
  const portsSnapshot = Ports.snapshot();
  const checks = { initialized: _initialized, chartsAvailable: Object.keys(AVAILABLE_CHARTS).length > 0, noErrors: _metrics.errors === 0, activeCharts: Object.keys(_charts).length > 0 || true, portsInitialized: portsSnapshot._initialized };
  const score = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  let status = 'UNHEALTHY';
  if (score === total) status = 'HEALTHY';
  else if (score > 1) status = 'DEGRADED';
  return { status, score, maxScore: total, scoreDisplay: `${score}/${total}`, checks, chartsLoaded: Object.keys(_charts).length, availableCharts: Object.keys(AVAILABLE_CHARTS), portsInitialized: portsSnapshot._initialized, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
};

const info = () => {
  const portsSnapshot = Ports.snapshot();
  return { moduleId: MODULE_ID, version: VERSION, initialized: _initialized, portsInitialized: portsSnapshot._initialized, availableCharts: AVAILABLE_CHARTS, loadedCharts: getLoadedCharts(), metrics: { ..._metrics }, healthCheck: healthCheck(), timestamp: Date.now() };
};

const reset = () => { destroyAll(); _metrics.chartsLoaded = 0; _metrics.chartsDestroyed = 0; _metrics.errors = 0; _metrics.lastActivity = Date.now(); _log('info', 'Reset completo'); return { success: true, moduleId: MODULE_ID }; };

if (typeof window !== 'undefined') {
  const chartsApi = { init, loadChart, destroyChart, destroyAll, getChart, getLoadedCharts, getAvailableCharts, getVersion, healthCheck, info, reset, cleanup, injectPorts, getPorts };

  // DevTools sempre permitido
  (window as any).__dev = (window as any).__dev || {};
  (window as any).__dev.charts = chartsApi;

  // Em strict mode, registrar violação se acessado via window.__dev.charts diretamente fora de DevTools
  if (isStrict()) {
    const originalCharts = chartsApi;
    Object.defineProperty((window as any).__dev, 'charts', {
      get() {
        recordViolation('DIAGNOSTIC_WINDOW_ACCESS', { module: MODULE_ID, property: 'charts', access: 'devtools-access' });
        return originalCharts;
      },
      configurable: true
    });
  }
}

export { init, loadChart, destroyChart, destroyAll, getChart, getLoadedCharts, getAvailableCharts, getVersion, healthCheck, info, reset, cleanup, VERSION, MODULE_ID };
export default { init, loadChart, destroyChart, destroyAll, getChart, getLoadedCharts, getAvailableCharts, getVersion, healthCheck, info, reset, cleanup, injectPorts, getPorts, VERSION, MODULE_ID };
