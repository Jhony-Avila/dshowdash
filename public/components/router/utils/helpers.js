import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "4.1.0-P17WI";
const MODULE_ID = "router.utils.helpers";
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
function getVersion() {
  return VERSION;
}
const RouterHelpers = {
  sanitizePath(path) {
    if (!path || typeof path !== "string") return "/";
    try {
      let clean = path.trim().toLowerCase();
      clean = clean.replace(/\/+/g, "/");
      if (!clean.startsWith("/")) clean = `/${clean}`;
      if (clean.length > 1 && clean.endsWith("/")) {
        clean = clean.slice(0, -1);
      }
      clean = clean.replace(/[^a-z0-9\-_\/]/g, "");
      return clean || "/";
    } catch (error) {
      return "/";
    }
  },
  parseQueryString(queryString) {
    if (!queryString || typeof queryString !== "string") return {};
    try {
      const params = {};
      const search = queryString.startsWith("?") ? queryString.slice(1) : queryString;
      if (!search) return params;
      const pairs = search.split("&");
      for (const pair of pairs) {
        const [key, value] = pair.split("=");
        if (key) {
          params[decodeURIComponent(key)] = value ? decodeURIComponent(value) : "";
        }
      }
      return params;
    } catch (error) {
      return {};
    }
  },
  // @ts-expect-error TS migration - TS2345
  buildQueryString(params) {
    if (!params || typeof params !== "object") return "";
    try {
      const pairs = [];
      for (const [key, value] of Object.entries(params)) {
        if (value !== void 0 && value !== null) {
          pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
        }
      }
      return pairs.length > 0 ? `?${pairs.join("&")}` : "";
    } catch (error) {
      return "";
    }
  },
  parseFragment(hash) {
    if (!hash || typeof hash !== "string") return "";
    return hash.startsWith("#") ? hash.slice(1) : hash;
  },
  extractPathSegments(path) {
    try {
      const clean = this.sanitizePath(path);
      return clean.split("/").filter((segment) => segment.length > 0);
    } catch (error) {
      return [];
    }
  },
  matchDynamicRoute(pattern, path) {
    try {
      const patternSegments = this.extractPathSegments(pattern);
      const pathSegments = this.extractPathSegments(path);
      if (patternSegments.length !== pathSegments.length) return null;
      const params = {};
      for (let i = 0; i < patternSegments.length; i++) {
        const patternPart = patternSegments[i];
        const pathPart = pathSegments[i];
        if (patternPart.startsWith(":")) {
          const paramName = patternPart.slice(1);
          params[paramName] = pathPart;
        } else if (patternPart !== pathPart) {
          return null;
        }
      }
      return params;
    } catch (error) {
      return null;
    }
  },
  isValidRoutePath(path) {
    if (!path || typeof path !== "string") return false;
    try {
      const sanitized = this.sanitizePath(path);
      return sanitized.length > 0 && sanitized.length <= 200;
    } catch (error) {
      return false;
    }
  },
  generateRouteId() {
    try {
      return `route-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    } catch (error) {
      return `route-${Date.now()}`;
    }
  },
  comparePaths(path1, path2) {
    try {
      const clean1 = this.sanitizePath(path1);
      const clean2 = this.sanitizePath(path2);
      return clean1 === clean2;
    } catch (error) {
      return false;
    }
  },
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },
  getVersion() {
    return VERSION;
  }
};
const ValidationHelpers = {
  isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
  },
  isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  },
  isFunction(value) {
    return typeof value === "function";
  },
  assertRequired(value, name) {
    if (value === void 0 || value === null) {
      throw new Error(`[${MODULE_ID}] ${name} is required`);
    }
  },
  getVersion() {
    return VERSION;
  }
};
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: (/* @__PURE__ */ new Date()).toISOString() };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() };
}
var helpers_default = RouterHelpers;
export {
  MODULE_ID,
  RouterHelpers,
  VERSION,
  ValidationHelpers,
  helpers_default as default,
  getPorts,
  getVersion,
  healthCheck,
  info,
  injectPorts
};
