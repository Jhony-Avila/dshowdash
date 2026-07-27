// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.5.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.footer.core.runtime-context-handler
// PURPOSE: Footer RuntimeContext Handler - Integration with kernel events
// ───────────────────────────────────────────────────────────────
// @contract MODULE_ID - module constant identifier
// @contract VERSION - module constant version
// @contract INJECT_PORTS - injectPorts() for dependency injection
// @contract GET_PORTS - getPorts() returns ports snapshot
// @contract SETUP - setup() configures event listeners
// @contract CLEANUP - cleanup() removes event listeners
// @contract HANDLE_UPDATED - handleRuntimeContextUpdated() handles updates
// @contract HANDLE_READY - handleRuntimeContextReady() handles ready event
// @contract HEALTH - healthCheck() returns health status
// @contract INFO - info() returns module information
// @contract GET_METRICS - getMetrics() returns handler metrics
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from /assets/js/core/logger-global/index.js
//   KERNEL_RUNTIME_EVENTS from /core/runtime/events/catalog/kernel.events.js
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   setup() — exported function
//   cleanup() — exported function
//   handleRuntimeContextUpdated() — exported function
//   handleRuntimeContextReady() — exported function
//   healthCheck() — exported function
//   getMetrics() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos): (none)
// LISTENS (eventos): kernel:runtime-context:updated, kernel:runtime-context:ready
// WINDOW ACCESS: window.Core.windowAdapter, window.RuntimeContext (fallback)
// ───────────────────────────────────────────────────────────────
// @changelog v1.5.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.4.0-P0-ENTERPRISE: Migrated to Ports pattern for EventBus
// @changelog v1.3.0-P18: Strings soltas substituidas por constantes P18
// @changelog v1.2.0-STEP8: window.RuntimeContext migrado para _resolveRuntimeContext()
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createLogger } from '/assets/js/core/logger-global/index.js';
import { KERNEL_RUNTIME_EVENTS } from '/core/runtime/events/catalog/kernel.events.js';
import { createUiPorts } from '/core/runtime/ports-profiles.js';

export const MODULE_ID = 'footer/runtime-context-handler';
export const VERSION = '1.5.0-P2-ENTERPRISE';

// P0 ENTERPRISE: Ports-based EventBus access
const Ports = createUiPorts({ moduleId: MODULE_ID });
let _portsInitialized = false;

function _initPorts() {
  if (_portsInitialized) return;
  Ports.init();
  _portsInitialized = true;
}

function _getEventBus() {
  _initPorts();
  return Ports.get('eventBus');
}

export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _logger = createLogger(MODULE_ID);

// ═══════════════════════════════════════════════════════════════
// RUNTIME CONTEXT RESOLVER (v1.2.0-STEP8)
// Canal oficial: windowAdapter.get → window fallback
// ═══════════════════════════════════════════════════════════════

function _resolveRuntimeContext() {
  if (typeof window === 'undefined') return null;
  // 1. windowAdapter (canal oficial)
  if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    const rc = window.Core.windowAdapter.get('RuntimeContext');
    if (rc) return rc;
  }
  // 2. window fallback
  return window.RuntimeContext || null;
}

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

// @ts-expect-error strict migration — TS7034
let _cleanups = [];
let _lastSnapshot: unknown = null;
const _metrics = {
  updatesReceived: 0,
  readyReceived: 0,
  modeChanges: 0,
  errorsCount: 0
};

// ═══════════════════════════════════════════════════════════════
// LOGGING
// ═══════════════════════════════════════════════════════════════

function _log(level: string, msg: string, data?: Record<string,unknown>) {
  const context = data ? { data } : {};
  if (level === 'error') _logger.error(msg, context);
  else if (level === 'warn') _logger.warn(msg, context);
  else _logger.debug(msg, context);
}

// ═══════════════════════════════════════════════════════════════
// FOOTER ELEMENT HELPERS
// ═══════════════════════════════════════════════════════════════

const FOOTER_SELECTORS = [
  '.dsd-footer',
  'footer',
  '[data-component="footer"]',
  '#footer-root'
];

function _getFooterElement() {
  for (let i = 0; i < FOOTER_SELECTORS.length; i++) {
    const el = document.querySelector(FOOTER_SELECTORS[i]);
    if (el) return el;
  }
  return null;
}

function _updateFooterAttributes(snapshot: Record<string,unknown>) {
  const footer = _getFooterElement();
  if (!footer) return false;

  // @ts-expect-error TS migration - TS2345
  footer.setAttribute('data-kernel-mode', snapshot.mode || 'UNKNOWN');
  footer.setAttribute('data-kernel-ready', snapshot.ready ? 'true' : 'false');
  footer.setAttribute('data-kernel-authenticated', snapshot.authenticated ? 'true' : 'false');

  // Remover classes de modo anteriores
  const classList = footer.className.split(' ');
  for (let i = classList.length - 1; i >= 0; i--) {
    if (classList[i].indexOf('kernel-mode-') === 0) {
      footer.classList.remove(classList[i]);
    }
  }

  // Adicionar classe do modo atual
  footer.classList.add(`kernel-mode-${snapshot.mode || 'UNKNOWN'}`);

  return true;
}

// ═══════════════════════════════════════════════════════════════
// MODE HANDLERS
// ═══════════════════════════════════════════════════════════════

function _handleMaintenanceMode(snapshot: Record<string,unknown>) {
  _log('warn', 'Sistema em MAINTENANCE');

  const footer = _getFooterElement();
  if (!footer) return;

  footer.classList.add('footer-maintenance');

  const statusEl = footer.querySelector('.footer-status-indicator, .dsd-footer__status');
  if (statusEl) {
    statusEl.setAttribute('data-status', 'maintenance');
    statusEl.textContent = 'Sistema em manutencao';
  }
}

function _handleFailedMode(snapshot: Record<string,unknown>) {
  _log('error', 'Sistema em FAILED');

  const footer = _getFooterElement();
  if (!footer) return;

  footer.classList.add('footer-failed');

  const statusEl = footer.querySelector('.footer-status-indicator, .dsd-footer__status');
  if (statusEl) {
    statusEl.setAttribute('data-status', 'failed');
    statusEl.textContent = 'Erro no sistema';
  }
}

function _handleDegradedMode(snapshot: Record<string,unknown>) {
  _log('warn', 'Sistema em DEGRADED');

  const footer = _getFooterElement();
  if (!footer) return;

  footer.classList.add('footer-degraded');

  const statusEl = footer.querySelector('.footer-status-indicator, .dsd-footer__status');
  if (statusEl) {
    statusEl.setAttribute('data-status', 'degraded');
  }
}

function _handleNormalMode(snapshot: Record<string,unknown>) {
  const footer = _getFooterElement();
  if (!footer) return;

  footer.classList.remove('footer-maintenance', 'footer-failed', 'footer-degraded');

  const statusEl = footer.querySelector('.footer-status-indicator, .dsd-footer__status');
  if (statusEl) {
    statusEl.setAttribute('data-status', 'normal');
    statusEl.textContent = '';
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN HANDLERS
// ═══════════════════════════════════════════════════════════════

export function handleRuntimeContextUpdated(data: Record<string,unknown>) {
  try {
    const snapshot = data && data.snapshot ? data.snapshot : null;
    const trigger = data && data.trigger ? data.trigger : 'unknown';

    if (!snapshot) {
      _log('warn', 'RuntimeContext update sem snapshot');
      return;
    }

    _metrics.updatesReceived++;

    const previousSnapshot = _lastSnapshot;
    _lastSnapshot = snapshot;

    _log('info', 'RuntimeContext updated', {
      trigger,
      // @ts-expect-error TS migration - TS2339
      mode: snapshot.mode
    });

    // @ts-expect-error TS migration - TS2345
    _updateFooterAttributes(snapshot);

    // @ts-expect-error TS migration - TS2339
    const previousMode = previousSnapshot ? previousSnapshot.mode : null;
    // @ts-expect-error TS migration - TS2339
    if (snapshot.mode !== previousMode) {
      _metrics.modeChanges++;

      // @ts-expect-error TS migration - TS2339
      switch (snapshot.mode) {
        case 'MAINTENANCE':
          // @ts-expect-error TS migration - TS2345
          _handleMaintenanceMode(snapshot);
          break;
        case 'FAILED':
          // @ts-expect-error TS migration - TS2345
          _handleFailedMode(snapshot);
          break;
        case 'DEGRADED':
          // @ts-expect-error TS migration - TS2345
          _handleDegradedMode(snapshot);
          break;
        case 'NORMAL':
          // @ts-expect-error TS migration - TS2345
          _handleNormalMode(snapshot);
          break;
      }
    }

  } catch (e: any) {
    _metrics.errorsCount++;
    _log('error', 'handleRuntimeContextUpdated error', e.message);
  }
}

export function handleRuntimeContextReady(data: Record<string,unknown>) {
  try {
    const snapshot = data && data.snapshot ? data.snapshot : null;

    _metrics.readyReceived++;
    _lastSnapshot = snapshot;

    _log('info', 'RuntimeContext ready', {
      // @ts-expect-error TS migration - TS2339
      mode: snapshot ? snapshot.mode : 'N/A'
    });

    if (snapshot) {
      // @ts-expect-error TS migration - TS2345
      _updateFooterAttributes(snapshot);

      // @ts-expect-error TS migration - TS2339
      if (snapshot.mode === 'MAINTENANCE') {
        // @ts-expect-error TS migration - TS2345
        _handleMaintenanceMode(snapshot);
      // @ts-expect-error TS migration - TS2339
      } else if (snapshot.mode === 'FAILED') {
        // @ts-expect-error TS migration - TS2345
        _handleFailedMode(snapshot);
      // @ts-expect-error TS migration - TS2339
      } else if (snapshot.mode === 'DEGRADED') {
        // @ts-expect-error TS migration - TS2345
        _handleDegradedMode(snapshot);
      }
    }

  } catch (e: any) {
    _metrics.errorsCount++;
    _log('error', 'handleRuntimeContextReady error', e.message);
  }
}

// ═══════════════════════════════════════════════════════════════
// SETUP / CLEANUP
// ═══════════════════════════════════════════════════════════════

export function setup() {
  const eb = _getEventBus();

  if (!eb || !eb.on) {
    _log('warn', 'EventBus nao disponivel via Ports - tentando RuntimeContext.subscribeWithReplay');

    const rc = _resolveRuntimeContext();
    if (rc && rc.subscribeWithReplay) {
      const unsub = rc.subscribeWithReplay((snapshot: Record<string,unknown>, data: Record<string,unknown>) => {
        handleRuntimeContextUpdated({ snapshot, trigger: data ? data.trigger : 'subscription' });
      }, { replayReady: true });

      if (unsub) _cleanups.push(unsub);
      _log('info', 'Usando RuntimeContext.subscribeWithReplay');
      return { ok: true, method: 'subscribeWithReplay' };
    }

    return { ok: false, error: 'EventBus not available' };
  }

  const unsub1 = eb.on(KERNEL_RUNTIME_EVENTS.RUNTIME_CONTEXT_UPDATED, handleRuntimeContextUpdated);
  const unsub2 = eb.on(KERNEL_RUNTIME_EVENTS.RUNTIME_CONTEXT_READY, handleRuntimeContextReady);

  if (unsub1) _cleanups.push(unsub1);
  if (unsub2) _cleanups.push(unsub2);

  _log('info', `RuntimeContext handlers configurados (${_cleanups.length} listeners)`);

  const rc = _resolveRuntimeContext();
  if (rc && rc.hasEmittedReady && rc.hasEmittedReady()) {
    const snapshot = rc.getSnapshot();
    handleRuntimeContextReady({ snapshot });
    _log('info', 'Replay do estado inicial executado');
  }

  return { ok: true, listeners: _cleanups.length };
}

export function cleanup() {
  for (let i = 0; i < _cleanups.length; i++) {
    try {
      // @ts-expect-error strict migration — TS7005
      if (typeof _cleanups[i] === 'function') {
        // @ts-expect-error strict migration — TS7005
        _cleanups[i]();
      }
    } catch (e: any) {
      _log('error', 'Cleanup error', e.message);
    }
  }
  _cleanups = [];
  _lastSnapshot = null;
  _log('info', 'RuntimeContext handlers removidos');
}

// ═══════════════════════════════════════════════════════════════
// DIAGNOSTICS
// ═══════════════════════════════════════════════════════════════

export function healthCheck() {
  return {
    status: _cleanups.length > 0 ? 'HEALTHY' : 'NOT_CONFIGURED',
    moduleId: MODULE_ID,
    version: VERSION,
    p0Enterprise: true,
    portsInitialized: _portsInitialized,
    listenersCount: _cleanups.length,
    lastSnapshot: _lastSnapshot,
    metrics: Object.assign({}, _metrics),
    timestamp: Date.now()
  };
}

export function getMetrics() {
  return Object.assign({}, _metrics);
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    configured: _cleanups.length > 0,
    listenersCount: _cleanups.length,
    metrics: Object.assign({}, _metrics),
    lastSnapshot: _lastSnapshot ? {
      // @ts-expect-error TS migration - TS2339
      mode: _lastSnapshot.mode,
      // @ts-expect-error TS migration - TS2339
      authenticated: _lastSnapshot.authenticated
    } : null
  };
}

// ═══════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════

export default {
  MODULE_ID,
  VERSION,
  setup,
  cleanup,
  handleRuntimeContextUpdated,
  handleRuntimeContextReady,
  healthCheck,
  getMetrics,
  info,
  injectPorts,
  getPorts
};
