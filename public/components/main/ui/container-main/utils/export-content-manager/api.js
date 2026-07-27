import { VERSION, MODULE_ID, DEFAULT_CONFIG } from "./constants.js";
import { getInstance, setInstance, hasInstance, getConfig, setConfig, isExporting, getListeners, getMetrics } from "./state.js";
import { createExportContentManager } from "./manager.js";
function getExportContentManager(options = {}) {
  if (!hasInstance()) {
    setInstance(createExportContentManager(options));
  }
  return getInstance();
}
function configure(options) {
  const currentConfig = getConfig();
  setConfig({ ...DEFAULT_CONFIG, ...currentConfig, ...options });
}
function subscribe(callback) {
  if (typeof callback !== "function") return () => {
  };
  const listeners = getListeners();
  listeners.push(callback);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}
function healthCheck() {
  const hasHtml2Canvas = typeof html2canvas !== "undefined";
  const hasJsPDF = typeof jspdf !== "undefined" || typeof jsPDF !== "undefined";
  const checks = {
    canExportImages: true,
    hasHtml2Canvas,
    hasJsPDF,
    notExporting: !isExporting(),
    noErrors: getMetrics().errors === 0
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed >= 3 ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY",
    score: `${passed}/${total}`,
    checks,
    metrics: getMetrics(),
    capabilities: {
      png: true,
      jpeg: true,
      svg: true,
      pdf: hasJsPDF
    },
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  const config = getConfig();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    formats: ["png", "jpeg", "pdf", "svg"],
    qualityLevels: ["LOW", "MEDIUM", "HIGH", "MAXIMUM"],
    config: {
      format: config.format,
      quality: config.quality,
      scale: config.scale,
      includeDateInFilename: config.includeDateInFilename
    },
    isExporting: isExporting(),
    metrics: getMetrics()
  };
}
export {
  configure,
  getExportContentManager,
  healthCheck,
  info,
  subscribe
};
