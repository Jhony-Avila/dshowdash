// Migrado para TypeScript: 2026-02-25
// Capability Registry - Registro centralizado de capabilities
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// @version 1.0.0
// @description Registro, consulta e validacao de capabilities do sistema
// @melhoria #05 - Capabilities formalizadas com metadata
'use strict';

export const MODULE_ID = 'capability-registry' as const;
export const VERSION = '1.0.0' as const;

export interface CapabilityConfig {
  enabled?: boolean;
  description?: string;
  requiredMode?: string | string[] | null;
  requiredAuth?: number;
  category?: string;
}

export interface Capability {
  name: string;
  enabled: boolean;
  description: string;
  requiredMode: string | string[] | null;
  requiredAuth: number;
  registeredAt: number;
  category: string;
}

export interface CapabilityMap {
  [name: string]: Capability;
}

export interface CapabilityRegistryInfo {
  moduleId: typeof MODULE_ID;
  version: typeof VERSION;
  total: number;
  enabled: number;
  disabled: number;
  changeCount: number;
}

let _capabilities: CapabilityMap = {};
let _changeCount: number = 0;

export function register(name: string, config?: CapabilityConfig): boolean {
  config = config || {};
  _capabilities[name] = {
    name,
    enabled: config.enabled !== false,
    description: config.description || '',
    requiredMode: config.requiredMode || null,
    requiredAuth: config.requiredAuth || 0,
    registeredAt: Date.now(),
    category: config.category || 'general'
  };
  _changeCount++;
  return true;
}

export function unregister(name: string): boolean {
  if (_capabilities[name]) {
    delete _capabilities[name];
    _changeCount++;
    return true;
  }
  return false;
}

export function isEnabled(name: string): boolean {
  const cap = _capabilities[name];
  return cap ? cap.enabled : false;
}

export function setEnabled(name: string, enabled: boolean): boolean {
  if (_capabilities[name]) {
    _capabilities[name].enabled = !!enabled;
    _changeCount++;
    return true;
  }
  return false;
}

export function getCapability(name: string): Capability | null {
  return _capabilities[name] || null;
}

export function getAllCapabilities(): CapabilityMap {
  return Object.assign({}, _capabilities);
}

export function getEnabledCapabilities(): CapabilityMap {
  const result: CapabilityMap = {};
  const names = Object.keys(_capabilities);
  for (let i = 0; i < names.length; i++) {
    if (_capabilities[names[i]].enabled) {
      result[names[i]] = _capabilities[names[i]];
    }
  }
  return result;
}

export function getByCategory(category: string): CapabilityMap {
  const result: CapabilityMap = {};
  const names = Object.keys(_capabilities);
  for (let i = 0; i < names.length; i++) {
    if (_capabilities[names[i]].category === category) {
      result[names[i]] = _capabilities[names[i]];
    }
  }
  return result;
}

export function checkModeAccess(name: string, currentMode: string): boolean {
  const cap = _capabilities[name];
  if (!cap) return false;
  if (!cap.requiredMode) return cap.enabled;
  if (!cap.enabled) return false;
  const allowedModes: string[] = Array.isArray(cap.requiredMode) ? cap.requiredMode : [cap.requiredMode];
  return allowedModes.indexOf(currentMode) !== -1;
}

export function checkAuthAccess(name: string, authLevel: number): boolean {
  const cap = _capabilities[name];
  if (!cap) return false;
  if (!cap.enabled) return false;
  return authLevel >= cap.requiredAuth;
}

export function getCount(): number {
  return Object.keys(_capabilities).length;
}

export function reset(): void {
  _capabilities = {};
  _changeCount = 0;
}

export function info(): CapabilityRegistryInfo {
  const total = Object.keys(_capabilities).length;
  const enabled = Object.keys(getEnabledCapabilities()).length;
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    total,
    enabled,
    disabled: total - enabled,
    changeCount: _changeCount
  };
}

export default {
  MODULE_ID,
  VERSION,
  register,
  unregister,
  isEnabled,
  setEnabled,
  getCapability,
  getAllCapabilities,
  getEnabledCapabilities,
  getByCategory,
  checkModeAccess,
  checkAuthAccess,
  getCount,
  reset,
  info
};
