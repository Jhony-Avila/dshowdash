import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "2.4.0-ES6";
const MODULE_ID = "header.core.css-loader";
const hasWindow = typeof window !== "undefined";
const hasDocument = typeof document !== "undefined";
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
function _debugEnabled() {
  const cfg = _getPort("config");
  return cfg && cfg.app && cfg.app.debug || false;
}
function _log(level, ...args) {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === "error" && logger.error) {
    logger.error.apply(logger, [prefix].concat(args));
    return;
  }
  if (level === "warn" && logger.warn) {
    logger.warn.apply(logger, [prefix].concat(args));
    return;
  }
  if (level === "info" && logger.info) {
    logger.info.apply(logger, [prefix].concat(args));
    return;
  }
  if (_debugEnabled() && logger.debug) logger.debug.apply(logger, [prefix].concat(args));
}
let _metrics = { loadCount: 0, filesLoaded: 0, duplicatesSkipped: 0, lastLoadAt: null, errors: 0 };
const _loadedFiles = /* @__PURE__ */ new Set();
function loadCSS(baseUrl) {
  _metrics.loadCount++;
  _metrics.lastLoadAt = Date.now();
  const cssFiles = [new URL("../styles/header-base.css", baseUrl).href, new URL("../styles/header-base.tokens.css", baseUrl).href, new URL("../styles/header-base.layout.css", baseUrl).href, new URL("../styles/header-base.components.css", baseUrl).href, new URL("../styles/header-base.keyframes.css", baseUrl).href, new URL("../styles/header-base.responsive.css", baseUrl).href, new URL("../styles/header-components.css", baseUrl).href, new URL("../styles/header-design-system.css", baseUrl).href];
  let loaded = 0;
  let skipped = 0;
  cssFiles.forEach((cssPath) => {
    if (_loadedFiles.has(cssPath) || hasDocument && document.querySelector(`link[href="${cssPath}"]`)) {
      skipped++;
      _metrics.duplicatesSkipped++;
      return;
    }
    try {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = cssPath;
      document.head.appendChild(link);
      _loadedFiles.add(cssPath);
      loaded++;
      _metrics.filesLoaded++;
    } catch (error) {
      _metrics.errors++;
      _log("error", `Erro ao carregar CSS: ${cssPath}`, error.message);
    }
  });
  _log("info", `CSS carregado: ${loaded} novos, ${skipped} ignorados`);
  return { loaded, skipped, total: cssFiles.length };
}
function loadCSSFromMeta() {
  _metrics.loadCount++;
  _metrics.lastLoadAt = Date.now();
  const cssFiles = [new URL("../styles/header-base.css", import.meta.url).href, new URL("../styles/header-base.tokens.css", import.meta.url).href, new URL("../styles/header-base.layout.css", import.meta.url).href, new URL("../styles/header-base.components.css", import.meta.url).href, new URL("../styles/header-base.keyframes.css", import.meta.url).href, new URL("../styles/header-base.responsive.css", import.meta.url).href, new URL("../styles/header-components.css", import.meta.url).href, new URL("../styles/header-design-system.css", import.meta.url).href];
  let loaded = 0;
  let skipped = 0;
  cssFiles.forEach((cssPath) => {
    if (_loadedFiles.has(cssPath) || hasDocument && document.querySelector(`link[href="${cssPath}"]`)) {
      skipped++;
      _metrics.duplicatesSkipped++;
      return;
    }
    try {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = cssPath;
      document.head.appendChild(link);
      _loadedFiles.add(cssPath);
      loaded++;
      _metrics.filesLoaded++;
    } catch (error) {
      _metrics.errors++;
      _log("error", `Erro ao carregar CSS: ${cssPath}`, error.message);
    }
  });
  _log("info", `CSS (meta) carregado: ${loaded} novos, ${skipped} ignorados`);
  return { loaded, skipped, total: cssFiles.length };
}
function getLoadedFiles() {
  return Array.from(_loadedFiles);
}
function getMetrics() {
  return Object.assign({}, _metrics, { loadedFilesCount: _loadedFiles.size });
}
function resetMetrics() {
  _metrics.loadCount = 0;
  _metrics.filesLoaded = 0;
  _metrics.duplicatesSkipped = 0;
  _metrics.lastLoadAt = null;
  _metrics.errors = 0;
}
function healthCheck() {
  const checks = { hasLoadedFiles: _loadedFiles.size > 0 || _metrics.loadCount === 0, noExcessiveErrors: _metrics.errors < 5, documentHeadExists: hasDocument && !!document.head, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: Object.entries(checks).filter((e) => !e[1]).map((e) => e[0]), portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, loadedFiles: _loadedFiles.size, metrics: getMetrics(), portsInitialized: Ports.isInitialized(), healthCheck: healthCheck() };
}
function getVersion() {
  return VERSION;
}
var css_loader_default = { loadCSS, loadCSSFromMeta, getLoadedFiles, getMetrics, resetMetrics, healthCheck, info, getVersion, VERSION, MODULE_ID, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  css_loader_default as default,
  getLoadedFiles,
  getMetrics,
  getPorts,
  getVersion,
  healthCheck,
  info,
  injectPorts,
  loadCSS,
  loadCSSFromMeta,
  resetMetrics
};
