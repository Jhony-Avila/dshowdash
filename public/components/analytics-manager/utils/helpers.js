import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "2.5.0-P2-ENTERPRISE";
const MODULE_ID = "components.analytics-manager.utils.helpers";
const hasWindow = typeof window !== "undefined";
const hasDocument = typeof document !== "undefined";
const hasLocalStorage = (() => {
  try {
    if (!hasWindow) return false;
    const test = "__storage_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
})();
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
const generateUserId = () => {
  if (!hasLocalStorage) {
    return `anon-${Date.now()}-${Math.random().toString(36).substr(2, 12)}`;
  }
  try {
    let userId = localStorage.getItem("dshowdash-analytics-user-id");
    if (!userId) {
      userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 12)}`;
      localStorage.setItem("dshowdash-analytics-user-id", userId);
    }
    return userId;
  } catch (e) {
    return `anon-${Date.now()}-${Math.random().toString(36).substr(2, 12)}`;
  }
};
const getDeviceInfo = () => {
  if (!hasWindow || typeof navigator === "undefined") {
    return {
      userAgent: "",
      language: "",
      platform: "",
      cookieEnabled: false,
      onLine: false,
      screenWidth: 0,
      screenHeight: 0,
      viewportWidth: 0,
      viewportHeight: 0,
      pixelRatio: 1
    };
  }
  return {
    userAgent: navigator.userAgent || "",
    language: navigator.language || "",
    platform: navigator.platform || "",
    cookieEnabled: navigator.cookieEnabled || false,
    onLine: navigator.onLine || false,
    screenWidth: window.screen?.width || 0,
    screenHeight: window.screen?.height || 0,
    viewportWidth: window.innerWidth || 0,
    viewportHeight: window.innerHeight || 0,
    pixelRatio: window.devicePixelRatio || 1
  };
};
const getPageInfo = () => {
  if (!hasWindow) {
    return { url: "", path: "", hash: "", search: "", referrer: "", title: "" };
  }
  _initPorts();
  const router = _getPort("router");
  let route = null;
  if (router && router.getCurrentRoute) {
    try {
      route = router.getCurrentRoute();
    } catch (e) {
    }
  }
  let url = "", path = "", hash = "", search = "";
  if (route) {
    url = route.url || route.href || "";
    path = route.path || route.pathname || "";
    hash = route.hash || "";
    search = route.search || route.query || "";
  }
  if (!url && typeof window !== "undefined" && window.location) {
    url = window.location.href || "";
    path = window.location.pathname || "";
    hash = window.location.hash || "";
    search = window.location.search || "";
  }
  return {
    url,
    path,
    hash,
    search,
    referrer: hasDocument ? document.referrer : "",
    title: hasDocument ? document.title : ""
  };
};
const calculateSessionDuration = (session) => {
  if (!session || !session.startTime) return 0;
  const endTime = session.endTime || Date.now();
  return endTime - session.startTime;
};
const formatDuration = (ms) => {
  const seconds = Math.floor(ms / 1e3);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};
const hashString = (str) => {
  if (typeof str !== "string") return "0";
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};
const sanitizeEventData = (data) => {
  if (!data || typeof data !== "object") return {};
  const sanitized = {};
  for (const key of Object.keys(data)) {
    const value = data[key];
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      sanitized[key] = value;
    } else if (value === null || value === void 0) {
      sanitized[key] = null;
    } else {
      sanitized[key] = String(value);
    }
  }
  return sanitized;
};
const getVersion = () => VERSION;
const healthCheck = () => {
  const ps = Ports.snapshot();
  const checks = {
    hasWindow,
    hasDocument,
    hasLocalStorage,
    generateUserIdAvailable: typeof generateUserId === "function",
    getDeviceInfoAvailable: typeof getDeviceInfo === "function",
    getPageInfoAvailable: typeof getPageInfo === "function",
    routerAvailable: !!_getPort("router"),
    portsInitialized: ps._initialized
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed >= 4 ? "HEALTHY" : "DEGRADED",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
};
const info = () => ({
  moduleId: MODULE_ID,
  version: VERSION,
  environment: { hasWindow, hasDocument, hasLocalStorage },
  healthCheck: healthCheck(),
  timestamp: Date.now()
});
var helpers_default = {
  generateUserId,
  getDeviceInfo,
  getPageInfo,
  calculateSessionDuration,
  formatDuration,
  hashString,
  sanitizeEventData,
  getVersion,
  healthCheck,
  info,
  injectPorts,
  getPorts,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  calculateSessionDuration,
  helpers_default as default,
  formatDuration,
  generateUserId,
  getDeviceInfo,
  getPageInfo,
  getPorts,
  getVersion,
  hashString,
  healthCheck,
  info,
  injectPorts,
  sanitizeEventData
};
