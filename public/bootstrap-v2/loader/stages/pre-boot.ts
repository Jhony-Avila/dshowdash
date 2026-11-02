// Bootstrap-V2 Loader - Pre-Boot Stage
// @version 6.3.0-DOMAIN-PURE
// @changelog v6.3.0-DOMAIN-PURE: (window as any).Logger → _resolveLogger() via windowAdapter → window fallback
// @changelog v6.2.1: Versão anterior
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v6.3.0)
// ═══════════════════════════════════════════════════════════════
// RESOLVES Logger via _resolveLogger():
//   1. windowAdapter.get('Logger') — adapter layer
//   2. (window as any).Logger               — último fallback
// IMPORTS: loader/constants, loader/state, loader/helpers/logger, pre-boot/index
// ═══════════════════════════════════════════════════════════════
'use strict';

import { hasWindow } from '../constants.js';
import { setPreBootOrchestrator, setPreBootResult } from '../state.js';
import type { DynamicInstance } from '../state.js';
import { log } from '../helpers/logger.js';
import { getInstance as getPreBootInstance } from '../../pre-boot/index.js';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.loader.stages.pre-boot';

// v6.3.0: Resolver Logger via windowAdapter → window fallback
function _resolveLogger() {
  if (!hasWindow) return null;
  if (window.Core && (window.Core as any).windowAdapter && (window.Core as any).windowAdapter.get) {
    const resolved = (window.Core as any).windowAdapter.get('Logger');
    if (resolved) return resolved;
  }
  return (window as any).Logger || null;
}

export function executePreBoot() {
  log('info', 'Stage -1: Pre-Boot starting');

  const orchestrator = getPreBootInstance({ logger: _resolveLogger() });
  setPreBootOrchestrator(orchestrator as unknown as DynamicInstance);

  return orchestrator.run().then(function(result) {
    setPreBootResult(result);
    log('info', 'Stage -1: Pre-Boot complete', {
      success: result.success,
      totalTime: result.timing.totalTime
    });
    return result;
  });
}
