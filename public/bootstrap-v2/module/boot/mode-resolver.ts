// Boot Mode Resolver — Separação Decisão/Execução (Etapa 7)
// @version 1.0.0-STEP7
// @description Funções puras que DECIDEM o kernel mode baseado em dados.
//              O executor EXECUTA a decisão. Eventos INFORMAM o resultado.
//              Princípio: "Bootstrap executa, Contratos decidem, Eventos informam"
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.0.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: KERNEL_MODES from ../../kernel/index.js
// RECEIVES (via function args): boot result data, kernel state
// PROVIDES: resolveBootLoopMode(), resolveBootCrashMode(),
//           resolveBootSuccessMode(), resolveBootFailureMode(),
//           resolveModeFromResult()
// WINDOW ACCESS: None
// SIDE-EFFECTS: None — pure functions only
// ═══════════════════════════════════════════════════════════════
'use strict';

import { KERNEL_MODES } from '../../kernel/index.js';

interface ModeDecision {
  mode: string | null;
  reason: string;
  details?: Record<string, unknown>;
  error?: boolean;
}

interface LoopCheck {
  reason?: string;
  loopDetected?: boolean;
}

interface BootSuccessOptions {
  contextSnapshot?: { degradationCount?: number } | null;
  healthResult?: { status?: string } | null;
  currentMode?: string | null;
}

interface BootResult {
  error?: string;
  errors?: string[];
  success?: boolean;
}

interface UnifiedInput {
  type: string;
  loopCheck?: LoopCheck;
  error?: Error;
  currentMode?: string | null;
  contextSnapshot?: Record<string, unknown>;
  healthResult?: Record<string, unknown>;
  result?: BootResult;
}

var MODULE_ID = 'boot-mode-resolver';
var VERSION = '1.0.0-STEP7';

// ─────────────────────────────────────────────────────────────
// 1. BOOT LOOP DETECTED → FAILED
// ─────────────────────────────────────────────────────────────
// Input: { loopDetected: true, reason: string }
// Decision: Always FAILED — boot loop is unrecoverable
function resolveBootLoopMode(loopCheck: LoopCheck | null): ModeDecision {
  if (!loopCheck || !loopCheck.reason) {
    return { mode: KERNEL_MODES.FAILED, reason: 'Boot loop detected - unknown' };
  }
  return {
    mode: KERNEL_MODES.FAILED,
    reason: 'Boot loop detected - ' + loopCheck.reason
  };
}

// ─────────────────────────────────────────────────────────────
// 2. BOOT CRASHED (unhandled exception) → FAILED
// ─────────────────────────────────────────────────────────────
// Input: { error: Error }
// Decision: Always FAILED — crash is unrecoverable
// Guard: Only if current mode is not already FAILED
function resolveBootCrashMode(error: Error | null, currentMode: string | null): ModeDecision {
  if (currentMode === KERNEL_MODES.FAILED) {
    return { mode: null, reason: 'Already FAILED, no change needed' };
  }
  var message = error && error.message ? error.message : 'unknown';
  return {
    mode: KERNEL_MODES.FAILED,
    reason: 'Boot crashed: ' + message
  };
}

// ─────────────────────────────────────────────────────────────
// 3. BOOT SUCCESS → NORMAL or DEGRADED
// ─────────────────────────────────────────────────────────────
// Input: { contextSnapshot, healthResult, currentMode }
// Decision:
//   - currentMode !== INITIALIZING → no change (already decided)
//   - hasDegradations || healthDegraded → DEGRADED
//   - else → NORMAL
function resolveBootSuccessMode(options: BootSuccessOptions): ModeDecision {
  if (!options) options = {};

  var contextSnapshot = options.contextSnapshot || null;
  var healthResult = options.healthResult || null;
  var currentMode = options.currentMode || null;

  // Guard: only change if still INITIALIZING
  if (currentMode !== KERNEL_MODES.INITIALIZING) {
    return {
      mode: null,
      reason: 'Mode already set to ' + currentMode + ', no change needed'
    };
  }

  // @ts-expect-error strict migration — TS18048
  var hasDegradations = contextSnapshot && contextSnapshot.degradationCount > 0;
  var healthDegraded = healthResult && healthResult.status === 'DEGRADED';

  if (hasDegradations || healthDegraded) {
    return {
      mode: KERNEL_MODES.DEGRADED,
      reason: 'Boot completed with degradations',
      details: {
        hasDegradations: hasDegradations,
        degradationCount: contextSnapshot ? contextSnapshot.degradationCount : 0,
        healthDegraded: healthDegraded,
        healthStatus: healthResult ? healthResult.status : 'unknown'
      }
    };
  }

  return {
    mode: KERNEL_MODES.NORMAL,
    reason: 'Boot completed successfully',
    details: {
      hasDegradations: false,
      degradationCount: 0,
      healthDegraded: false,
      healthStatus: healthResult ? healthResult.status : 'unknown'
    }
  };
}

// ─────────────────────────────────────────────────────────────
// 4. BOOT FAILURE (orchestrator returned success:false) → FAILED
// ─────────────────────────────────────────────────────────────
// Input: { result, currentMode }
// Decision: FAILED unless already FAILED
function resolveBootFailureMode(result: BootResult | null, currentMode: string | null): ModeDecision {
  if (currentMode === KERNEL_MODES.FAILED) {
    return { mode: null, reason: 'Already FAILED, no change needed' };
  }
  var error = result && result.error ? result.error : 'unknown';
  return {
    mode: KERNEL_MODES.FAILED,
    reason: 'Boot failed: ' + error
  };
}

// ─────────────────────────────────────────────────────────────
// 5. UNIFIED RESOLVER — one function to resolve from any result
// ─────────────────────────────────────────────────────────────
// Input: { type: 'loop'|'crash'|'success'|'failure', ...data }
// This is the recommended single entry point
function resolveModeFromResult(input: UnifiedInput | null): ModeDecision {
  if (!input || !input.type) {
    return { mode: null, reason: 'Invalid input: missing type', error: true };
  }

  switch (input.type) {
    case 'loop':
      // @ts-expect-error strict migration — TS2345
      return resolveBootLoopMode(input.loopCheck);

    case 'crash':
      // @ts-expect-error strict migration — TS2345
      return resolveBootCrashMode(input.error, input.currentMode);

    case 'success':
      return resolveBootSuccessMode({
        contextSnapshot: input.contextSnapshot,
        healthResult: input.healthResult,
        currentMode: input.currentMode
      });

    case 'failure':
      // @ts-expect-error strict migration — TS2345
      return resolveBootFailureMode(input.result, input.currentMode);

    default:
      return { mode: null, reason: 'Unknown type: ' + input.type, error: true };
  }
}

// ─────────────────────────────────────────────────────────────
// DIAGNOSTICS
// ─────────────────────────────────────────────────────────────
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    description: 'Pure decision functions for kernel mode resolution',
    principle: 'Bootstrap executes, Contracts decide, Events inform',
    resolvers: ['resolveBootLoopMode', 'resolveBootCrashMode', 'resolveBootSuccessMode', 'resolveBootFailureMode', 'resolveModeFromResult'],
    kernelModes: Object.keys(KERNEL_MODES)
  };
}

export {
  resolveBootLoopMode,
  resolveBootCrashMode,
  resolveBootSuccessMode,
  resolveBootFailureMode,
  resolveModeFromResult,
  info
};

export default {
  resolveBootLoopMode: resolveBootLoopMode,
  resolveBootCrashMode: resolveBootCrashMode,
  resolveBootSuccessMode: resolveBootSuccessMode,
  resolveBootFailureMode: resolveBootFailureMode,
  resolveModeFromResult: resolveModeFromResult,
  info: info
};
