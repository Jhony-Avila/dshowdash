import * as CacheManager from "../core/cache-manager.js";
const VERSION = "1.1.0-ES6";
const MODULE_ID = "header/registry/registry-cache";
const CACHE_KEYS = {
  COMPONENTS: "registry:components",
  PERMISSIONS: "registry:permissions",
  ORDER: "registry:order"
};
const CACHE_TTLS = {
  components: 3e5,
  permissions: 6e5,
  order: 3e5
};
let _initialized = false;
function init() {
  if (_initialized) return;
  CacheManager.init({ ttls: { registry: 3e5 } });
  _initialized = true;
}
function cacheComponents(components) {
  init();
  return CacheManager.set(CACHE_KEYS.COMPONENTS, components, { category: "registry", ttl: CACHE_TTLS.components });
}
function getCachedComponents() {
  init();
  return CacheManager.get(CACHE_KEYS.COMPONENTS);
}
function cachePermissions(permissions) {
  init();
  return CacheManager.set(CACHE_KEYS.PERMISSIONS, permissions, { category: "registry", ttl: CACHE_TTLS.permissions });
}
function getCachedPermissions() {
  init();
  return CacheManager.get(CACHE_KEYS.PERMISSIONS);
}
function cacheOrder(orderInfo) {
  init();
  return CacheManager.set(CACHE_KEYS.ORDER, orderInfo, { category: "registry", ttl: CACHE_TTLS.order });
}
function getCachedOrder() {
  init();
  return CacheManager.get(CACHE_KEYS.ORDER);
}
function invalidateAll() {
  init();
  CacheManager.clearCategory("registry");
}
function getStats() {
  init();
  return { components: CacheManager.has(CACHE_KEYS.COMPONENTS), permissions: CacheManager.has(CACHE_KEYS.PERMISSIONS), order: CacheManager.has(CACHE_KEYS.ORDER), cacheStats: CacheManager.getStats() };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, initialized: _initialized, cacheKeys: CACHE_KEYS, cacheTTLs: CACHE_TTLS, stats: getStats() };
}
var registry_cache_default = { VERSION, MODULE_ID, init, cacheComponents, getCachedComponents, cachePermissions, getCachedPermissions, invalidateAll, getStats, info };
export {
  CACHE_KEYS,
  CACHE_TTLS,
  MODULE_ID,
  VERSION,
  cacheComponents,
  cacheOrder,
  cachePermissions,
  registry_cache_default as default,
  getCachedComponents,
  getCachedOrder,
  getCachedPermissions,
  getStats,
  info,
  init,
  invalidateAll
};
