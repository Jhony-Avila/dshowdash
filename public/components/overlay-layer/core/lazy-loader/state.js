import { DEFAULT_CONFIG } from "./constants.js";
const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.core.lazy-loader.state";
let config = { ...DEFAULT_CONFIG };
let cache = /* @__PURE__ */ new Map();
let loaders = /* @__PURE__ */ new Map();
let prefetchQueue = [];
const metrics = {
  totalLoads: 0,
  cacheHits: 0,
  cacheMisses: 0,
  errors: 0,
  prefetched: 0
};
function getConfig() {
  return config;
}
function setConfig(c) {
  config = c;
}
function getCache() {
  return cache;
}
function getLoaders() {
  return loaders;
}
function getPrefetchQueue() {
  return prefetchQueue;
}
function setPrefetchQueue(q) {
  prefetchQueue = q;
}
function incrementMetric(key) {
  if (metrics.hasOwnProperty(key)) metrics[key]++;
}
function resetMetrics() {
  metrics.totalLoads = 0;
  metrics.cacheHits = 0;
  metrics.cacheMisses = 0;
  metrics.errors = 0;
  metrics.prefetched = 0;
}
export {
  MODULE_ID,
  VERSION,
  cache,
  config,
  getCache,
  getConfig,
  getLoaders,
  getPrefetchQueue,
  incrementMetric,
  loaders,
  metrics,
  prefetchQueue,
  resetMetrics,
  setConfig,
  setPrefetchQueue
};
