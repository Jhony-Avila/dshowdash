import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "5.8.0-P1-HEALTHCHECK";
const MODULE_ID = "sidebar.loader";
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
const log = {
  info(msg, ctx) {
    const logger = _getPort("logger");
    if (logger && logger.info) logger.info(msg, { component: MODULE_ID, ...ctx });
  },
  warn(msg, ctx) {
    const logger = _getPort("logger");
    if (logger && logger.warn) logger.warn(msg, { component: MODULE_ID, ...ctx });
  },
  error(msg, ctx) {
    const logger = _getPort("logger");
    if (logger && logger.error) logger.error(msg, { component: MODULE_ID, ...ctx });
  }
};
const CSS_FILES = ["/components/sidebar/styles/sidebar.bundle.css?v=20260720"];
let _metrics = {
  cssLoaded: false,
  loadAttempts: 0,
  loadSuccess: 0,
  loadErrors: 0,
  lastLoad: null,
  loadTime: null
};
let _instance = null;
let _cssLinks = [];
function _createLinkElement(href) {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.setAttribute("data-component", "sidebar");
  return link;
}
function _isCSSLoaded(href) {
  return document.querySelector(`link[href="${href}"]`) !== null;
}
function loadCSS() {
  CSS_FILES.forEach((href) => {
    if (_isCSSLoaded(href)) {
      _metrics.cssLoaded = true;
      return;
    }
    const link = _createLinkElement(href);
    document.head.appendChild(link);
    _cssLinks.push(link);
    _metrics.cssLoaded = true;
  });
}
function load(options = {}) {
  const startTime = performance.now();
  _metrics.loadAttempts++;
  return Promise.resolve().then(() => {
    loadCSS();
    return import("./index.js");
  }).then((module) => {
    const createSidebar = module.createSidebar;
    const sidebar = createSidebar();
    return sidebar.init(options).then(() => sidebar);
  }).then((sidebar) => {
    _instance = sidebar;
    _metrics.loadSuccess++;
    _metrics.lastLoad = Date.now();
    _metrics.loadTime = Math.round(performance.now() - startTime);
    log.info("Loaded successfully", { loadTime: _metrics.loadTime });
    return { success: true, instance: sidebar, version: VERSION, loadTime: _metrics.loadTime };
  }).catch((error) => {
    _metrics.loadErrors++;
    log.error("Failed to load", { error: error.message });
    return { success: false, error: error.message };
  });
}
function getInstance() {
  return _instance;
}
function getMetrics() {
  return { ..._metrics };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    hasInstance: !!_instance,
    metrics: getMetrics(),
    portsInitialized: Ports.isInitialized()
  };
}
function healthCheck() {
  const sidebar = _instance || (window.Sidebar?.getSidebar?.() ?? null);
  const sidebarHealth = sidebar?.healthCheck?.() ?? null;
  const cssLoaded = _metrics.cssLoaded;
  const hasInstance = !!_instance;
  const noErrors = _metrics.loadErrors === 0;
  const sidebarHealthy = sidebarHealth?.status === "HEALTHY";
  const fastLoad = _metrics.loadTime ? _metrics.loadTime < 1e3 : true;
  const hasLogger = !!_getPort("logger");
  const portsInitialized = Ports.isInitialized();
  const checks = {
    cssLoaded,
    hasInstance,
    noErrors,
    sidebarHealthy,
    fastLoad,
    hasLogger,
    portsInitialized
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  let status = "HEALTHY";
  if (!hasInstance) {
    status = "NOT_LOADED";
  } else if (_metrics.loadErrors > 0) {
    status = "DEGRADED";
  } else if (sidebarHealth && sidebarHealth.status !== "HEALTHY") {
    status = "DEGRADED";
  } else if (passed < total && passed >= Math.floor(total * 0.6)) {
    status = "DEGRADED";
  } else if (passed < Math.floor(total * 0.6)) {
    status = "UNHEALTHY";
  }
  const issues = [];
  if (!cssLoaded) issues.push({ code: "CSS_NOT_LOADED", severity: "error", message: "CSS files not loaded" });
  if (!hasInstance) issues.push({ code: "NO_INSTANCE", severity: "error", message: "Sidebar instance not created" });
  if (_metrics.loadErrors > 0) issues.push({ code: "LOAD_ERRORS", severity: "error", message: `${_metrics.loadErrors} load error(s)` });
  if (!sidebarHealthy && sidebarHealth) issues.push({ code: "SIDEBAR_UNHEALTHY", severity: "warn", message: `Sidebar status: ${sidebarHealth.status}` });
  if (!fastLoad) issues.push({ code: "SLOW_LOAD", severity: "warn", message: `Load time: ${_metrics.loadTime}ms` });
  return {
    status,
    score: { passed, total, percentage: Math.round(passed / total * 100) },
    checks,
    issues,
    moduleId: MODULE_ID,
    version: VERSION,
    ports: { initialized: portsInitialized, missing: hasLogger ? [] : ["logger"] },
    metrics: _metrics,
    sidebarHealth,
    timestamp: Date.now()
  };
}
function unload() {
  try {
    if (_instance?.destroy) _instance.destroy();
    if (window.Sidebar?.destroySidebar) window.Sidebar.destroySidebar();
    _cssLinks.forEach((link) => {
      link.remove();
    });
    _cssLinks = [];
    document.querySelectorAll('link[data-component="sidebar"]').forEach((el) => {
      el.remove();
    });
    _instance = null;
    _metrics.cssLoaded = false;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
function reset() {
  _metrics = {
    cssLoaded: false,
    loadAttempts: 0,
    loadSuccess: 0,
    loadErrors: 0,
    lastLoad: null,
    loadTime: null
  };
  _instance = null;
  _cssLinks = [];
}
var loader_default = {
  VERSION,
  MODULE_ID,
  load,
  getInstance,
  getMetrics,
  info,
  healthCheck,
  unload,
  reset,
  injectPorts,
  getPorts
};
export {
  MODULE_ID,
  VERSION,
  loader_default as default,
  getInstance,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  load,
  reset,
  unload
};
