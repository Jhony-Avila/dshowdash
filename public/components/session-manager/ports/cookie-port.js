const VERSION = "5.0.0-BULLETPROOF";
const MODULE_ID = "session-cookie-port";
const _metrics = { gets: 0, sets: 0, removes: 0, errors: 0 };
const _memoryCookies = /* @__PURE__ */ new Map();
function _isCookieAvailable() {
  if (typeof document === "undefined") return false;
  try {
    document.cookie = "__cookie_test__=1";
    const result = document.cookie.includes("__cookie_test__");
    document.cookie = "__cookie_test__=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
    return result;
  } catch {
    return false;
  }
}
function _parseCookies(cookieString) {
  const cookies = {};
  if (!cookieString) return cookies;
  cookieString.split(";").forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    if (name) cookies[name] = rest.join("=");
  });
  return cookies;
}
const _documentAdapter = {
  get(name) {
    _metrics.gets++;
    try {
      const cookies = _parseCookies(document.cookie);
      return cookies[name] ?? null;
    } catch (e) {
      _metrics.errors++;
      return null;
    }
  },
  set(name, value, options = {}) {
    _metrics.sets++;
    try {
      const { path = "/", domain, expires, maxAge, secure, sameSite = "Lax" } = options;
      let cookie = `${name}=${encodeURIComponent(value)}`;
      cookie += `; path=${path}`;
      if (domain) cookie += `; domain=${domain}`;
      if (expires) cookie += `; expires=${expires instanceof Date ? expires.toUTCString() : expires}`;
      if (maxAge) cookie += `; max-age=${maxAge}`;
      if (secure) cookie += "; secure";
      cookie += `; samesite=${sameSite}`;
      document.cookie = cookie;
      return true;
    } catch (e) {
      _metrics.errors++;
      return false;
    }
  },
  remove(name, options = {}) {
    _metrics.removes++;
    try {
      const { path = "/", domain } = options;
      let cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`;
      if (domain) cookie += `; domain=${domain}`;
      document.cookie = cookie;
      if (!domain) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=dshowdash.com.br`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=.dshowdash.com.br`;
      }
      return true;
    } catch (e) {
      _metrics.errors++;
      return false;
    }
  },
  has(name) {
    try {
      return document.cookie.split(";").some((c) => c.trim().startsWith(`${name}=`));
    } catch {
      return false;
    }
  },
  getAll() {
    try {
      return _parseCookies(document.cookie);
    } catch {
      return {};
    }
  }
};
const _memoryAdapter = {
  get(name) {
    _metrics.gets++;
    return _memoryCookies.get(name) ?? null;
  },
  set(name, value, options = {}) {
    _metrics.sets++;
    _memoryCookies.set(name, value);
    return true;
  },
  remove(name, options = {}) {
    _metrics.removes++;
    _memoryCookies.delete(name);
    return true;
  },
  has(name) {
    return _memoryCookies.has(name);
  },
  getAll() {
    return Object.fromEntries(_memoryCookies);
  }
};
let _activeAdapter = _isCookieAvailable() ? _documentAdapter : _memoryAdapter;
let _adapterType = _isCookieAvailable() ? "document" : "memory";
function get(name) {
  return _activeAdapter.get(name);
}
function set(name, value, options = {}) {
  return _activeAdapter.set(name, value, options);
}
function remove(name, options = {}) {
  return _activeAdapter.remove(name, options);
}
function has(name) {
  return _activeAdapter.has(name);
}
function getAll() {
  return _activeAdapter.getAll();
}
function useMemoryAdapter() {
  _activeAdapter = _memoryAdapter;
  _adapterType = "memory";
}
function useDocumentAdapter() {
  if (_isCookieAvailable()) {
    _activeAdapter = _documentAdapter;
    _adapterType = "document";
    return true;
  }
  return false;
}
function getAdapterType() {
  return _adapterType;
}
function getVersion() {
  return VERSION;
}
function getMetrics() {
  return { ..._metrics, adapterType: _adapterType };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, adapterType: _adapterType, cookieAvailable: _isCookieAvailable(), memoryCookiesSize: _memoryCookies.size, metrics: getMetrics(), timestamp: Date.now() };
}
function healthCheck() {
  const checks = { adapterActive: !!_activeAdapter, lowErrorRate: _metrics.gets + _metrics.sets === 0 || _metrics.errors / (_metrics.gets + _metrics.sets) < 0.1 };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", score: `${passed}/${total}`, checks, adapterType: _adapterType, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
const CookiePort = { get, set, remove, has, getAll, useMemoryAdapter, useDocumentAdapter, getAdapterType, getVersion, getMetrics, info, healthCheck };
var cookie_port_default = CookiePort;
export {
  CookiePort,
  MODULE_ID,
  VERSION,
  cookie_port_default as default,
  get,
  getAdapterType,
  getAll,
  getMetrics,
  getVersion,
  has,
  healthCheck,
  info,
  remove,
  set,
  useDocumentAdapter,
  useMemoryAdapter
};
