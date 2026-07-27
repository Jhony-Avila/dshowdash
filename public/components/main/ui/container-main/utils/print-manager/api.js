import { VERSION, MODULE_ID, PRINT_ORIENTATIONS, PRINT_SIZES, PAGE_BREAK_MODES, DEFAULT_CONFIG } from "./constants.js";
import { _instance, setInstance, getConfig, setConfig, isPrinting, _listeners, getMetrics } from "./state.js";
import { _log } from "./helpers/logger.js";
import { print, printElement } from "./operations/print.js";
import { printPreview } from "./operations/preview.js";
import { addPageBreak, removePageBreaks, markAvoidBreak, markKeepTogether } from "./operations/page-breaks.js";
function configure(options) {
  const currentConfig = getConfig();
  const newConfig = { ...DEFAULT_CONFIG, ...currentConfig, ...options };
  if (options.margins) {
    newConfig.margins = { ...DEFAULT_CONFIG.margins, ...currentConfig.margins, ...options.margins };
  }
  setConfig(newConfig);
}
function createPrintManager(options = {}) {
  const newConfig = { ...DEFAULT_CONFIG, ...options };
  if (options.margins) {
    newConfig.margins = { ...DEFAULT_CONFIG.margins, ...options.margins };
  }
  setConfig(newConfig);
  _log("info", "Print Manager created");
  return {
    print,
    printElement,
    printPreview,
    configure,
    getConfig: () => ({ ...getConfig() }),
    isPrinting,
    addPageBreak,
    removePageBreaks,
    markAvoidBreak,
    markKeepTogether,
    subscribe,
    healthCheck,
    info
  };
}
function getPrintManager(options = {}) {
  if (!_instance) {
    setInstance(createPrintManager(options));
  }
  return _instance;
}
function subscribe(callback) {
  if (typeof callback !== "function") return () => {
  };
  _listeners.push(callback);
  return () => {
    const idx = _listeners.indexOf(callback);
    if (idx >= 0) _listeners.splice(idx, 1);
  };
}
function healthCheck() {
  const metrics = getMetrics();
  const checks = {
    printSupported: typeof window !== "undefined" && typeof window.print === "function",
    notPrinting: !isPrinting(),
    noErrors: metrics.errors === 0
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY",
    score: `${passed}/${total}`,
    checks,
    metrics,
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
    orientations: Object.values(PRINT_ORIENTATIONS),
    pageSizes: Object.values(PRINT_SIZES),
    pageBreakModes: Object.values(PAGE_BREAK_MODES),
    config: {
      orientation: config.orientation,
      pageSize: config.pageSize,
      margins: config.margins,
      showHeader: config.showHeader,
      showFooter: config.showFooter,
      showPageNumbers: config.showPageNumbers
    },
    isPrinting: isPrinting(),
    metrics: getMetrics()
  };
}
export {
  addPageBreak,
  configure,
  createPrintManager,
  getPrintManager,
  healthCheck,
  info,
  markAvoidBreak,
  markKeepTogether,
  print,
  printElement,
  printPreview,
  removePageBreaks,
  subscribe
};
