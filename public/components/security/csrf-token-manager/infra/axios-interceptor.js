const VERSION = "2.1.0-ENTERPRISE-FIX";
const MODULE_ID = "csrf-token-manager-axios-interceptor";
let _interceptorId = null;
let _axiosInstance = null;
let _getTokenFn = null;
let _stats = { requestsIntercepted: 0, tokensAttached: 0 };
function install(axiosInstance, getToken) {
  return attachAxiosSecurity(axiosInstance, getToken);
}
function uninstall(axiosInstance) {
  return detachAxiosSecurity(axiosInstance);
}
function isInstalled() {
  return isAttached();
}
function attachAxiosSecurity(axiosInstance = null, getToken = null) {
  const axios = axiosInstance || (typeof window !== "undefined" ? window.axios : null);
  if (!axios || !axios.interceptors) {
    return false;
  }
  if (_interceptorId !== null) {
    return true;
  }
  _axiosInstance = axios;
  _getTokenFn = getToken;
  _interceptorId = axios.interceptors.request.use((config) => {
    _stats.requestsIntercepted++;
    const token = _getTokenFn?.() || (typeof window !== "undefined" ? window.CSRF_TOKEN : null);
    if (token) {
      config.headers = config.headers || {};
      config.headers["X-CSRF-TOKEN"] = token;
      config.headers["X-Requested-With"] = "XMLHttpRequest";
      _stats.tokensAttached++;
    }
    return config;
  }, (error) => Promise.reject(error));
  return true;
}
function detachAxiosSecurity(axiosInstance = null) {
  const axios = axiosInstance || _axiosInstance;
  if (!axios || _interceptorId === null) {
    return false;
  }
  axios.interceptors.request.eject(_interceptorId);
  _interceptorId = null;
  _axiosInstance = null;
  _getTokenFn = null;
  return true;
}
function isAttached() {
  return _interceptorId !== null;
}
function getInterceptorInfo() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    attached: isAttached(),
    interceptorId: _interceptorId,
    hasAxiosInstance: !!_axiosInstance,
    hasGetTokenFn: !!_getTokenFn,
    stats: { ..._stats },
    timestamp: Date.now()
  };
}
function healthCheck() {
  const checks = {
    moduleReady: true,
    interceptorAttached: isAttached()
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : "DEGRADED",
    score: `${passed}/${total}`,
    checks,
    stats: { ..._stats },
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    attached: isAttached(),
    stats: { ..._stats },
    timestamp: Date.now()
  };
}
var axios_interceptor_default = {
  install,
  uninstall,
  isInstalled,
  attachAxiosSecurity,
  detachAxiosSecurity,
  isAttached,
  getInterceptorInfo,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  attachAxiosSecurity,
  axios_interceptor_default as default,
  detachAxiosSecurity,
  getInterceptorInfo,
  healthCheck,
  info,
  install,
  isAttached,
  isInstalled,
  uninstall
};
