import { DEFAULT_CONFIG, OFFLINE_STATES } from "./constants.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.offline-mode-manager.state";
let _instance = null;
function setInstance(inst) {
  _instance = inst;
}
let _config = { ...DEFAULT_CONFIG };
function getConfig() {
  return _config;
}
function setConfig(cfg) {
  _config = cfg;
}
let _state = OFFLINE_STATES.ONLINE;
function getState() {
  return _state;
}
function setState(s) {
  _state = s;
}
let _isInitialized = false;
function isInitialized() {
  return _isInitialized;
}
function setIsInitialized(val) {
  _isInitialized = val;
}
let _cache = null;
function getCache() {
  return _cache;
}
function setCache(c) {
  _cache = c;
}
let _syncTimer = null;
function getSyncTimer() {
  return _syncTimer;
}
function setSyncTimer(t) {
  _syncTimer = t;
}
let _offlineQueue = [];
function getOfflineQueue() {
  return _offlineQueue;
}
function setOfflineQueue(q) {
  _offlineQueue = q;
}
function addToQueue(item) {
  _offlineQueue.push(item);
}
const _listeners = [];
let _cacheMetadata = {};
function getCacheMetadata() {
  return _cacheMetadata;
}
function setCacheMetadata(m) {
  _cacheMetadata = m;
}
function updateCacheMetadata(key, value) {
  _cacheMetadata[key] = value;
}
function deleteCacheMetadata(key) {
  delete _cacheMetadata[key];
}
const _metrics = {
  cacheHits: 0,
  cacheMisses: 0,
  networkRequests: 0,
  offlineServes: 0,
  syncAttempts: 0,
  syncSuccesses: 0,
  queuedRequests: 0,
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
  _cache,
  _cacheMetadata,
  _config,
  _instance,
  _isInitialized,
  _listeners,
  _metrics,
  _offlineQueue,
  _state,
  _syncTimer,
  addToQueue,
  deleteCacheMetadata,
  getCache,
  getCacheMetadata,
  getConfig,
  getMetrics,
  getOfflineQueue,
  getState,
  getSyncTimer,
  incrementMetric,
  isInitialized,
  setCache,
  setCacheMetadata,
  setConfig,
  setInstance,
  setIsInitialized,
  setOfflineQueue,
  setState,
  setSyncTimer,
  updateCacheMetadata
};
