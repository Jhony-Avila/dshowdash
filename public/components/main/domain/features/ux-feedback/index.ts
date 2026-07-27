

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: main.feature.ux-feedback
// PURPOSE: MainFeature: UX Feedback
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   MAIN_EVENTS from /core/runtime/events/catalog/main.events.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   init() — exported function
//   destroy() — exported function
//   cleanup — exported value
//   show() — exported function
//   hideToast() — exported function
//   showLoading() — exported function
//   showSuccess() — exported function
//   showError() — exported function
//   showWarning() — exported function
//   showInfo() — exported function
//   hideAll() — exported function
//   updateConfig() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   MAIN_EVENTS.NAVIGATION_COMPLETE
//   MAIN_EVENTS.NAVIGATION_ERROR
//   MAIN_EVENTS.NAVIGATION_START
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { MAIN_EVENTS } from '/core/runtime/events/catalog/main.events.js';

export const MODULE_ID = 'main.feature.ux-feedback';
export const VERSION = '1.0.0-ENTERPRISE';

const FEEDBACK_TYPES = Object.freeze({
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
});

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

let _enabled = false;
let _cleanups: Array<() => void> = [];
const _activeToasts = new Map();
let _toastContainer: string | null = null;
let _toastIdCounter = 0;

let _config = {
  position: 'bottom-right',
  duration: 3000,
  maxToasts: 5,
  animationDuration: 300
};

const _metrics = {
  inits: 0,
  toastsShown: 0,
  toastsByType: { loading: 0, success: 0, error: 0, warning: 0, info: 0 } as Record<string, number>
};

// ═══════════════════════════════════════════════════════════════
// TOAST MANAGEMENT
// ═══════════════════════════════════════════════════════════════

function _createContainer() {
  if (_toastContainer) return _toastContainer;
  
// @ts-expect-error TS migration - TS2322
  _toastContainer = document.createElement('div');
// @ts-expect-error TS migration - TS2339
  _toastContainer.id = 'ux-feedback-container';
// @ts-expect-error TS migration - TS2339
  _toastContainer.style.cssText = `position:fixed;z-index:99999;display:flex;flex-direction:column;gap:8px;pointer-events:none;${_getPositionStyles()}`;
  
// @ts-expect-error TS migration - TS2345
  document.body.appendChild(_toastContainer);
  return _toastContainer;
}

function _getPositionStyles() {
  const pos = _config.position;
  if (pos === 'top-right') return 'top:20px;right:20px;';
  if (pos === 'top-left') return 'top:20px;left:20px;';
  if (pos === 'bottom-left') return 'bottom:20px;left:20px;';
  return 'bottom:20px;right:20px;';
}

function _getTypeStyles(type: string) {
  const styles: Record<string, string> = {
    loading: 'background:#3b82f6;color:white;',
    success: 'background:#10b981;color:white;',
    error: 'background:#ef4444;color:white;',
    warning: 'background:#f59e0b;color:white;',
    info: 'background:#6366f1;color:white;'
  };
  return styles[type] || styles.info;
}

function _getTypeIcon(type: string) {
  const icons: Record<string, string> = {
    loading: '⏳',
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };
  return icons[type] || icons.info;
}

function _createToast(id: string, type: string, message: string, options: Record<string, unknown>) {
  const toast = document.createElement('div');
  toast.id = `toast-${id}`;
  toast.style.cssText = `padding:12px 16px;border-radius:8px;font-family:system-ui,-apple-system,sans-serif;font-size:14px;display:flex;align-items:center;gap:8px;pointer-events:auto;opacity:0;transform:translateX(100%);transition:all ${_config.animationDuration}ms ease;box-shadow:0 4px 12px rgba(0,0,0,0.15);max-width:350px;${_getTypeStyles(type)}`;
  
  const icon = document.createElement('span');
  icon.textContent = _getTypeIcon(type);
  icon.style.cssText = 'font-size:16px;';
  
  const text = document.createElement('span');
  text.textContent = message;
  text.style.cssText = 'flex:1;';
  
  toast.appendChild(icon);
  toast.appendChild(text);
  
  if (type !== 'loading' && options && options.dismissible !== false) {
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = 'background:none;border:none;color:inherit;font-size:18px;cursor:pointer;padding:0;margin-left:8px;opacity:0.7;';
    closeBtn.onclick = () => { hideToast(id); };
    toast.appendChild(closeBtn);
  }
  
  return toast;
}

// ═══════════════════════════════════════════════════════════════
// LIFECYCLE
// ═══════════════════════════════════════════════════════════════

export function init(options: Record<string, unknown>) {
  if (_enabled) return { ok: true, alreadyInitialized: true };
  
  try {
    _initPorts();
    _metrics.inits++;
    
    if (options && options.config) {
      _config = Object.assign({}, _config, options.config);
    }
    
    if (typeof document !== 'undefined') {
      _createContainer();
    }
    
    const eb = _getPort('eventBus');
    if (eb && eb.on) {
      // Auto-feedback para navegação
      if (MAIN_EVENTS && MAIN_EVENTS.NAVIGATION_START) {
        const navStartHandler = (data: Record<string, unknown>) => {
          showLoading('Carregando...', { id: 'nav-loading' });
        };
        eb.on(MAIN_EVENTS.NAVIGATION_START, navStartHandler);
        _cleanups.push(() => { if (eb.off) eb.off(MAIN_EVENTS.NAVIGATION_START, navStartHandler); });
      }
      
      if (MAIN_EVENTS && MAIN_EVENTS.NAVIGATION_COMPLETE) {
        const navCompleteHandler = (data: Record<string, unknown>) => {
          hideToast('nav-loading');
        };
        eb.on(MAIN_EVENTS.NAVIGATION_COMPLETE, navCompleteHandler);
        _cleanups.push(() => { if (eb.off) eb.off(MAIN_EVENTS.NAVIGATION_COMPLETE, navCompleteHandler); });
      }
      
      if (MAIN_EVENTS && MAIN_EVENTS.NAVIGATION_ERROR) {
        const navErrorHandler = (data: Record<string, unknown>) => {
          hideToast('nav-loading');
          showError('Erro na navegação');
        };
        eb.on(MAIN_EVENTS.NAVIGATION_ERROR, navErrorHandler);
        _cleanups.push(() => { if (eb.off) eb.off(MAIN_EVENTS.NAVIGATION_ERROR, navErrorHandler); });
      }
    }
    
    _enabled = true;
    return { ok: true, version: VERSION };
    
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export function destroy() {
  for (let i = 0; i < _cleanups.length; i++) {
    try { _cleanups[i](); } catch (e: any) { }
  }
  _cleanups = [];
  
  _activeToasts.forEach((data, id) => {
    hideToast(id);
  });
  
// @ts-expect-error TS migration - TS2339
  if (_toastContainer && _toastContainer.parentNode) {
// @ts-expect-error TS migration - TS2339
    _toastContainer.parentNode.removeChild(_toastContainer);
    _toastContainer = null;
  }
  
  _enabled = false;
  return { ok: true };
}

export const cleanup = destroy;

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

export function show(type: string, message: string, options: Record<string, unknown>) {
  if (!_enabled || typeof document === 'undefined') return { ok: false, error: 'Not initialized' };
  
  const opts = options || {};
  const id = opts.id || (`toast-${++_toastIdCounter}`);
  
  // Limitar quantidade de toasts
  if (_activeToasts.size >= _config.maxToasts) {
    const oldest = _activeToasts.keys().next().value;
    hideToast(oldest);
  }
  
  // Remover toast existente com mesmo ID
  if (_activeToasts.has(id)) {
// @ts-expect-error TS migration - TS2345
    hideToast(id);
  }
  
// @ts-expect-error TS migration - TS2345
  const toast = _createToast(id, type, message, opts);
// @ts-expect-error TS migration - TS2339
  _toastContainer.appendChild(toast);
  
  // Animar entrada
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';
  }, 10);
  
  let timeoutId = null;
  const duration = opts.duration !== undefined ? opts.duration : _config.duration;
  
// @ts-expect-error TS migration - TS2365
  if (type !== 'loading' && duration > 0) {
    timeoutId = setTimeout(() => {
// @ts-expect-error TS migration - TS2345
      hideToast(id);
// @ts-expect-error TS migration - TS2769
    }, duration);
  }
  
  _activeToasts.set(id, { toast, timeoutId, type });
  _metrics.toastsShown++;
  _metrics.toastsByType[type] = (_metrics.toastsByType[type] || 0) + 1;
  
  return { ok: true, id };
}

export function hideToast(id: string) {
  const data = _activeToasts.get(id);
  if (!data) return { ok: false };
  
  if (data.timeoutId) {
    clearTimeout(data.timeoutId);
  }
  
  data.toast.style.opacity = '0';
  data.toast.style.transform = 'translateX(100%)';
  
  setTimeout(() => {
    if (data.toast.parentNode) {
      data.toast.parentNode.removeChild(data.toast);
    }
  }, _config.animationDuration);
  
  _activeToasts.delete(id);
  return { ok: true };
}

export function showLoading(message: string, options: Record<string, unknown>) {
  return show(FEEDBACK_TYPES.LOADING, message || 'Carregando...', options);
}

export function showSuccess(message: string, options: Record<string, unknown>) {
  return show(FEEDBACK_TYPES.SUCCESS, message || 'Sucesso!', options);
}

export function showError(message: string, options?: Record<string, unknown>) {
  return show(FEEDBACK_TYPES.ERROR, message || 'Erro!', Object.assign({ duration: 5000 }, options || {}));
}

export function showWarning(message: string, options: Record<string, unknown>) {
  return show(FEEDBACK_TYPES.WARNING, message || 'Atenção!', options);
}

export function showInfo(message: string, options: Record<string, unknown>) {
  return show(FEEDBACK_TYPES.INFO, message || 'Informação', options);
}

export function hideAll() {
  _activeToasts.forEach((data, id) => {
    hideToast(id);
  });
  return { ok: true };
}

export function updateConfig(newConfig: Record<string, unknown>) {
  _config = Object.assign({}, _config, newConfig);
  return { ok: true, config: Object.assign({}, _config) };
}

// ═══════════════════════════════════════════════════════════════
// OBSERVABILITY
// ═══════════════════════════════════════════════════════════════

export function getMetrics() {
  return Object.assign({}, _metrics, { activeToasts: _activeToasts.size });
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    enabled: _enabled,
    feedbackTypes: FEEDBACK_TYPES,
    config: Object.assign({}, _config),
    metrics: getMetrics()
  };
}

export function healthCheck() {
  const checks = {
    enabled: _enabled,
    containerExists: !!_toastContainer
  };
  
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  
  let status = 'HEALTHY';
  if (!_enabled) status = 'NOT_INITIALIZED';
  
  return {
    status,
    score: { passed, total, percentage: Math.round((passed / total) * 100) },
    moduleId: MODULE_ID,
    version: VERSION,
    checks,
    metrics: _metrics,
    timestamp: Date.now()
  };
}

export default {
  MODULE_ID,
  VERSION,
  FEEDBACK_TYPES,
  init,
  destroy,
  cleanup,
  show,
  hideToast,
  showLoading,
  showSuccess,
  showError,
  showWarning,
  showInfo,
  hideAll,
  updateConfig,
  getMetrics,
  info,
  healthCheck,
  injectPorts,
  getPorts
};
