// toolbar-wiring/diagnostics.js
// @version 1.1.0-PAB-ES6
// @description Funções de diagnóstico, lifecycle e re-wire listener
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: VERSION, MODULE_ID, state from ./state.js
// IMPORTS: getEventBus from ./helpers.js
// IMPORTS: TOOLBAR_EVENT_NAMES from event-names.js
// PROVIDES: emitWiringEvent(name, data), setupRewireListener(toolbar, wireToolbarFn),
//           info(), healthCheck()
// CONSUMERS: index.js
'use strict';

import { VERSION, MODULE_ID, state } from './state.js';
import { getEventBus } from './helpers.js';
import { TOOLBAR_EVENT_NAMES } from '/core/runtime/constants/event-names.js';

/**
 * Emite evento de lifecycle via EventBus
 * @param {string} eventName - Nome do evento
 * @param {object} data - Payload adicional
 */
export function emitWiringEvent(eventName: string, data: Record<string, unknown>) {
  const eventBus = getEventBus();
  if (!eventBus || !eventBus.emit) return;
  try {
    eventBus.emit(eventName, Object.assign({
      source: MODULE_ID,
      version: VERSION,
      timestamp: Date.now()
    }, data || {}));
  } catch (_e) {
    // EventBus emit falhou — não bloqueia o fluxo
  }
}

/**
 * Configura listener para re-wire automático via toolbar.initialized
 * @param {object} toolbar - Instância da toolbar
 * @param {Function} wireToolbarFn - Referência ao wireToolbar (evita import circular)
 */
export function setupRewireListener(toolbar: Record<string, (...args: unknown[]) => unknown>, wireToolbarFn: (toolbar: Record<string, (...args: unknown[]) => unknown>) => Promise<unknown>) {
  if (state.rewireListenerActive) return;

  const eventBus = getEventBus();
  if (!eventBus || !eventBus.subscribe) return;

  state.toolbarRef = toolbar;

  eventBus.subscribe(TOOLBAR_EVENT_NAMES.INITIALIZED, (detail: Record<string, unknown>) => {
    if (detail && detail.source === MODULE_ID) return;

    if (state.toolbarRef && state.toolbarRef.registerAction) {
      wireToolbarFn(state.toolbarRef as Record<string, (...args: unknown[]) => unknown>).then(() => {}).catch(() => {});
    }
  });

  state.rewireListenerActive = true;
}

/**
 * Retorna info básica do módulo
 */
export function info() {
  return { version: VERSION, moduleId: MODULE_ID };
}

/**
 * Retorna dados do último wiring para healthCheck
 */
export function healthCheck() {
  if (!state.lastWiringResult) {
    return {
      status: 'NOT_WIRED',
      version: VERSION,
      moduleId: MODULE_ID,
      message: 'wireToolbar() não foi executado ainda'
    };
  }

  const failedCount = state.lastWiringResult.failed ? (state.lastWiringResult.failed as string[]).length : 0;
  const wiredCount = state.lastWiringResult.wired ? (state.lastWiringResult.wired as string[]).length : 0;
  const status = failedCount === 0 ? 'HEALTHY' : (wiredCount > 0 ? 'DEGRADED' : 'UNHEALTHY');

  return {
    status,
    version: VERSION,
    moduleId: MODULE_ID,
    wiredCount,
    failedCount,
    wired: state.lastWiringResult.wired || [],
    failed: state.lastWiringResult.failed || [],
    lastWiringAt: state.lastWiringTimestamp,
    rewireListenerActive: state.rewireListenerActive
  };
}
