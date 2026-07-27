import { DEFAULT_CONFIG } from "./constants.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.print-manager.state";
let _instance = null;
function setInstance(inst) {
  _instance = inst;
}
function getInstance() {
  return _instance;
}
let _config = { ...DEFAULT_CONFIG };
function getConfig() {
  return _config;
}
function setConfig(cfg) {
  _config = cfg;
}
function resetConfig() {
  _config = { ...DEFAULT_CONFIG };
}
let _isPrinting = false;
function isPrinting() {
  return _isPrinting;
}
function setIsPrinting(val) {
  _isPrinting = val;
}
let _printStylesheet = null;
function getPrintStylesheet() {
  return _printStylesheet;
}
function setPrintStylesheet(el) {
  _printStylesheet = el;
}
const _listeners = [];
const _metrics = {
  printAttempts: 0,
  printSuccesses: 0,
  previews: 0,
  errors: 0
};
function incrementMetric(key) {
  if (_metrics.hasOwnProperty(key)) _metrics[key]++;
}
function getMetrics() {
  return { ..._metrics };
}
export {
  MODULE_ID,
  VERSION,
  _config,
  _instance,
  _isPrinting,
  _listeners,
  _metrics,
  _printStylesheet,
  getConfig,
  getInstance,
  getMetrics,
  getPrintStylesheet,
  incrementMetric,
  isPrinting,
  resetConfig,
  setConfig,
  setInstance,
  setIsPrinting,
  setPrintStylesheet
};
