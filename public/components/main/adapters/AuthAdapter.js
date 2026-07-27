import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "5.0.0-ENTERPRISE-3SOURCE";
const MODULE_ID = "auth-adapter";
const AUTH_CACHE_TTL_MS = 1e3;
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
function createAuthAdapter(deps = {}) {
  if (!deps) deps = {};
  _initPorts();
  const authService = deps.authService;
  const eventBus = deps.eventBus;
  let _authCache = { value: null, timestamp: 0 };
  let _userCache = { value: null, timestamp: 0 };
  const _metrics = { authChecks: 0, authCacheHits: 0, authCacheMisses: 0, userFetches: 0, roleChecks: 0, capabilityChecks: 0, levelChecks: 0, authChanges: 0, errors: 0 };
  function _isCacheValid(cache) {
    return cache.timestamp > 0 && Date.now() - cache.timestamp < AUTH_CACHE_TTL_MS;
  }
  function _invalidateCache() {
    _authCache = { value: null, timestamp: 0 };
    _userCache = { value: null, timestamp: 0 };
  }
  function _checkAuthSources() {
    try {
      const sessionManager = _getPort("sessionManager");
      if (sessionManager && sessionManager.isAuthenticated && sessionManager.isAuthenticated()) return true;
      const globalState = _getPort("globalState");
      if (globalState && globalState.getState) {
        const state = globalState.getState();
        if (state && state.auth && state.auth.isAuthenticated) return true;
      }
      if (typeof document !== "undefined" && document.body && document.body.dataset) {
        if (document.body.dataset.state === "authenticated") return true;
        if (document.body.dataset.authState === "authenticated") return true;
      }
      return false;
    } catch (error) {
      _metrics.errors++;
      if (typeof document !== "undefined" && document.body && document.body.dataset) {
        return document.body.dataset.state === "authenticated";
      }
      return false;
    }
  }
  function _fetchUser() {
    try {
      const sessionManager = _getPort("sessionManager");
      if (sessionManager) {
        if (sessionManager.getUser) {
          const u1 = sessionManager.getUser();
          if (u1) return u1;
        }
        if (sessionManager.getCurrentUser) {
          const u2 = sessionManager.getCurrentUser();
          if (u2) return u2;
        }
      }
      const globalState = _getPort("globalState");
      if (globalState && globalState.getState) {
        const state = globalState.getState();
        if (state && state.auth && state.auth.user) return state.auth.user;
      }
      return null;
    } catch (error) {
      _metrics.errors++;
      return null;
    }
  }
  return {
    isAuthenticated() {
      _metrics.authChecks++;
      if (_isCacheValid(_authCache)) {
        _metrics.authCacheHits++;
        return _authCache.value;
      }
      _metrics.authCacheMisses++;
      const result = _checkAuthSources();
      _authCache = { value: result, timestamp: Date.now() };
      return result;
    },
    getUser() {
      _metrics.userFetches++;
      if (_isCacheValid(_userCache) && _userCache.value) return _userCache.value;
      const user = _fetchUser();
      _userCache = { value: user, timestamp: Date.now() };
      return user;
    },
    hasRole(role) {
      _metrics.roleChecks++;
      try {
        const user = this.getUser();
        if (!user) return false;
        if (Array.isArray(user.roles) && user.roles.indexOf(role) !== -1) return true;
        if (user.role === role) return true;
        if (user.userRole === role) return true;
        const sessionManager = _getPort("sessionManager");
        if (sessionManager && sessionManager.hasRole && sessionManager.hasRole(role)) return true;
        return false;
      } catch (error) {
        _metrics.errors++;
        return false;
      }
    },
    hasCapability(capability) {
      _metrics.capabilityChecks++;
      try {
        const user = this.getUser();
        if (!user) return false;
        if (Array.isArray(user.capabilities) && user.capabilities.indexOf(capability) !== -1) return true;
        if (Array.isArray(user.permissions) && user.permissions.indexOf(capability) !== -1) return true;
        const sessionManager = _getPort("sessionManager");
        if (sessionManager) {
          if (sessionManager.hasCapability && sessionManager.hasCapability(capability)) return true;
          if (sessionManager.hasPermission && sessionManager.hasPermission(capability)) return true;
        }
        return false;
      } catch (error) {
        _metrics.errors++;
        return false;
      }
    },
    getLevel() {
      _metrics.levelChecks++;
      try {
        const user = this.getUser();
        if (!user) return 0;
        if (typeof user.level === "number") return user.level;
        if (typeof user.userLevel === "number") return user.userLevel;
        if (typeof user.accessLevel === "number") return user.accessLevel;
        const sessionManager = _getPort("sessionManager");
        if (sessionManager) {
          const smLevel = sessionManager.getLevel ? sessionManager.getLevel() : sessionManager.getUserLevel ? sessionManager.getUserLevel() : void 0;
          if (typeof smLevel === "number") return smLevel;
        }
        if (this.hasRole("admin") || this.hasRole("superadmin")) return 100;
        if (this.hasRole("manager")) return 50;
        if (this.hasRole("user")) return 10;
        return 0;
      } catch (error) {
        _metrics.errors++;
        return 0;
      }
    },
    evaluatePolicy(resource, action) {
      try {
        const sessionManager = _getPort("sessionManager");
        if (sessionManager && sessionManager.evaluatePolicy) return sessionManager.evaluatePolicy(resource, action);
        return this.isAuthenticated();
      } catch (error) {
        _metrics.errors++;
        return false;
      }
    },
    onAuthChange(callback) {
      try {
        const cleanups = [];
        const bus = eventBus || _getPort("eventBus");
        const wrappedCallback = (data) => {
          _metrics.authChanges++;
          _invalidateCache();
          callback(data);
        };
        if (bus && bus.on) {
          const events = ["auth:changed", "auth:login:success", "auth:logout:success", "session:changed", "session:started", "session:ended", "user:updated"];
          for (let i = 0; i < events.length; i++) {
            ((event) => {
              bus.on(event, wrappedCallback);
              cleanups.push(() => {
                if (bus.off) bus.off(event, wrappedCallback);
              });
            })(events[i]);
          }
        }
        return () => {
          for (let j = 0; j < cleanups.length; j++) cleanups[j]();
        };
      } catch (error) {
        _metrics.errors++;
        return () => {
        };
      }
    },
    onRoleChange(callback) {
      try {
        const bus = eventBus || _getPort("eventBus");
        if (!bus || !bus.on) return () => {
        };
        const events = ["user:role:changed", "auth:role:updated"];
        const cleanups = [];
        for (let i = 0; i < events.length; i++) {
          ((event) => {
            bus.on(event, callback);
            cleanups.push(() => {
              if (bus.off) bus.off(event, callback);
            });
          })(events[i]);
        }
        return () => {
          for (let j = 0; j < cleanups.length; j++) cleanups[j]();
        };
      } catch (error) {
        _metrics.errors++;
        return () => {
        };
      }
    },
    invalidateCache() {
      _invalidateCache();
    },
    getMetrics() {
      const total = _metrics.authCacheHits + _metrics.authCacheMisses;
      const hitRate = total > 0 ? Math.round(_metrics.authCacheHits / total * 100) : 0;
      return Object.assign({}, _metrics, { cacheHitRate: `${hitRate}%` });
    },
    healthCheck() {
      const self = this;
      const isAuth = self.isAuthenticated();
      const hasUser = !!self.getUser();
      const errorRate = _metrics.authChecks > 0 ? _metrics.errors / _metrics.authChecks * 100 : 0;
      let status = "HEALTHY";
      const sessionManager = _getPort("sessionManager");
      const globalState = _getPort("globalState");
      if (errorRate > 20) status = "DEGRADED";
      if (!sessionManager && !globalState) status = "DEGRADED";
      return { status, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), checks: { hasSessionManager: !!sessionManager, hasGlobalState: !!globalState, isAuthenticated: isAuth, hasUser, errorRate: `${Math.round(errorRate)}%` }, metrics: self.getMetrics() };
    },
    info() {
      const self = this;
      return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), isAuthenticated: self.isAuthenticated(), user: self.getUser(), level: self.getLevel(), metrics: self.getMetrics() };
    }
  };
}
var AuthAdapter_default = { createAuthAdapter, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  createAuthAdapter,
  AuthAdapter_default as default,
  getPorts,
  injectPorts
};
