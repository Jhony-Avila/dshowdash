// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.overlay-layer.core.backdrop-controller
// PURPOSE: Overlay Layer Backdrop Controller - Backdrop with click delay
// ───────────────────────────────────────────────────────────────
// @contract MODULE_ID - module constant identifier
// @contract VERSION - module constant version
// @contract REGISTER - register() registers backdrop for overlay
// @contract UNREGISTER - unregister() removes backdrop registration
// @contract IS_CLICK_ALLOWED - isClickAllowed() checks if delay passed
// @contract GET_REMAINING_DELAY - getRemainingDelay() returns delay time
// @contract CREATE_BACKDROP - createBackdrop() creates backdrop element
// @contract SHOW - show() displays backdrop with animation
// @contract HIDE - hide() hides backdrop with animation
// @contract CLEANUP - cleanup() removes all backdrops
// @contract GET_CONFIG - getConfig() returns backdrop config
// @contract SET_CONFIG - setConfig() updates backdrop config
// @contract GET_METRICS - getMetrics() returns backdrop metrics
// @contract HEALTH - healthCheck() returns health status
// @contract INFO - info() returns module information
// ───────────────────────────────────────────────────────────────
// IMPORTS: (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   register() — exported function
//   unregister() — exported function
//   isClickAllowed() — exported function
//   getRemainingDelay() — exported function
//   createBackdrop() — exported function
//   show() — exported function
//   hide() — exported function
//   cleanup() — exported function
//   getConfig() — exported function
//   setConfig() — exported function
//   getMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos): (none)
// LISTENS (eventos): (none)
// WINDOW ACCESS: document.createElement, document.body
// ───────────────────────────────────────────────────────────────
// @changelog v1.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.0.1-ENTERPRISE: ES5 conversion
// ═══════════════════════════════════════════════════════════════
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'overlay-layer-backdrop-controller';

const _config = {
  clickDelay: 300,
  closeOnClick: true,
  closeOnEscape: true,
  animated: true
};

let _backdropStates = {};
const _metrics = { clicks: 0, closesFromClick: 0, blockedClicks: 0 };

// Registra backdrop para um overlay
export function register(overlayId: string, backdropElement: DynObj, options: DynObj) {
  options = options || {};
  if (!overlayId || !backdropElement) {
    return { ok: false, reason: 'invalid-params' };
  }

  const openedAt = Date.now();
  const closeCallback = options.onClose || (() => {});
  const delay = options.clickDelay !== undefined ? options.clickDelay : _config.clickDelay;
  const closeOnClick = options.closeOnClick !== undefined ? options.closeOnClick : _config.closeOnClick;

  const handleClick = (e: Event) => {
    if (e.target !== backdropElement) return;

    _metrics.clicks++;
    const elapsed = Date.now() - openedAt;

    if (elapsed < delay) {
      _metrics.blockedClicks++;

      // Feedback visual de que clique foi bloqueado
      backdropElement.classList.add('click-blocked');
      setTimeout(() => { backdropElement.classList.remove('click-blocked'); }, 150);

      return;
    }

    if (closeOnClick) {
      _metrics.closesFromClick++;
      closeCallback('backdrop-click');
    }
  };

  backdropElement.addEventListener('click', handleClick);

  (_backdropStates as DynObj)[overlayId] = {
    element: backdropElement,
    openedAt,
    delay,
    closeOnClick,
    cleanup() {
      backdropElement.removeEventListener('click', handleClick);
    }
  };

  return { ok: true, overlayId, delay };
}

// Remove registro de backdrop
export function unregister(overlayId: string) {
  const state = (_backdropStates as DynObj)[overlayId];
  if (!state) {
    return { ok: false, reason: 'not-found' };
  }

  state.cleanup();
  delete (_backdropStates as DynObj)[overlayId];

  return { ok: true, overlayId };
}

// Verifica se clique está permitido (delay passou)
export function isClickAllowed(overlayId: string) {
  const state = (_backdropStates as DynObj)[overlayId];
  if (!state) return true;

  const elapsed = Date.now() - state.openedAt;
  return elapsed >= state.delay;
}

// Obtém tempo restante do delay
export function getRemainingDelay(overlayId: string) {
  const state = (_backdropStates as DynObj)[overlayId];
  if (!state) return 0;

  const elapsed = Date.now() - state.openedAt;
  return Math.max(0, state.delay - elapsed);
}

// Cria elemento de backdrop
export function createBackdrop(overlayId: string, options: DynObj) {
  options = options || {};
  const backdrop = document.createElement('div');
  backdrop.className = 'overlay-backdrop';
  backdrop.setAttribute('data-overlay-backdrop', overlayId);
  backdrop.setAttribute('aria-hidden', 'true');

  if (options.className) {
    backdrop.classList.add(options.className);
  }

  // Estilos base
  backdrop.style.position = 'fixed';
  backdrop.style.top = '0';
  backdrop.style.left = '0';
  backdrop.style.right = '0';
  backdrop.style.bottom = '0';
  backdrop.style.backgroundColor = options.color || 'rgba(0, 0, 0, 0.5)';
  backdrop.style.zIndex = String(options.zIndex || 7000);
  backdrop.style.opacity = '0';
  backdrop.style.transition = _config.animated ? 'opacity 150ms ease-out' : 'none';

  return backdrop;
}

// Mostra backdrop com animação
export function show(backdrop: DynObj) {
  if (!backdrop) return Promise.resolve({ ok: false });

  document.body.appendChild(backdrop);

  // Força reflow para animação
  backdrop.offsetHeight;
  backdrop.style.opacity = '1';

  if (_config.animated) {
    return new Promise(resolve => {
      setTimeout(() => { resolve({ ok: true }); }, 150);
    });
  }

  return Promise.resolve({ ok: true });
}

// Esconde backdrop com animação
export function hide(backdrop: DynObj) {
  if (!backdrop) return Promise.resolve({ ok: false });

  backdrop.style.opacity = '0';

  if (_config.animated) {
    return new Promise(resolve => {
      setTimeout(() => {
        backdrop.remove();
        resolve({ ok: true });
      }, 150);
    });
  }

  backdrop.remove();
  return Promise.resolve({ ok: true });
}

// Limpa todos os backdrops
export function cleanup() {
  const keys = Object.keys(_backdropStates);
  for (let i = 0; i < keys.length; i++) {
    (_backdropStates as DynObj)[keys[i]].cleanup();
  }
  _backdropStates = {};

  // Remove backdrops órfãos do DOM
  const orphans = document.querySelectorAll('[data-overlay-backdrop]');
  for (let j = 0; j < orphans.length; j++) {
    orphans[j].remove();
  }

  return { ok: true };
}

// Configuração
export function getConfig() {
  return Object.assign({}, _config);
}

export function setConfig(newConfig: DynObj) {
  if (newConfig.clickDelay !== undefined) _config.clickDelay = newConfig.clickDelay;
  if (newConfig.closeOnClick !== undefined) _config.closeOnClick = newConfig.closeOnClick;
  if (newConfig.closeOnEscape !== undefined) _config.closeOnEscape = newConfig.closeOnEscape;
  if (newConfig.animated !== undefined) _config.animated = newConfig.animated;
  return { ok: true, config: Object.assign({}, _config) };
}

export function getMetrics() {
  return Object.assign({}, _metrics, { activeBackdrops: Object.keys(_backdropStates).length });
}

export function healthCheck() {
  const domBackdrops = document.querySelectorAll('[data-overlay-backdrop]').length;
  const stateBackdrops = Object.keys(_backdropStates).length;
  const checks = {
    noOrphanBackdrops: domBackdrops === stateBackdrops,
    lowBlockRate: _metrics.clicks === 0 || (_metrics.blockedClicks / _metrics.clicks) < 0.5
  };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let i = 0; i < checkKeys.length; i++) { if ((checks as DynObj)[checkKeys[i]]) passed++; }
  const total = checkKeys.length;

  return {
    status: passed === total ? 'HEALTHY' : 'DEGRADED',
    score: `${passed}/${total}`,
    checks,
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
    config: getConfig(),
    activeBackdrops: Object.keys(_backdropStates).length,
    metrics: getMetrics(),
    timestamp: Date.now()
  };
}

export default {
  register,
  unregister,
  isClickAllowed,
  getRemainingDelay,
  createBackdrop,
  show,
  hide,
  cleanup,
  getConfig,
  setConfig,
  getMetrics,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
