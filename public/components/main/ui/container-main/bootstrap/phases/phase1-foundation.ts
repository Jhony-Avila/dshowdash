// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (13.3.1-IMPORT-FIX)
// ═══════════════════════════════════════════════════════════════
// MODULE: bootstrap/phases/phase1-foundation
// PURPOSE: Phase 1 do bootstrap — inicializa Logger, Error Handler e GlobalState
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   Logger, createLogger, configure (as configureLogger), injectEventBus (as injectLoggerEventBus) — from '../../utils/logger.js'
//   injectEventBus (as injectErrorEventBus), install (as installErrorHandler) — from '../../utils/error-handler.js'
//   GlobalStateAdapter — from '../../adapters/global-state-adapter.js'
//   registerLoaded — from '../../core/dependency-map.js'
//   BOOTSTRAP_EVENT_NAMES — from '/core/runtime/constants/event-names.js'
//
// PROVIDES:
//   initPhase1(context) — async, retorna { logger, GlobalStateAdapter }
//
// RECEIVES (via init/options): context { config, eventBus, bootMetrics, MODULE_ID }
// EMITS (eventos):
//   BOOTSTRAP_EVENT_NAMES.GLOBAL_ERROR — quando erro global capturado
// LISTENS (eventos): nenhum (instala error handler global)
// WINDOW ACCESS: nenhum
// @changelog v13.3.1-IMPORT-FIX - Fixed: install as installErrorHandler (not installErrorHandler)
// @changelog v13.3.0-IMPORT-FIX - Added missing: configure as configureLogger, installErrorHandler
// ═══════════════════════════════════════════════════════════════
'use strict';

import { Logger, createLogger, configure as configureLogger, injectEventBus as injectLoggerEventBus } from '../../utils/logger.js';
import { injectEventBus as injectErrorEventBus, install as installErrorHandler } from '../../utils/error-handler.js';
import GlobalStateAdapter from '../../adapters/global-state-adapter.js';
import { registerLoaded } from '../../core/dependency-map.js';
import { BOOTSTRAP_EVENT_NAMES } from '/core/runtime/constants/event-names.js';

export const VERSION = '13.3.1-IMPORT-FIX';
export const MODULE_ID = 'main.ui.container-main.bootstrap.phases.phase1-foundation';

export async function initPhase1(context: Record<string, unknown>) {
  const config = context.config as Record<string, unknown>;
  const eventBus = context.eventBus as import("../types.js").ManagerRef | null;
  const bootMetrics = context.bootMetrics as import("../types.js").ManagerRef | null;
  const MODULE_ID = context.MODULE_ID as string;
  
  bootMetrics?.startPhase('phase1');
  
  configureLogger({ level: config.logLevel, enabled: true });
  injectLoggerEventBus(eventBus);
  
  const logger = createLogger(MODULE_ID);
  logger?.debug('Phase 1 starting...');
  registerLoaded('logger');
  
  if (config.captureGlobalErrors) {
    injectErrorEventBus(eventBus);
    installErrorHandler({
      eventBus,
      captureUnhandled: true,
      captureRejections: true,
      onError: (errorInfo: unknown) => {
        logger?.error('Global error:', errorInfo);
        eventBus?.emit(BOOTSTRAP_EVENT_NAMES.GLOBAL_ERROR, errorInfo);
      }
    });
    registerLoaded('error-handler');
  }
  
  if (config.enableGlobalState) {
    // @ts-expect-error strict migration — TS2345
    GlobalStateAdapter.injectEventBus(eventBus);
    GlobalStateAdapter.init({ eventBus, syncOnInit: true });
    registerLoaded('global-state-adapter');
  }
  
  bootMetrics?.endPhase('phase1');
  logger?.debug('Phase 1 ready');
  
  return { logger, GlobalStateAdapter };
}

export default { initPhase1 };
