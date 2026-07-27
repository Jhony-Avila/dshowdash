const VERSION = "1.0.0";
const MODULE_ID = "overlay-layer-lazy-loader";
const LOAD_STATUS = {
  IDLE: "IDLE",
  LOADING: "LOADING",
  LOADED: "LOADED",
  ERROR: "ERROR"
};
const DEFAULT_CONFIG = {
  enabled: true,
  prefetchEnabled: true,
  prefetchDelay: 1e3,
  cacheEnabled: true,
  cacheTTL: 3e5,
  maxCacheSize: 50,
  timeout: 1e4,
  retryAttempts: 2,
  retryDelay: 500
};
export {
  DEFAULT_CONFIG,
  LOAD_STATUS,
  MODULE_ID,
  VERSION
};
