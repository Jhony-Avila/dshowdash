
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.overlay-layer.core.accessibility
// PURPOSE: Overlay Layer Accessibility - Screen reader and ARIA support
// ───────────────────────────────────────────────────────────────
// @contract MODULE_ID - module constant identifier
// @contract VERSION - module constant version
// @contract INIT - init() initializes accessibility
// @contract CLEANUP - cleanup() removes announcer
// @contract ANNOUNCE - announce() announces message to screen readers
// @contract ANNOUNCE_OPEN - announceOpen() announces overlay open
// @contract ANNOUNCE_CLOSE - announceClose() announces overlay close
// @contract ANNOUNCE_LOADING - announceLoading() announces loading state
// @contract SET_OVERLAY_ROLE - setOverlayRole() sets ARIA role
// @contract CLEAR_OVERLAY_ROLE - clearOverlayRole() removes ARIA role
// @contract HIDE_FROM_SR - hideFromScreenReaders() hides from screen readers
// @contract SHOW_TO_SR - showToScreenReaders() shows to screen readers
// @contract GET_CONFIG - getConfig() returns accessibility config
// @contract SET_CONFIG - setConfig() updates accessibility config
// @contract GET_METRICS - getMetrics() returns accessibility metrics
// @contract HEALTH - healthCheck() returns health status
// @contract INFO - info() returns module information
// ───────────────────────────────────────────────────────────────
// IMPORTS: (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   init() — exported function
//   cleanup() — exported function
//   announce() — exported function
//   announceOpen() — exported function
//   announceClose() — exported function
//   announceLoading() — exported function
//   setOverlayRole() — exported function
//   clearOverlayRole() — exported function
//   hideFromScreenReaders() — exported function
//   showToScreenReaders() — exported function
//   getConfig() — exported function
//   setConfig() — exported function
//   getMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): config object
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
export const MODULE_ID = 'overlay-layer-accessibility';

let _announcer: DynObj = null;
const _config = {
  enabled: true,
  politeness: 'polite',
  announceOpen: true,
  announceClose: true,
  announceRole: true,
  locale: 'pt-BR'
};

const _metrics = { announcements: 0 };

// Mensagens por locale
const MESSAGES = {
  'pt-BR': {
    opened: '{type} aberto',
    closed: '{type} fechado',
    loading: 'Carregando',
    types: {
      modal: 'Modal',
      dialog: 'Diálogo',
      alertdialog: 'Alerta',
      drawer: 'Gaveta lateral',
      menu: 'Menu',
      tooltip: 'Dica',
      toast: 'Notificação',
      loading: 'Carregamento',
      preloader: 'Carregamento inicial',
      confirmation: 'Confirmação'
    }
  },
  'en-US': {
    opened: '{type} opened',
    closed: '{type} closed',
    loading: 'Loading',
    types: {
      modal: 'Modal',
      dialog: 'Dialog',
      alertdialog: 'Alert',
      drawer: 'Drawer',
      menu: 'Menu',
      tooltip: 'Tooltip',
      toast: 'Notification',
      loading: 'Loading',
      preloader: 'Initial loading',
      confirmation: 'Confirmation'
    }
  }
};

// Cria elemento announcer (aria-live region)
function _createAnnouncer() {
  if (_announcer) return _announcer;
  if (typeof document === 'undefined') return null;

  _announcer = document.createElement('div');
  _announcer.id = 'overlay-announcer';
  _announcer.setAttribute('role', 'status');
  _announcer.setAttribute('aria-live', 'polite');
  _announcer.setAttribute('aria-atomic', 'true');

  // Visualmente oculto mas acessível para screen readers
  _announcer.style.position = 'absolute';
  _announcer.style.width = '1px';
  _announcer.style.height = '1px';
  _announcer.style.padding = '0';
  _announcer.style.margin = '-1px';
  _announcer.style.overflow = 'hidden';
  _announcer.style.clip = 'rect(0, 0, 0, 0)';
  _announcer.style.whiteSpace = 'nowrap';
  _announcer.style.border = '0';

  document.body.appendChild(_announcer);
  return _announcer;
}

// Obtém mensagem localizada
function _getMessage(key: string) {
  const locale = (MESSAGES as DynObj)[_config.locale] || MESSAGES['pt-BR'];
  return locale[key] || (MESSAGES as DynObj)['pt-BR'][key] || key;
}

// Obtém nome do tipo localizado
function _getTypeName(type: DynObj) {
  const locale = (MESSAGES as DynObj)[_config.locale] || MESSAGES['pt-BR'];
  return locale.types[type] || locale.types.modal || type;
}

// Anuncia mensagem para screen readers
export function announce(message: string, options?: DynObj) {
  options = options || {};
  if (!_config.enabled) return { ok: false, reason: 'disabled' };

  const announcer = _createAnnouncer();
  if (!announcer) return { ok: false, reason: 'no-announcer' };

  const politeness = options.politeness || _config.politeness;
  announcer.setAttribute('aria-live', politeness);

  // Limpa e define nova mensagem
  announcer.textContent = '';

  // Pequeno delay para garantir que screen reader detecte a mudança
  requestAnimationFrame(() => {
    announcer.textContent = message;
    _metrics.announcements++;
  });

  return { ok: true, message };
}

// Anuncia abertura de overlay
export function announceOpen(overlayType: DynObj, customMessage?: DynObj) {
  if (!_config.announceOpen) return { ok: false, reason: 'announceOpen-disabled' };

  const typeName = _getTypeName(overlayType);
  const template = _getMessage('opened');
  const message = customMessage || template.replace('{type}', typeName);

  return announce(message);
}

// Anuncia fechamento de overlay
export function announceClose(overlayType: DynObj, customMessage?: DynObj) {
  if (!_config.announceClose) return { ok: false, reason: 'announceClose-disabled' };

  const typeName = _getTypeName(overlayType);
  const template = _getMessage('closed');
  const message = customMessage || template.replace('{type}', typeName);

  return announce(message);
}

// Anuncia loading
export function announceLoading(message: string) {
  const loadingMsg = message || _getMessage('loading');
  return announce(loadingMsg);
}

// Configura role apropriado para overlay
export function setOverlayRole(element: HTMLElement, type: DynObj, options: DynObj) {
  options = options || {};
  if (!element) return { ok: false, reason: 'no-element' };

  const roleMap = {
    modal: 'dialog',
    dialog: 'dialog',
    alertdialog: 'alertdialog',
    drawer: 'dialog',
    menu: 'menu',
    tooltip: 'tooltip',
    toast: 'status',
    loading: 'status',
    preloader: 'status',
    confirmation: 'alertdialog'
  };

  const role = (roleMap as DynObj)[type] || 'dialog';
  element.setAttribute('role', role);

  // aria-modal para modais
  if (role === 'dialog' || role === 'alertdialog') {
    element.setAttribute('aria-modal', 'true');
  }

  // aria-label ou aria-labelledby
  if (options.label) {
    element.setAttribute('aria-label', options.label);
  } else if (options.labelledBy) {
    element.setAttribute('aria-labelledby', options.labelledBy);
  }

  // aria-describedby
  if (options.describedBy) {
    element.setAttribute('aria-describedby', options.describedBy);
  }

  // Anuncia role se configurado
  if (_config.announceRole && options.announceRole !== false) {
    announceOpen(type);
  }

  return { ok: true, role, type };
}

// Remove atributos de acessibilidade
export function clearOverlayRole(element: HTMLElement, type: DynObj, options: DynObj) {
  options = options || {};
  if (!element) return { ok: false, reason: 'no-element' };

  element.removeAttribute('role');
  element.removeAttribute('aria-modal');
  element.removeAttribute('aria-label');
  element.removeAttribute('aria-labelledby');
  element.removeAttribute('aria-describedby');

  // Anuncia fechamento
  if (options.announce !== false) {
    announceClose(type);
  }

  return { ok: true };
}

// Marca elementos como hidden para screen readers
export function hideFromScreenReaders(elements: DynObj) {
  if (!elements) return { ok: false };

  const list = Array.isArray(elements) ? elements : [elements];
  const modified = [];

  for (let i = 0; i < list.length; i++) {
    const el = list[i];
    if (el && !el.hasAttribute('aria-hidden')) {
      el.setAttribute('aria-hidden', 'true');
      el.dataset.overlayHidden = 'true';
      modified.push(el);
    }
  }

  return { ok: true, count: modified.length };
}

// Restaura elementos para screen readers
export function showToScreenReaders(elements: DynObj) {
  if (!elements) return { ok: false };

  const list = Array.isArray(elements) ? elements : [elements];
  const restored = [];

  for (let i = 0; i < list.length; i++) {
    const el = list[i];
    if (el && el.dataset.overlayHidden === 'true') {
      el.removeAttribute('aria-hidden');
      delete el.dataset.overlayHidden;
      restored.push(el);
    }
  }

  return { ok: true, count: restored.length };
}

// Configuração
export function getConfig() {
  return Object.assign({}, _config);
}

export function setConfig(newConfig: DynObj) {
  if (newConfig.enabled !== undefined) _config.enabled = newConfig.enabled;
  if (newConfig.politeness) _config.politeness = newConfig.politeness;
  if (newConfig.announceOpen !== undefined) _config.announceOpen = newConfig.announceOpen;
  if (newConfig.announceClose !== undefined) _config.announceClose = newConfig.announceClose;
  if (newConfig.announceRole !== undefined) _config.announceRole = newConfig.announceRole;
  if (newConfig.locale) _config.locale = newConfig.locale;
  return { ok: true, config: Object.assign({}, _config) };
}

// Inicializa módulo
export function init(config: DynObj) {
  if (config) setConfig(config);
  _createAnnouncer();
  return { ok: true };
}

// Cleanup
export function cleanup() {
  if (_announcer) {
    _announcer.remove();
    _announcer = null;
  }
  return { ok: true };
}

export function getMetrics() {
  return Object.assign({}, _metrics);
}

export function healthCheck() {
  const checks = {
    enabled: _config.enabled,
    announcerExists: !!_announcer || typeof document === 'undefined'
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
    announcerExists: !!_announcer,
    metrics: getMetrics(),
    timestamp: Date.now()
  };
}

export default {
  init,
  cleanup,
  announce,
  announceOpen,
  announceClose,
  announceLoading,
  setOverlayRole,
  clearOverlayRole,
  hideFromScreenReaders,
  showToScreenReaders,
  getConfig,
  setConfig,
  getMetrics,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
