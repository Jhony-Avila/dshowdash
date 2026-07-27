import { DEFAULT_CONFIG } from "./constants.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.export-content-manager.state";
let _instance = null;
let _config = { ...DEFAULT_CONFIG };
let _isExporting = false;
let _listeners = [];
const metrics = {
  exports: 0,
  pngExports: 0,
  jpegExports: 0,
  pdfExports: 0,
  svgExports: 0,
  errors: 0,
  totalBytes: 0,
  lastExportAt: null
};
function getInstance() {
  return _instance;
}
function setInstance(inst) {
  _instance = inst;
}
function hasInstance() {
  return _instance !== null;
}
function getConfig() {
  return _config;
}
function setConfig(cfg) {
  _config = cfg;
}
function isExporting() {
  return _isExporting;
}
function setExporting(val) {
  _isExporting = val;
}
function getListeners() {
  return _listeners;
}
function incrementMetric(key, amount = 1) {
  if (metrics.hasOwnProperty(key)) metrics[key] += amount;
}
function getMetrics() {
  return { ...metrics };
}
export {
  MODULE_ID,
  VERSION,
  _listeners,
  getConfig,
  getInstance,
  getListeners,
  getMetrics,
  hasInstance,
  incrementMetric,
  isExporting,
  metrics,
  setConfig,
  setExporting,
  setInstance
};
