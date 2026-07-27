// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (13.2.0-LOG-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: phase-3
// PURPOSE: Bootstrap Phase 3 - Config, DependencyMap, Validator
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   registerLoaded from ../../core/dependency-map.js
//
// PROVIDES:
//   (none)
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { registerLoaded } from '../../core/dependency-map.js';

export const VERSION = '24.5.4-IMPORT-FIX';
export const MODULE_ID = 'main.ui.container-main.bootstrap-integration.phase-initializers.phase-3';

export async function initPhase3(context: Record<string, unknown>) {
  const bootMetrics = context.bootMetrics as import("../types.js").ManagerRef | null;
  const logger = context.logger as import("../types.js").ManagerRef | null;
  
  bootMetrics?.startPhase('phase3');
  // v13.2.0: debug — phase start is internal plumbing
  logger?.debug('Phase 3 starting...');
  
  registerLoaded('config');
  registerLoaded('dependency-map');
  registerLoaded('validator');
  registerLoaded('utils-contract');
  
  bootMetrics?.endPhase('phase3');
}

export default { initPhase3 };
