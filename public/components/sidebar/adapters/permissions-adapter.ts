// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.9.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-permissions-adapter
// PURPOSE: Sidebar V2 - Permissions Adapter
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   createPermissionsAdapter() — exported function
//   info() — exported function
//   getMetrics() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (window as any).AuthAdapter
//   window.CoreAuthAdapter
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '5.9.0-ES6';
export const MODULE_ID = 'sidebar-permissions-adapter';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: DynObj) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

function _getAuth() {
  const auth = _getPort('auth');
  if (auth) return auth;
  if (typeof window !== 'undefined') return (window as any).AuthAdapter || window.CoreAuthAdapter || null;
  return null;
}

export function createPermissionsAdapter() {
  let _metrics = {
    levelChecks: 0,
    permissionChecks: 0,
    filterOperations: 0,
    cacheHits: 0,
    errors: 0,
    lastCheck: null as DynObj
  };

  let _cache = { level: null as HTMLElement | null, permissions: null as DynObj, timestamp: 0, ttl: 5000 };

  const isCacheValid = () => _cache.timestamp && (Date.now() - _cache.timestamp) < _cache.ttl;

  const invalidateCache = () => {
    _cache = { level: null, permissions: null, timestamp: 0, ttl: 5000 };
  };

  return {
    getUserLevel() {
      _initPorts();
      try {
        if (isCacheValid() && _cache.level !== null) {
          _metrics.cacheHits++;
          return _cache.level;
        }
        const auth = _getAuth();
        const level = auth?.getLevel?.() ?? 0;
        _cache.level = level;
        _cache.timestamp = Date.now();
        _metrics.levelChecks++;
        _metrics.lastCheck = Date.now();
        return level;
      } catch (error) {
        _metrics.errors++;
        return 0;
      }
    },

    getUserPermissions() {
      _initPorts();
      try {
        if (isCacheValid() && _cache.permissions !== null) {
          _metrics.cacheHits++;
          return _cache.permissions;
        }
        const auth = _getAuth();
        const roles = auth?.getRoles?.() ?? [];
        const caps = auth?.getCapabilities?.() ?? [];
        const permissions = [...roles, ...caps];
        _cache.permissions = permissions;
        _cache.timestamp = Date.now();
        _metrics.permissionChecks++;
        return permissions;
      } catch (error) {
        _metrics.errors++;
        return [];
      }
    },

    canAccess(permission: DynObj) {
      _initPorts();
      try {
        const auth = _getAuth();
        if (!auth?.isReady?.()) return false;
        if (auth.can) return auth.can(permission) === true;
        return this.getUserPermissions().includes(permission);
      } catch (error) {
        _metrics.errors++;
        return false;
      }
    },

    filterItems(items: DynObj[]) {
      try {
        if (!Array.isArray(items)) return [];
        const userPermissions = this.getUserPermissions();
        const filtered = items.filter(item => {
          if (item.permissions && item.permissions.length > 0) {
            const hasPermission = item.permissions.some((p: DynObj) =>
              userPermissions.includes(p) || this.canAccess(p)
            );
            if (!hasPermission) return false;
          }
          return true;
        });
        _metrics.filterOperations++;
        return filtered;
      } catch (error) {
        _metrics.errors++;
        return items;
      }
    },

    isAuthenticated() {
      _initPorts();
      try {
        const auth = _getAuth();
        return auth?.isAuthenticated?.() ?? false;
      } catch (error) {
        _metrics.errors++;
        return false;
      }
    },

    getUser() {
      _initPorts();
      try {
        const auth = _getAuth();
        return auth?.getUser?.() ?? null;
      } catch (error) {
        _metrics.errors++;
        return null;
      }
    },

    invalidateCache,

    getMetrics() {
      return { ..._metrics };
    },

    reset() {
      invalidateCache();
      _metrics = {
        levelChecks: 0,
        permissionChecks: 0,
        filterOperations: 0,
        cacheHits: 0,
        errors: 0,
        lastCheck: null
      };
    },

    info() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        portsInitialized: Ports.isInitialized(),
        isAuthenticated: this.isAuthenticated(),
        cacheValid: isCacheValid(),
        metrics: this.getMetrics()
      };
    },

    healthCheck() {
      _initPorts();
      const auth = _getAuth();
      const authReady = auth?.isReady?.() ?? false;
      const authHealth = auth?.healthCheck?.() ?? { status: 'UNKNOWN' };
      const user = this.getUser();
      const isAuthenticated = this.isAuthenticated();

      const checks = {
        authReady,
        hasUser: !!user,
        isAuthenticated,
        authHealthy: authHealth.status === 'HEALTHY',
        noErrors: _metrics.errors === 0,
        portsInitialized: Ports.isInitialized()
      };

      const passed = Object.values(checks).filter(Boolean).length;
      const total = Object.keys(checks).length;

      let status = 'HEALTHY';
      if (!authReady) status = 'UNHEALTHY';
      else if (!isAuthenticated || _metrics.errors > 0) status = 'DEGRADED';

      return {
        status,
        score: passed,
        maxScore: total,
        scoreDisplay: `${passed}/${total}`,
        checks,
        isAuthenticated,
        authSource: 'ports:auth',
        authHealth: authHealth.status,
        metrics: _metrics,
        cacheValid: isCacheValid(),
        version: VERSION,
        moduleId: MODULE_ID,
        portsInitialized: Ports.isInitialized(),
        timestamp: Date.now()
      };
    }
  };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}

export function getMetrics() {
  return {};
}

export function healthCheck() {
  return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() };
}

export default { VERSION, MODULE_ID, createPermissionsAdapter, info, getMetrics, healthCheck, injectPorts, getPorts };
