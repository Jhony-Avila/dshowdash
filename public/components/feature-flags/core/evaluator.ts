// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.3.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.feature-flags.core.evaluator
// PURPOSE: Feature flags evaluator with context-aware flag evaluation
// ───────────────────────────────────────────────────────────────
// @contract SET_CONTEXT - setContext(context) sets evaluation context
// @contract GET_CONTEXT - getContext() returns current context
// @contract EVALUATE - evaluate(flag, context) evaluates single flag
// @contract EVALUATE_ALL - evaluateAll(flags, context) evaluates all flags
// @contract IS_ENABLED - isEnabled(flagName) checks if flag is enabled
// @contract GET_VARIANT - getVariant(flagName) returns flag variant
// @contract GET_VALUE - getValue(flagName, defaultValue) returns flag value
// @contract GET_METRICS - getMetrics() returns evaluator metrics
// @contract RESET_METRICS - resetMetrics() resets all metrics
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: FlagRegistry from ./registry.js
// PROVIDES: FlagEvaluator, setContext, getContext, evaluate, evaluateAll,
//           isEnabled, getVariant, getValue, getMetrics, resetMetrics,
//           healthCheck, info, VERSION, MODULE_ID
// @changelog v2.3.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v2.2.0-ENTERPRISE: Added isEnabled, getVariant, getValue,
//            setContext, getContext (NR-FULL P0)
// ═══════════════════════════════════════════════════════════════
'use strict';

import FlagRegistry from './registry.js';

export const VERSION = '2.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.feature-flags.core.evaluator';

let _context: Record<string, unknown> = {};
let _metrics = {
  evaluations: 0,
  isEnabledCalls: 0,
  getVariantCalls: 0,
  getValueCalls: 0
};

export function setContext(context: Record<string, unknown>): void {
  _context = { ..._context, ...context };
}

export function getContext() {
  return { ..._context };
}

export function evaluate(flag: boolean | ((ctx: Record<string, unknown>) => unknown), context: Record<string, unknown> | null = null): boolean {
  _metrics.evaluations++;
  const evalContext = context || _context;

  if (typeof flag === 'boolean') return flag;
  if (typeof flag === 'function') return !!flag(evalContext);
  return !!flag;
}

export function evaluateAll(flags: Record<string, boolean | ((ctx: Record<string, unknown>) => unknown)>, context: Record<string, unknown> | null = null): Record<string, boolean> {
  const evalContext = context || _context;
  return Object.fromEntries(
    Object.entries(flags).map(([key, val]) => [key, evaluate(val, evalContext)])
  );
}

function _hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function isEnabled(flagName: string): boolean {
  _metrics.isEnabledCalls++;

  const flag = FlagRegistry.get(flagName);
  if (!flag) return false;

  if (!flag.enabled) return false;

  if (flag.percentage !== undefined && flag.percentage < 100) {
    const hash = _hashString(flagName + JSON.stringify(_context));
    const bucket = hash % 100;
    return bucket < flag.percentage;
  }

  return true;
}

export function getVariant(flagName: string): string | null {
  _metrics.getVariantCalls++;

  const flag = FlagRegistry.get(flagName);
  if (!flag) return null;

  return flag.variant ?? null;
}

export function getValue(flagName: string, defaultValue: unknown = null): unknown {
  _metrics.getValueCalls++;

  const flag = FlagRegistry.get(flagName);
  if (!flag) return defaultValue;

  if (flag.value !== undefined && flag.value !== null) {
    return flag.value;
  }

  return flag.enabled ?? defaultValue;
}

export function getMetrics() {
  return { ..._metrics };
}

export function resetMetrics() {
  _metrics = {
    evaluations: 0,
    isEnabledCalls: 0,
    getVariantCalls: 0,
    getValueCalls: 0
  };
}

export function healthCheck() {
  const checks = {
    available: true,
    registryConnected: typeof FlagRegistry.get === 'function'
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    status: passed === total ? 'HEALTHY' : 'DEGRADED',
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    metrics: getMetrics(),
    contextKeys: Object.keys(_context),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    metrics: getMetrics(),
    contextKeys: Object.keys(_context),
    healthCheck: healthCheck(),
    timestamp: Date.now()
  };
}

const FlagEvaluator = {
  evaluate,
  evaluateAll,
  isEnabled,
  getVariant,
  getValue,
  setContext,
  getContext,
  getMetrics,
  resetMetrics,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};

export { FlagEvaluator };
export default FlagEvaluator;
