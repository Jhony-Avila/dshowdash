// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.3.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.feature-flags.core.registry
// PURPOSE: Feature flags registry for flag configuration management
// ───────────────────────────────────────────────────────────────
// @contract REGISTER - register(key, config) registers new flag
// @contract UNREGISTER - unregister(key) removes flag from registry
// @contract GET - get(key) returns flag configuration
// @contract HAS - has(key) checks if flag exists
// @contract LIST - list() returns all flag keys
// @contract GET_ALL - getAll() returns all flags with configurations
// @contract CLEAR - clear() removes all flags
// @contract ENABLE - enable(key) enables a flag
// @contract DISABLE - disable(key) disables a flag
// @contract UPDATE - update(key, config) updates flag configuration
// @contract SET_PERCENTAGE - setPercentage(key, percentage) sets rollout percentage
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: none
// PROVIDES: FlagRegistry, register, unregister, get, has, list, getAll,
//           clear, enable, disable, update, setPercentage, healthCheck,
//           info, VERSION, MODULE_ID
// @changelog v2.3.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v2.2.0-ENTERPRISE: Added enable, disable, update, setPercentage,
//            getAll (NR-FULL P0)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '2.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.feature-flags.core.registry';

interface FlagConfig {
  enabled: boolean;
  percentage: number;
  variant: string | null;
  value: unknown;
  metadata: Record<string, unknown>;
  registeredAt: number;
  updatedAt: number;
  payload?: unknown;
  [key: string]: unknown;
}

const _flags: Map<string, FlagConfig> = new Map();

export function register(key: string, config: Partial<FlagConfig>): boolean {
  const flagConfig = {
    enabled: config?.enabled ?? false,
    percentage: config?.percentage ?? 100,
    variant: config?.variant ?? null,
    value: config?.value ?? null,
    metadata: config?.metadata ?? {},
    registeredAt: Date.now(),
    updatedAt: Date.now()
  };
  _flags.set(key, flagConfig);
  return true;
}

export function unregister(key: string): boolean {
  return _flags.delete(key);
}

export function get(key: string): FlagConfig | undefined {
  return _flags.get(key);
}

export function has(key: string): boolean {
  return _flags.has(key);
}

export function list() {
  return Array.from(_flags.keys());
}

export function getAll(): Record<string, FlagConfig> {
  const result: Record<string, FlagConfig> = {};
  _flags.forEach((value, key) => {
    result[key] = { ...value };
  });
  return result;
}

export function clear() {
  _flags.clear();
}

export function enable(key: string): boolean {
  const flag = _flags.get(key);
  if (!flag) {
    register(key, { enabled: true });
    return true;
  }
  flag.enabled = true;
  flag.updatedAt = Date.now();
  _flags.set(key, flag);
  return true;
}

export function disable(key: string): boolean {
  const flag = _flags.get(key);
  if (!flag) {
    register(key, { enabled: false });
    return true;
  }
  flag.enabled = false;
  flag.updatedAt = Date.now();
  _flags.set(key, flag);
  return true;
}

export function update(key: string, config: Partial<FlagConfig>): boolean {
  const flag = _flags.get(key);
  if (!flag) {
    return register(key, config);
  }
  const updated = {
    ...flag,
    ...config,
    updatedAt: Date.now()
  };
  _flags.set(key, updated);
  return true;
}

export function setPercentage(key: string, percentage: number): boolean {
  const flag = _flags.get(key);
  const safePercentage = Math.max(0, Math.min(100, percentage));

  if (!flag) {
    register(key, { enabled: true, percentage: safePercentage });
    return true;
  }

  flag.percentage = safePercentage;
  flag.updatedAt = Date.now();
  _flags.set(key, flag);
  return true;
}

export function healthCheck() {
  const checks = {
    registryExists: true,
    hasFlagsMap: _flags instanceof Map
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    status: passed === total ? 'HEALTHY' : 'DEGRADED',
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    flagCount: _flags.size,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    flagCount: _flags.size,
    flags: list(),
    healthCheck: healthCheck(),
    timestamp: Date.now()
  };
}

const FlagRegistry = {
  register,
  unregister,
  get,
  has,
  list,
  getAll,
  clear,
  enable,
  disable,
  update,
  setPercentage,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};

export { FlagRegistry };
export default FlagRegistry;
