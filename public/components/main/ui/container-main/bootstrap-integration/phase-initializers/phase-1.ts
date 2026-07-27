// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (13.7.0-IMPORT-FIX)
// ═══════════════════════════════════════════════════════════════
// MODULE: bootstrap-integration/phase-initializers/phase-1
// PURPOSE: Phase 1 do bootstrap-integration — Logger, ErrorHandler,
//          GlobalState com exposicao global de Logger
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger, configure, injectEventBus (as injectLoggerEventBus), Logger — from '../../utils/logger.js'
//   install (as installErrorHandler), injectEventBus (as injectErrorEventBus) — from '../../utils/error-handler.js'
//   GlobalStateAdapter — from '../../adapters/global-state-adapter.js'
//   registerLoaded — from '../../core/dependency-map.js'
//   MODULE_ID — from '../constants.js'
//   BOOTSTRAP_EVENT_NAMES — from '/core/runtime/constants/event-names.js'
//   isStrict, recordViolation — from '/core/runtime/enterprise/strict-mode.js'
//
// PROVIDES:
//   initPhase1(context) — async, retorna { logger }
//
// RECEIVES (via init/options): context { config, eventBus, bootMetrics, managers }
// EMITS (eventos):
//   BOOTSTRAP_EVENT_NAMES.GLOBAL_ERROR — quando erro global capturado
// LISTENS (eventos): nenhum (instala error handler global)
// WINDOW ACCESS:
//   (window as any).Logger — exposicao global do Logger (controlled)
//   (window as any).LoggerGlobal — alias global do Logger (controlled)
// ═══════════════════════════════════════════════════════════════
// @version 13.7.0-IMPORT-FIX
// @changelog v13.7.0-IMPORT-FIX - Fixed missing imports: configure from logger.js, install from error-handler.js
// @changelog v13.5.0-STRICT-MODE - Migração NR-FULL strict mode com recordViolation
// @changelog v13.4.0-LOG-VERBOSITY-AAA - Debug phase start/end são plumbing interno
'use strict';

import { createLogger, configure as configureLogger, injectEventBus as injectLoggerEventBus, Logger } from '../../utils/logger.js';
import { install as installErrorHandler, injectEventBus as injectErrorEventBus } from '../../utils/error-handler.js';
import GlobalStateAdapter from '../../adapters/global-state-adapter.js';
import { registerLoaded } from '../../core/dependency-map.js';
import { MODULE_ID } from '../constants.js';
import { BOOTSTRAP_EVENT_NAMES } from '/core/runtime/constants/event-names.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';

const PHASE_MODULE_ID = 'bootstrap-integration:phase-1';
export const VERSION = '13.7.0-IMPORT-FIX';

export async function initPhase1(context: Record<string, unknown>) {
  const config = context.config as Record<string, unknown>;
  const eventBus = context.eventBus as import("../types.js").ManagerRef | null;
  const bootMetrics = context.bootMetrics as import("../types.js").ManagerRef | null;
  const managers = context.managers as import("../types.js").ManagerRef;

  bootMetrics?.startPhase('phase1');

  configureLogger({ level: config.logLevel, enabled: true });
  injectLoggerEventBus(eventBus);
  const logger = createLogger(MODULE_ID);
  managers.set('logger', logger);
  // v13.4.0: debug — phase start/end are internal plumbing, Bootstrap complete summarizes all
  logger.debug('Phase 1 starting...');
  registerLoaded('logger');

  // Controlled window exposure with violation tracking in strict mode
  if (typeof window !== 'undefined') {
    // These are intentional global exposures for developer ergonomics
    // In strict mode, we still expose but track for audit
    if (isStrict()) {
      recordViolation('WINDOW_LOGGER_EXPOSURE', { module: PHASE_MODULE_ID, intentional: true });
    }
    (window as any).Logger = Logger;
    (window as any).LoggerGlobal = Logger;
  }

  if (config.captureGlobalErrors) {
    injectErrorEventBus(eventBus);
    installErrorHandler({
      eventBus,
      captureUnhandled: true,
      captureRejections: true,
      onError: (errorInfo: unknown) => {
        logger.error('Global error:', errorInfo);
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

  return { logger };
}

export function info() {
  return {
    moduleId: PHASE_MODULE_ID,
    version: VERSION,
    phase: 1,
    provides: ['logger', 'error-handler', 'global-state-adapter'],
    strictMode: isStrict()
  };
}

export default { initPhase1, info };
