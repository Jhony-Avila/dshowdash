// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.overlay-layer.core.loading-state
// PURPOSE: Overlay Layer Loading State - Per-overlay loading indicators
// ───────────────────────────────────────────────────────────────
// @contract MODULE_ID - module constant identifier
// @contract VERSION - module constant version
// @contract SHOW - show() displays loading indicator
// @contract HIDE - hide() hides loading indicator
// @contract UPDATE_MESSAGE - updateMessage() updates loading message
// @contract IS_LOADING - isLoading() checks loading state
// @contract GET_STATE - getState() returns loading state
// @contract HIDE_ALL - hideAll() hides all loading indicators
// @contract WITH_LOADING - withLoading() wraps promise with loading
// @contract SHOW_WITH_TIMEOUT - showWithTimeout() shows loading with timeout
// @contract GET_METRICS - getMetrics() returns loading metrics
// @contract HEALTH - healthCheck() returns health status
// @contract INFO - info() returns module information
// ───────────────────────────────────────────────────────────────
// IMPORTS: (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   show() — exported function
//   hide() — exported function
//   updateMessage() — exported function
//   isLoading() — exported function
//   getState() — exported function
//   hideAll() — exported function
//   withLoading() — exported function
//   showWithTimeout() — exported function
//   getMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos): (none)
// LISTENS (eventos): (none)
// WINDOW ACCESS: document.createElement, document.head, window.getComputedStyle
// ───────────────────────────────────────────────────────────────
// @changelog v1.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.0.1-ENTERPRISE: ES5 conversion
// ═══════════════════════════════════════════════════════════════
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'overlay-layer-loading-state';

const _loadingStates = {};
const _metrics = { loadingShown: 0, loadingHidden: 0, avgDuration: 0 };

// Estilos do loading spinner
const LOADING_STYLES = '.overlay-loading-container{position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.9);z-index:10;opacity:0;transition:opacity 200ms ease-out;pointer-events:none}.overlay-loading-container.active{opacity:1;pointer-events:auto}.overlay-loading-spinner{width:40px;height:40px;border:3px solid #e5e7eb;border-top-color:#3b82f6;border-radius:50%;animation:overlay-spin 0.8s linear infinite}.overlay-loading-text{margin-top:12px;font-size:14px;color:#6b7280}@keyframes overlay-spin{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){.overlay-loading-spinner{animation:none;border-top-color:#3b82f6;border-right-color:#3b82f6}}';

let _stylesInjected = false;

// Injeta estilos CSS
function _injectStyles() {
  if (_stylesInjected || typeof document === 'undefined') return;

  const style = document.createElement('style');
  style.setAttribute('data-overlay-loading-styles', '');
  style.textContent = LOADING_STYLES;
  document.head.appendChild(style);
  _stylesInjected = true;
}

// Cria elemento de loading
function _createLoadingElement(message: string) {
  const container = document.createElement('div');
  container.className = 'overlay-loading-container';
  container.setAttribute('role', 'status');
  container.setAttribute('aria-live', 'polite');

  const inner = document.createElement('div');
  inner.style.textAlign = 'center';

  const spinner = document.createElement('div');
  spinner.className = 'overlay-loading-spinner';
  spinner.setAttribute('aria-hidden', 'true');

  const text = document.createElement('div');
  text.className = 'overlay-loading-text';
  text.textContent = message || 'Carregando...';

  inner.appendChild(spinner);
  inner.appendChild(text);
  container.appendChild(inner);

  return container;
}

// Mostra loading em um overlay
export function show(overlayId: string, overlayElement: DynObj, options: DynObj) {
  options = options || {};
  if (!overlayId || !overlayElement) {
    return { ok: false, reason: 'invalid-params' };
  }

  _injectStyles();

  // Remove loading existente se houver
  hide(overlayId);

  const message = options.message || 'Carregando...';
  const loadingEl = _createLoadingElement(message);

  // Garante que o overlay tem position relative
  const computed = window.getComputedStyle(overlayElement);
  if (computed.position === 'static') {
    overlayElement.style.position = 'relative';
  }

  overlayElement.appendChild(loadingEl);

  // Força reflow e ativa
  loadingEl.offsetHeight;
  requestAnimationFrame(() => { loadingEl.classList.add('active'); });

  const startTime = Date.now();

  (_loadingStates as DynObj)[overlayId] = {
    element: loadingEl,
    overlayElement,
    startTime,
    message
  };

  _metrics.loadingShown++;

  return { ok: true, overlayId };
}

// Esconde loading de um overlay
export function hide(overlayId: string) {
  const state = (_loadingStates as DynObj)[overlayId];
  if (!state) {
    return { ok: false, reason: 'not-found' };
  }

  const duration = Date.now() - state.startTime;
  _metrics.avgDuration = (_metrics.avgDuration * _metrics.loadingHidden + duration) / (_metrics.loadingHidden + 1);
  _metrics.loadingHidden++;

  state.element.classList.remove('active');

  const elementToRemove = state.element;
  setTimeout(() => {
    elementToRemove.remove();
  }, 200);

  delete (_loadingStates as DynObj)[overlayId];

  return { ok: true, overlayId, duration };
}

// Atualiza mensagem do loading
export function updateMessage(overlayId: string, message: string) {
  const state = (_loadingStates as DynObj)[overlayId];
  if (!state) {
    return { ok: false, reason: 'not-found' };
  }

  const textEl = state.element.querySelector('.overlay-loading-text');
  if (textEl) {
    textEl.textContent = message;
  }

  state.message = message;

  return { ok: true, overlayId, message };
}

// Verifica se overlay está em loading
export function isLoading(overlayId: string) {
  return !!(_loadingStates as DynObj)[overlayId];
}

// Obtém estado do loading
export function getState(overlayId: string) {
  const state = (_loadingStates as DynObj)[overlayId];
  if (!state) return null;

  return {
    overlayId,
    message: state.message,
    duration: Date.now() - state.startTime
  };
}

// Esconde todos os loadings
export function hideAll() {
  const keys = Object.keys(_loadingStates);
  const count = keys.length;
  for (let i = 0; i < keys.length; i++) {
    hide(keys[i]);
  }
  return { ok: true, hidden: count };
}

// Loading com promise (auto-hide quando resolve)
export function withLoading(overlayId: string, overlayElement: DynObj, promise: DynObj, options: DynObj) {
  show(overlayId, overlayElement, options);

  return promise.then((result: DynObj) => {
    hide(overlayId);
    return { ok: true, result };
  }).catch((error: DynObj) => {
    hide(overlayId);
    return { ok: false, error };
  });
}

// Loading com timeout
export function showWithTimeout(overlayId: string, overlayElement: DynObj, timeout: number, options: DynObj) {
  show(overlayId, overlayElement, options);

  setTimeout(() => {
    if (isLoading(overlayId)) {
      hide(overlayId);
    }
  }, timeout);

  return { ok: true, overlayId, timeout };
}

export function getMetrics() {
  return Object.assign({}, _metrics, { activeLoadings: Object.keys(_loadingStates).length });
}

export function healthCheck() {
  const stateKeys = Object.keys(_loadingStates);
  let hasStuck = false;
  for (let i = 0; i < stateKeys.length; i++) {
    if (Date.now() - (_loadingStates as DynObj)[stateKeys[i]].startTime > 60000) {
      hasStuck = true;
      break;
    }
  }
  const checks = {
    stylesInjected: _stylesInjected,
    noStuckLoadings: !hasStuck
  };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let j = 0; j < checkKeys.length; j++) { if ((checks as DynObj)[checkKeys[j]]) passed++; }
  const total = checkKeys.length;

  return {
    status: passed === total ? 'HEALTHY' : 'DEGRADED',
    score: `${passed}/${total}`,
    checks,
    activeLoadings: stateKeys.length,
    metrics: getMetrics(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    stylesInjected: _stylesInjected,
    activeLoadings: Object.keys(_loadingStates),
    metrics: getMetrics(),
    timestamp: Date.now()
  };
}

export default {
  show,
  hide,
  updateMessage,
  isLoading,
  getState,
  hideAll,
  withLoading,
  showWithTimeout,
  getMetrics,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
