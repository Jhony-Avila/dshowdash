// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Runtime Integration - Event Handlers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID from ../constants.js
//   createLogger from /assets/js/core/logger-global/index.js
//   OVERLAY_EVENTS from /core/runtime/events/index.js
//   handleModeChange from ./mode-handler.js
//   * as PermissionGate from ../../overlay-permission-gate.js
//
// PROVIDES:
//   handleRuntimeContextUpdated() — exported function
//   handleRuntimeContextReady() — exported function
//   handleRuntimeReady() — exported function
//   handleRuntimeDegraded() — exported function
//   handleAuthChange() — exported function
//   handleKernelModeChange() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   eventName
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (window as any).OverlayKernel
// ═══════════════════════════════════════════════════════════════
'use strict';

import { VERSION, MODULE_ID } from '../constants.js';
import { createLogger } from '/assets/js/core/logger-global/index.js';
import { OVERLAY_EVENTS } from '/core/runtime/events/catalog/overlay.events.js';
import {
  getCurrentMode,
  setCurrentMode,
  getApplicationKernel,
  getEventBus,
  incrementMetric
} from '../state.js';
import { handleModeChange } from './mode-handler.js';
import * as PermissionGate from '../../overlay-permission-gate.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


const _logger = createLogger(MODULE_ID);

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

function _emit(eventName: string, data: DynObj) {
  const eventBus = getEventBus();
  if (eventBus && eventBus.emit) {
    eventBus.emit(eventName, Object.assign({
      source: MODULE_ID,
      timestamp: Date.now()
    }, data || {}));
  }
}

function _log(level: DynObj, message: string, data?: DynObj) {
  const context = data ? { data } : {};
  if (level === 'error') _logger.error(message, context);
  else if (level === 'warn') _logger.warn(message, context);
  else _logger.debug(message, context);
}

// ============================================================================
// P4: RUNTIME CONTEXT HANDLER
// ============================================================================

/**
 * Handler para kernel.runtime-context.updated
 * P4: Integração com RuntimeContext como fonte única de verdade
 *
 * @param {Object} data - Event payload
 * @param {Object} data.snapshot - RuntimeContext snapshot
 * @param {string} data.trigger - What triggered the update
 */
export function handleRuntimeContextUpdated(data: DynObj) {
  try {
    const snapshot = data && data.snapshot ? data.snapshot : null;
    const trigger = data && data.trigger ? data.trigger : 'unknown';

    if (!snapshot) {
      _log('warn', '[P4] RuntimeContext update sem snapshot');
      return;
    }

    _log('info', '[P4] RuntimeContext updated', {
      trigger,
      mode: snapshot.mode,
      authenticated: snapshot.authenticated
    });

    incrementMetric('modeChanges');

    const currentMode = getCurrentMode();

    // 1. Se modo mudou, processar mudança
    if (snapshot.mode && snapshot.mode !== currentMode) {
      handleModeChange(snapshot.mode, currentMode);
      setCurrentMode(snapshot.mode);
    }

    // 2. Se em MAINTENANCE, fechar overlays não-essenciais
    if (snapshot.maintenance) {
      _handleMaintenanceMode(snapshot);
    }

    // 3. Se FAILED, fechar todos os overlays
    if (snapshot.failed) {
      _handleFailedMode(snapshot);
    }

    // 4. Se auth mudou, re-verificar permissões
    if (trigger === 'auth-change' || !snapshot.authenticated) {
      _handleAuthChangeFromContext(snapshot);
    }

    // 5. Emitir evento interno
    _emit('overlay-kernel:runtime-context-updated', {
      snapshot,
      trigger
    });

  } catch (e: any) {
    _log('error', '[P4] handleRuntimeContextUpdated error', e.message);
  }
}

/**
 * Handler para kernel.runtime-context.ready
 * P4: Sincronizar estado inicial quando RuntimeContext está pronto
 */
export function handleRuntimeContextReady(data: DynObj) {
  try {
    const snapshot = data && data.snapshot ? data.snapshot : null;

    _log('info', '[P4] RuntimeContext ready', {
      mode: snapshot ? snapshot.mode : 'N/A',
      authenticated: snapshot ? snapshot.authenticated : 'N/A'
    });

    // Sincronizar modo inicial
    if (snapshot && snapshot.mode) {
      const currentMode = getCurrentMode();
      if (snapshot.mode !== currentMode) {
        handleModeChange(snapshot.mode, currentMode);
        setCurrentMode(snapshot.mode);
      }
    }

  } catch (e: any) {
    _log('error', '[P4] handleRuntimeContextReady error', e.message);
  }
}

// ============================================================================
// P4: INTERNAL MODE HANDLERS
// ============================================================================

function _handleMaintenanceMode(snapshot: DynObj) {
  _log('warn', '[P4] Sistema em MAINTENANCE - fechando overlays não-essenciais');

  if (typeof window === 'undefined' || !(window as any).OverlayKernel) return;

  const stackResult = (window as any).OverlayKernel.listStack();
  if (!stackResult.ok) return;

  const stack = stackResult.data.stack;
  for (let i = 0; i < stack.length; i++) {
    const overlay = stack[i];
    if (overlay.adapterId !== 'error-modal' && overlay.adapterId !== 'alert-modal') {
      _log('info', `[P4] Closing overlay in MAINTENANCE: ${overlay.handle}`);
      (window as any).OverlayKernel.close(overlay.handle);
    }
  }
}

function _handleFailedMode(snapshot: DynObj) {
  _log('error', '[P4] Sistema em FAILED - fechando TODOS os overlays');

  if (typeof window === 'undefined' || !(window as any).OverlayKernel) return;

  const stackResult = (window as any).OverlayKernel.listStack();
  if (!stackResult.ok) return;

  const stack = stackResult.data.stack;
  for (let i = 0; i < stack.length; i++) {
    const overlay = stack[i];
    _log('info', `[P4] Closing overlay in FAILED: ${overlay.handle}`);
    (window as any).OverlayKernel.close(overlay.handle);
  }
}

function _handleAuthChangeFromContext(snapshot: DynObj) {
  _log('info', '[P4] Auth state from RuntimeContext, re-syncing permissions');

  if (typeof window === 'undefined' || !(window as any).OverlayKernel) return;

  if (!snapshot.authenticated) {
    const stackResult = (window as any).OverlayKernel.listStack();
    if (!stackResult.ok) return;

    const stack = stackResult.data.stack;
    for (let i = 0; i < stack.length; i++) {
      const overlay = stack[i];

      // @ts-expect-error TS migration - TS2554
      const canKeep = PermissionGate.canOpen(overlay.adapterId);
      if (!canKeep) {
        _log('info', `[P4] Closing overlay due to auth change: ${overlay.handle}`);
        (window as any).OverlayKernel.close(overlay.handle);
      }
    }
  }
}

// ============================================================================
// EXISTING EVENT HANDLERS (mantidos para compatibilidade)
// ============================================================================

/**
 * Handler para runtime ready
 * @param {Object} data
 */
export function handleRuntimeReady(data: DynObj) {
  _log('info', 'Runtime ready, syncing mode');

  const applicationKernel = getApplicationKernel();
  const currentMode = getCurrentMode();

  if (applicationKernel && typeof applicationKernel.getMode === 'function') {
    const mode = applicationKernel.getMode();
    if (mode !== currentMode) {
      handleModeChange(mode, currentMode);
    }
  }

  _emit(OVERLAY_EVENTS.KERNEL_READY, {
    version: VERSION,
    mode: getCurrentMode(),
    integratedWithRuntime: true
  });
}

/**
 * Handler para runtime degraded
 * @param {Object} data
 */
export function handleRuntimeDegraded(data: DynObj) {
  _log('warn', 'Runtime degraded', data);

  if (data && data.mode && data.mode !== getCurrentMode()) {
    handleModeChange(data.mode, getCurrentMode());
  }
}

/**
 * Handler para mudança de autenticação (legado)
 * @param {Object} data
 */
export function handleAuthChange(data: DynObj) {
  _log('info', 'Auth state changed, re-syncing permissions');

  if (typeof window === 'undefined' || !(window as any).OverlayKernel) return;

  const stackResult = (window as any).OverlayKernel.listStack();
  if (!stackResult.ok) return;

  const stack = stackResult.data.stack;
  for (let i = 0; i < stack.length; i++) {
    const overlay = stack[i];

    // @ts-expect-error TS migration - TS2554
    const canKeep = PermissionGate.canOpen(overlay.adapterId);
    if (!canKeep) {
      _log('info', `Closing overlay due to auth change: ${overlay.handle}`);
      (window as any).OverlayKernel.close(overlay.handle);
    }
  }
}

/**
 * Handler para mudança de modo do kernel (legado)
 * @param {Object} data
 */
export function handleKernelModeChange(data: DynObj) {
  if (data && data.mode) {
    handleModeChange(data.mode, getCurrentMode());
  }
}

export default {
  // P4: Novos handlers
  handleRuntimeContextUpdated,
  handleRuntimeContextReady,
  // Legado (mantidos para compatibilidade)
  handleRuntimeReady,
  handleRuntimeDegraded,
  handleAuthChange,
  handleKernelModeChange
};
