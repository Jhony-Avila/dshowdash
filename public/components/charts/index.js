import { isStrict, recordViolation } from "/core/runtime/enterprise/strict-mode.js";
import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { CHARTS_EVENTS } from "/core/runtime/events/catalog/charts.events.js";
const MODULE_ID = "charts";
const VERSION = "1.7.0-P2-ENTERPRISE";
const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
let _initialized = false;
let _debug = false;
let _charts = {};
const _metrics = { chartsLoaded: 0, chartsDestroyed: 0, errors: 0, lastActivity: null };
const _log = (level, msg, extra) => {
  const logger = _getPort("logger");
  if (!logger) return;
  if (level === "error") {
    logger.error?.(`[${MODULE_ID}] ${msg}`, extra);
    return;
  }
  if (level === "warn") {
    logger.warn?.(`[${MODULE_ID}] ${msg}`, extra);
    return;
  }
  if (level === "info") {
    logger.info?.(`[${MODULE_ID}] ${msg}`, extra);
    return;
  }
  if (_debug) logger.debug?.(`[${MODULE_ID}] ${msg}`, extra);
};
const AVAILABLE_CHARTS = {
  "executions-timeline": { path: "./executions-timeline/index.js", name: "Executions Timeline", type: "line" },
  "performance-comparison": { path: "./performance-comparison/index.js", name: "Performance Comparison", type: "bar" }
};
const init = (options = {}) => {
  if (_initialized) {
    _log("warn", "J\xE1 inicializado");
    return Promise.resolve();
  }
  _initPorts();
  _debug = options.debug || false;
  _initialized = true;
  _metrics.lastActivity = Date.now();
  _log("info", `${VERSION} inicializado`);
  const eb = _getPort("eventBus");
  eb?.emit?.(CHARTS_EVENTS.READY, { version: VERSION });
  return Promise.resolve();
};
const loadChart = (chartId, container) => {
  if (!AVAILABLE_CHARTS[chartId]) {
    _log("error", `Chart n\xE3o encontrado: ${chartId}`);
    _metrics.errors++;
    return Promise.resolve(null);
  }
  const chartConfig = AVAILABLE_CHARTS[chartId];
  return import(chartConfig.path).then((module) => {
    const ChartClass = module.default;
    const instance = new ChartClass(container);
    _charts[chartId] = instance;
    _metrics.chartsLoaded++;
    _metrics.lastActivity = Date.now();
    _log("info", `Chart carregado: ${chartId}`);
    return instance;
  }).catch((err) => {
    _log("error", `Erro ao carregar ${chartId}:`, err.message);
    _metrics.errors++;
    return null;
  });
};
const destroyChart = (chartId) => {
  const instance = _charts[chartId];
  if (instance?.destroy) {
    instance.destroy();
    delete _charts[chartId];
    _metrics.chartsDestroyed++;
    _metrics.lastActivity = Date.now();
    _log("info", `Chart destru\xEDdo: ${chartId}`);
    return true;
  }
  return false;
};
const destroyAll = () => {
  for (const [id, chart] of Object.entries(_charts)) {
    if (chart?.destroy) {
      chart.destroy();
      _metrics.chartsDestroyed++;
    }
  }
  _charts = {};
  _metrics.lastActivity = Date.now();
  _log("info", "Todos os charts destru\xEDdos");
};
const cleanup = () => {
  destroyAll();
  return { success: true, moduleId: MODULE_ID };
};
const getChart = (chartId) => _charts[chartId] || null;
const getLoadedCharts = () => Object.keys(_charts);
const getAvailableCharts = () => Object.keys(AVAILABLE_CHARTS);
const getVersion = () => VERSION;
const healthCheck = () => {
  const portsSnapshot = Ports.snapshot();
  const checks = { initialized: _initialized, chartsAvailable: Object.keys(AVAILABLE_CHARTS).length > 0, noErrors: _metrics.errors === 0, activeCharts: Object.keys(_charts).length > 0 || true, portsInitialized: portsSnapshot._initialized };
  const score = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  let status = "UNHEALTHY";
  if (score === total) status = "HEALTHY";
  else if (score > 1) status = "DEGRADED";
  return { status, score, maxScore: total, scoreDisplay: `${score}/${total}`, checks, chartsLoaded: Object.keys(_charts).length, availableCharts: Object.keys(AVAILABLE_CHARTS), portsInitialized: portsSnapshot._initialized, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
};
const info = () => {
  const portsSnapshot = Ports.snapshot();
  return { moduleId: MODULE_ID, version: VERSION, initialized: _initialized, portsInitialized: portsSnapshot._initialized, availableCharts: AVAILABLE_CHARTS, loadedCharts: getLoadedCharts(), metrics: { ..._metrics }, healthCheck: healthCheck(), timestamp: Date.now() };
};
const reset = () => {
  destroyAll();
  _metrics.chartsLoaded = 0;
  _metrics.chartsDestroyed = 0;
  _metrics.errors = 0;
  _metrics.lastActivity = Date.now();
  _log("info", "Reset completo");
  return { success: true, moduleId: MODULE_ID };
};
if (typeof window !== "undefined") {
  const chartsApi = { init, loadChart, destroyChart, destroyAll, getChart, getLoadedCharts, getAvailableCharts, getVersion, healthCheck, info, reset, cleanup, injectPorts, getPorts };
  window.__dev = window.__dev || {};
  window.__dev.charts = chartsApi;
  if (isStrict()) {
    const originalCharts = chartsApi;
    Object.defineProperty(window.__dev, "charts", {
      get() {
        recordViolation("DIAGNOSTIC_WINDOW_ACCESS", { module: MODULE_ID, property: "charts", access: "devtools-access" });
        return originalCharts;
      },
      configurable: true
    });
  }
}
var charts_default = { init, loadChart, destroyChart, destroyAll, getChart, getLoadedCharts, getAvailableCharts, getVersion, healthCheck, info, reset, cleanup, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  cleanup,
  charts_default as default,
  destroyAll,
  destroyChart,
  getAvailableCharts,
  getChart,
  getLoadedCharts,
  getPorts,
  getVersion,
  healthCheck,
  info,
  init,
  injectPorts,
  loadChart,
  reset
};
