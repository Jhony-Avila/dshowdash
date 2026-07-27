// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/registry/registry-cache
// PURPOSE: Registry integration with CacheManager for performance
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   * as CacheManager from ../core/cache-manager.js
// PROVIDES:
//   init() — initialize cache subsystem
//   cacheComponents(c) — cache component registry
//   getCachedComponents() — retrieve cached components
//   cachePermissions(p) — cache permissions
//   getCachedPermissions() — retrieve cached permissions
//   cacheOrder(o) — cache order info
//   getCachedOrder() — retrieve cached order
//   invalidateAll() — clear all registry cache
//   getStats() — cache statistics
//   info() — module info
// ═══════════════════════════════════════════════════════════════
// Header Registry Cache Integration
// @version 1.1.0-ES6
// @changelog v1.1.0-ES6 - Task 10.1 B04: var → const/let
// Integra o Registry com o CacheManager para melhor performance
'use strict';

import * as CacheManager from '../core/cache-manager.js';

export const VERSION = '1.1.0-ES6';
export const MODULE_ID = 'header/registry/registry-cache';

const CACHE_KEYS = {
  COMPONENTS: 'registry:components',
  PERMISSIONS: 'registry:permissions',
  ORDER: 'registry:order'
};

const CACHE_TTLS = {
  components: 300000,
  permissions: 600000,
  order: 300000
};

let _initialized = false;

function init() {
  if (_initialized) return;
  CacheManager.init({ ttls: { registry: 300000 } });
  _initialized = true;
}

function cacheComponents(components: unknown) {
  init();
  return CacheManager.set(CACHE_KEYS.COMPONENTS, components, { category: 'registry', ttl: CACHE_TTLS.components });
}

function getCachedComponents() {
  init();
  return CacheManager.get(CACHE_KEYS.COMPONENTS);
}

function cachePermissions(permissions: unknown) {
  init();
  return CacheManager.set(CACHE_KEYS.PERMISSIONS, permissions, { category: 'registry', ttl: CACHE_TTLS.permissions });
}

function getCachedPermissions() {
  init();
  return CacheManager.get(CACHE_KEYS.PERMISSIONS);
}

function cacheOrder(orderInfo: unknown) {
  init();
  return CacheManager.set(CACHE_KEYS.ORDER, orderInfo, { category: 'registry', ttl: CACHE_TTLS.order });
}

function getCachedOrder() {
  init();
  return CacheManager.get(CACHE_KEYS.ORDER);
}

function invalidateAll() {
  init();
  CacheManager.clearCategory('registry');
}

function getStats() {
  init();
  return { components: CacheManager.has(CACHE_KEYS.COMPONENTS), permissions: CacheManager.has(CACHE_KEYS.PERMISSIONS), order: CacheManager.has(CACHE_KEYS.ORDER), cacheStats: CacheManager.getStats() };
}

function info() {
  return { version: VERSION, moduleId: MODULE_ID, initialized: _initialized, cacheKeys: CACHE_KEYS, cacheTTLs: CACHE_TTLS, stats: getStats() };
}

export { init, cacheComponents, getCachedComponents, cachePermissions, getCachedPermissions, cacheOrder, getCachedOrder, invalidateAll, getStats, info, CACHE_KEYS, CACHE_TTLS };
export default { VERSION, MODULE_ID, init, cacheComponents, getCachedComponents, cachePermissions, getCachedPermissions, invalidateAll, getStats, info };
