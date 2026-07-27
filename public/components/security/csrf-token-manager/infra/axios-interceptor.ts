// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-ENTERPRISE-FIX)
// ═══════════════════════════════════════════════════════════════
// MODULE: csrf-token-manager-axios-interceptor
// PURPOSE: CSRF Token Manager - Axios Interceptor v2.1.0-ENTERPRISE-FIX
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   install() — exported function
//   uninstall() — exported function
//   isInstalled() — exported function
//   attachAxiosSecurity() — exported function
//   detachAxiosSecurity() — exported function
//   isAttached() — exported function
//   getInterceptorInfo() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (window as any).CSRF_TOKEN
//   (window as any).axios
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '2.1.0-ENTERPRISE-FIX';
export const MODULE_ID = 'csrf-token-manager-axios-interceptor';

// Estado interno
let _interceptorId: number | null = null;
let _axiosInstance: Record<string, unknown> | null = null;
let _getTokenFn: (() => string | null) | null = null;
let _stats = { requestsIntercepted: 0, tokensAttached: 0 };

// Instala interceptor (método legacy)
export function install(axiosInstance: Record<string, unknown>, getToken: (() => string | null)) {
  return attachAxiosSecurity(axiosInstance, getToken);
}

// Remove interceptor (método legacy)
export function uninstall(axiosInstance: Record<string, unknown>) {
  return detachAxiosSecurity(axiosInstance);
}

// Verifica se instalado (método legacy)
export function isInstalled() {
  return isAttached();
}

// Anexa interceptors de segurança ao Axios
export function attachAxiosSecurity(axiosInstance: Record<string, unknown> | null = null, getToken: (() => string | null) | null = null) {
  // Usa instância fornecida ou tenta (window as any).axios
  const axios = axiosInstance || (typeof window !== 'undefined' ? (window as any).axios : null);
  
  if (!axios || !axios.interceptors) {
    return false;
  }
  
  // Se já está anexado, não faz nada
  if (_interceptorId !== null) {
    return true;
  }
  
  _axiosInstance = axios;
  _getTokenFn = getToken;
  
  _interceptorId = axios.interceptors.request.use((config: Record<string, unknown>) => {
    _stats.requestsIntercepted++;
    
    // Obtém token via função fornecida ou (window as any).CSRF_TOKEN
    const token = _getTokenFn?.() || (typeof window !== 'undefined' ? (window as any).CSRF_TOKEN : null);
    
    if (token) {
      config.headers = config.headers || {};
      (config.headers as Record<string, string>)['X-CSRF-TOKEN'] = token;
      (config.headers as Record<string, string>)['X-Requested-With'] = 'XMLHttpRequest';
      _stats.tokensAttached++;
    }
    
    return config;
  }, (error: unknown) => Promise.reject(error));
  
  return true;
}

// Remove interceptors de segurança do Axios
export function detachAxiosSecurity(axiosInstance: Record<string, unknown> | null = null) {
  const axios = axiosInstance || _axiosInstance;
  
  if (!axios || _interceptorId === null) {
    return false;
  }
  
  (axios as any).interceptors.request.eject(_interceptorId);
  _interceptorId = null;
  _axiosInstance = null;
  _getTokenFn = null;
  
  return true;
}

// Verifica se está anexado
export function isAttached() {
  return _interceptorId !== null;
}

// Informações do interceptor
export function getInterceptorInfo() {
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

// Health check
export function healthCheck() {
  const checks = {
    moduleReady: true,
    interceptorAttached: isAttached()
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? 'HEALTHY' : 'DEGRADED',
    score: `${passed}/${total}`,
    checks,
    stats: { ..._stats },
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

// Info
export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    attached: isAttached(),
    stats: { ..._stats },
    timestamp: Date.now()
  };
}

export default {
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
