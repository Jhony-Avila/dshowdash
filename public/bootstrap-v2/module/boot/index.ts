// Boot - Barrel Export
// @version 3.0.0-STEP7
// @changelog v3.0.0-STEP7: Re-export mode-resolver (Etapa 7 — separação decisão/execução)
// DEPENDENCY CONTRACT (v3.0.0) — BARREL FILE
'use strict';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.module.boot';

export { createPhaseStartHandler, createPhaseCompleteHandler } from './lifecycle.js';
export { createBootExecutor } from './executor.js';
export {
  resolveBootLoopMode,
  resolveBootCrashMode,
  resolveBootSuccessMode,
  resolveBootFailureMode,
  resolveModeFromResult
} from './mode-resolver.js';
