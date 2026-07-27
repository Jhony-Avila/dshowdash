// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.3.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header-events/handlers/runtime-context
// PURPOSE: Integrates header with Kernel RuntimeContext via EventBus
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MODULE_ID from ../constants.js
//   getPort from ../ports.js
//   log from ../helpers/logger.js
//   safeOn from ../helpers/event-bus.js
//   KERNEL_RUNTIME_EVENTS from /core/runtime/events/catalog/kernel.events.js
// PROVIDES:
//   handleRuntimeContextUpdated(header, data) — applies runtime snapshot to header DOM
//   handleRuntimeContextReady(header, data) — initializes header mode attributes
//   setupRuntimeContextHandlers(headerEvents) — registers RuntimeContext listeners
//   cleanupRuntimeContextHandlers(headerEvents) — removes RuntimeContext listeners
//   default export { handleRuntimeContextUpdated, handleRuntimeContextReady, setupRuntimeContextHandlers, cleanupRuntimeContextHandlers }
// EMITS (eventos):
//   header:runtime-context-updated — after processing RuntimeContext update
// LISTENS (eventos):
//   KERNEL_RUNTIME_EVENTS.RUNTIME_CONTEXT_UPDATED — triggers handleRuntimeContextUpdated
//   KERNEL_RUNTIME_EVENTS.RUNTIME_CONTEXT_READY — triggers handleRuntimeContextReady
// ═══════════════════════════════════════════════════════════════
// Header Events - RuntimeContext Handlers
// @version 1.3.0-ES6
// @changelog v1.3.0-ES6 - Task 10.1 B10: var → const/let
// @changelog v1.2.0-P18 - Strings soltas substituidas por constantes P18
// @description Integração com RuntimeContext via EventBus
'use strict';

import { MODULE_ID } from '../constants.js';
import { getPort } from '../ports.js';
import { log } from '../helpers/logger.js';
import { safeOn } from '../helpers/event-bus.js';
import { KERNEL_RUNTIME_EVENTS } from '/core/runtime/events/catalog/kernel.events.js';

export const VERSION = '1.1.0-ES6';

const HEADER_SELECTOR = '.site-header';

export function handleRuntimeContextUpdated(header: Record<string,unknown>, data: Record<string,unknown>) {
  try {
    const snapshot = data && data.snapshot ? data.snapshot : null;
    const trigger = data && data.trigger ? data.trigger : 'unknown';
    
    if (!snapshot) {
      log('warn', 'RuntimeContext update sem snapshot');
      return;
    }
    
    log('info', '[P3] RuntimeContext updated', {
      trigger,
      // @ts-expect-error TS migration - TS2339
      mode: snapshot.mode,
      // @ts-expect-error TS migration - TS2339
      authenticated: snapshot.authenticated
    });
    
    // @ts-expect-error TS migration - TS2345
    _updateHeaderModeAttributes(header, snapshot);
    
    // @ts-expect-error TS migration - TS2339
    if (snapshot.maintenance) {
      // @ts-expect-error TS migration - TS2345
      _handleMaintenanceMode(header, snapshot);
    }
    
    // @ts-expect-error TS migration - TS2339
    if (snapshot.failed) {
      // @ts-expect-error TS migration - TS2345
      _handleFailedMode(header, snapshot);
    }
    
    if (trigger === 'auth-change') {
      // @ts-expect-error TS migration - TS2345
      _handleAuthChange(header, snapshot);
    }
    
    // @ts-expect-error TS migration - TS2339
    if (header && header.eventBus && typeof header.eventBus.emit === 'function') {
      // @ts-expect-error TS migration - TS2339
      header.eventBus.emit('header:runtime-context-updated', {
        snapshot,
        trigger,
        timestamp: Date.now(),
        source: MODULE_ID
      });
    }
    
  } catch (e: any) {
    log('error', 'handleRuntimeContextUpdated error', e.message);
  }
}

export function handleRuntimeContextReady(header: Record<string,unknown>, data: Record<string,unknown>) {
  try {
    const snapshot = data && data.snapshot ? data.snapshot : null;
    
    log('info', '[P3] RuntimeContext ready', {
      // @ts-expect-error TS migration - TS2339
      mode: snapshot ? snapshot.mode : 'N/A',
      // @ts-expect-error TS migration - TS2339
      authenticated: snapshot ? snapshot.authenticated : 'N/A'
    });
    
    if (snapshot) {
      // @ts-expect-error TS migration - TS2345
      _updateHeaderModeAttributes(header, snapshot);
    }
    
  } catch (e: any) {
    log('error', 'handleRuntimeContextReady error', e.message);
  }
}

function _updateHeaderModeAttributes(header: Record<string,unknown>, snapshot: Record<string,unknown>) {
  try {
    const headerEl = document.querySelector(HEADER_SELECTOR);
    if (!headerEl) {
      log('warn', `[P3] Header element not found: ${HEADER_SELECTOR}`);
      return;
    }
    
    // @ts-expect-error TS migration - TS2345
    headerEl.setAttribute('data-kernel-mode', snapshot.mode || 'UNKNOWN');
    headerEl.setAttribute('data-kernel-ready', snapshot.ready ? 'true' : 'false');
    headerEl.setAttribute('data-kernel-healthy', snapshot.healthy ? 'true' : 'false');
    
    headerEl.classList.remove(
      'kernel-mode-NORMAL',
      'kernel-mode-DEGRADED',
      'kernel-mode-MAINTENANCE',
      'kernel-mode-FAILED',
      'kernel-mode-RECOVERY',
      'kernel-mode-INITIALIZING'
    );
    if (snapshot.mode) {
      headerEl.classList.add(`kernel-mode-${snapshot.mode}`);
    }
    
    log('debug', '[P3] Header attributes updated', { mode: snapshot.mode });
  } catch (e: any) {
    log('error', '_updateHeaderModeAttributes error', e.message);
  }
}

function _handleMaintenanceMode(header: Record<string,unknown>, snapshot: Record<string,unknown>) {
  try {
    log('warn', '[P3] Sistema em modo MAINTENANCE');
    
    if (header && typeof header.showFallback === 'function') {
      header.showFallback('maintenance', 'Sistema em manutenção');
    }
    
    const headerEl = document.querySelector(HEADER_SELECTOR);
    if (headerEl) {
      headerEl.setAttribute('data-maintenance', 'true');
    }
  } catch (e: any) {
    log('error', '_handleMaintenanceMode error', e.message);
  }
}

function _handleFailedMode(header: Record<string,unknown>, snapshot: Record<string,unknown>) {
  try {
    log('error', '[P3] Sistema em modo FAILED');
    
    if (header && typeof header.showFallback === 'function') {
      header.showFallback('error', 'Sistema indisponível');
    }
  } catch (e: any) {
    log('error', '_handleFailedMode error', e.message);
  }
}

function _handleAuthChange(header: Record<string,unknown>, snapshot: Record<string,unknown>) {
  try {
    if (!snapshot.authenticated) {
      const userMenu = header && header.componentsLoader ? 
        // @ts-expect-error TS migration - TS2339
        header.componentsLoader.getComponent('user-menu') : null;
      
      if (userMenu && typeof userMenu.clearUser === 'function') {
        userMenu.clearUser();
        log('info', '[P3] User-menu limpo via RuntimeContext auth-change');
      }
    }
  } catch (e: any) {
    log('error', '_handleAuthChange error', e.message);
  }
}

export function setupRuntimeContextHandlers(headerEvents: unknown) {
  const eb = getPort('eventBus');
  if (!eb) {
    log('warn', 'EventBus não disponível - RuntimeContext handlers não configurados');
    return;
  }
  
  // @ts-expect-error TS migration - TS2339
  const header = headerEvents.header;
  // @ts-expect-error TS migration - TS2339
  const cleanups = headerEvents._runtimeContextCleanups || [];
  // @ts-expect-error TS migration - TS2339
  headerEvents._runtimeContextCleanups = cleanups;
  
  const onUpdated = (data: Record<string,unknown>) => {
    // @ts-expect-error TS migration - TS2339
    if (headerEvents._metrics) {
      // @ts-expect-error TS migration - TS2339
      headerEvents._metrics.runtimeContextUpdateCount = 
        // @ts-expect-error TS migration - TS2339
        (headerEvents._metrics.runtimeContextUpdateCount || 0) + 1;
      // @ts-expect-error TS migration - TS2339
      headerEvents._metrics.lastEventAt = Date.now();
    }
    handleRuntimeContextUpdated(header, data);
  };
  
  const onReady = (data: Record<string,unknown>) => {
    // @ts-expect-error TS migration - TS2339
    if (headerEvents._metrics) {
      // @ts-expect-error TS migration - TS2339
      headerEvents._metrics.runtimeContextReadyCount = 
        // @ts-expect-error TS migration - TS2339
        (headerEvents._metrics.runtimeContextReadyCount || 0) + 1;
    }
    handleRuntimeContextReady(header, data);
  };
  
  const cleanup1 = safeOn(eb, KERNEL_RUNTIME_EVENTS.RUNTIME_CONTEXT_UPDATED, onUpdated);
  const cleanup2 = safeOn(eb, KERNEL_RUNTIME_EVENTS.RUNTIME_CONTEXT_READY, onReady);
  
  if (cleanup1) cleanups.push(typeof cleanup1 === 'function' ? cleanup1 : () => {
    const bus = getPort('eventBus');
    if (bus && bus.off) bus.off(KERNEL_RUNTIME_EVENTS.RUNTIME_CONTEXT_UPDATED, onUpdated);
  });
  
  if (cleanup2) cleanups.push(typeof cleanup2 === 'function' ? cleanup2 : () => {
    const bus = getPort('eventBus');
    if (bus && bus.off) bus.off(KERNEL_RUNTIME_EVENTS.RUNTIME_CONTEXT_READY, onReady);
  });
  
  log('info', `[P3] RuntimeContext handlers configurados (${cleanups.length} listeners)`);
}

export function cleanupRuntimeContextHandlers(headerEvents: unknown) {
  // @ts-expect-error TS migration - TS2339
  const cleanups = headerEvents._runtimeContextCleanups || [];
  cleanups.forEach((cleanup: () => void) => {
    try { if (typeof cleanup === 'function') cleanup(); } catch (e: any) { }
  });
  // @ts-expect-error TS migration - TS2339
  headerEvents._runtimeContextCleanups = [];
  log('debug', '[P3] RuntimeContext handlers cleanup concluído');
}

export default {
  handleRuntimeContextUpdated,
  handleRuntimeContextReady,
  setupRuntimeContextHandlers,
  cleanupRuntimeContextHandlers
};
