// UI Orchestrator - Registry Manifest
// DEPENDENCY CONTRACT — UI Orchestrator module
// @version 2.0.0-PORTSFACTORY
// @changelog v2.0.0-PORTSFACTORY - Migração para PortsFactory (elimina window.Logger)
// @changelog v1.1.0-ENTERPRISE - Logger fallback pattern
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

const MODULE_ID = 'core.ui-orchestrator.registry.manifest';
const VERSION = '2.0.0-P2-ENTERPRISE';

const Ports = createCorePorts({ moduleId: MODULE_ID });

const _initPorts = () => { Ports.init(); };
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

let _portsInitialized = false;

const _log = (level: string, ...args: unknown[]) => {
  const logger = _getPort('logger');
  if (logger?.[level]) logger[level](`[${MODULE_ID}]`, ...args);
};

const ComponentStatus = { PENDING: 'pending', LOADING: 'loading', READY: 'ready', ERROR: 'error', DISABLED: 'disabled' };
const ComponentType = { CORE: 'core', FEATURE: 'feature', WIDGET: 'widget', LAYOUT: 'layout', UTILITY: 'utility' };

const manifest = new Map();
const statusCallbacks = new Map();

const register = (componentId: string, config: Record<string, unknown>) => {
  if (!componentId || typeof componentId !== 'string') {
    _log('error', 'ID de componente inválido');
    return false;
  }
  const entry = {
    id: componentId, type: config.type || ComponentType.FEATURE, status: ComponentStatus.PENDING,
    module: config.module || null, dependencies: config.dependencies || [], priority: config.priority || 50,
    lazy: config.lazy !== false, metadata: config.metadata || {}, registeredAt: Date.now()
  };
  manifest.set(componentId, entry);
  notifyStatusChange(componentId, ComponentStatus.PENDING);
  return true;
};

const unregister = (componentId: string) => {
  if (!manifest.has(componentId)) return false;
  manifest.delete(componentId);
  statusCallbacks.delete(componentId);
  return true;
};

const get = (componentId: string) => manifest.get(componentId) || null;
const getAll = () => Array.from(manifest.values());
const getByType = (type: string) => Array.from(manifest.values()).filter((entry) => entry.type === type);
const getByStatus = (status: string) => Array.from(manifest.values()).filter((entry) => entry.status === status);

const setStatus = (componentId: string, status: string) => {
  const entry = manifest.get(componentId);
  if (!entry) return false;
  entry.status = status;
  entry.updatedAt = Date.now();
  manifest.set(componentId, entry);
  notifyStatusChange(componentId, status);
  return true;
};

const onStatusChange = (componentId: string, callback: (status: string, id: string) => void) => {
  if (typeof callback !== 'function') return () => {};
  if (!statusCallbacks.has(componentId)) statusCallbacks.set(componentId, []);
  statusCallbacks.get(componentId).push(callback);
  return () => {
    const callbacks = statusCallbacks.get(componentId);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) callbacks.splice(index, 1);
    }
  };
};

const notifyStatusChange = (componentId: string, status: string) => {
  const callbacks = statusCallbacks.get(componentId);
  if (!callbacks) return;
  for (const callback of callbacks) {
    try { callback(status, componentId); }
    catch (err) { _log('error', 'Erro em callback de status:', err); }
  }
};

const has = (componentId: string) => manifest.has(componentId);
const count = () => manifest.size;
const clear = () => { manifest.clear(); statusCallbacks.clear(); };

const getLoadOrder = () => {
  return Array.from(manifest.values())
    .filter((entry) => entry.status !== ComponentStatus.DISABLED)
    .sort((a, b) => {
      if (a.type === ComponentType.CORE && b.type !== ComponentType.CORE) return -1;
      if (b.type === ComponentType.CORE && a.type !== ComponentType.CORE) return 1;
      return b.priority - a.priority;
    });
};

const resolveDependencies = (componentId: string) => {
  const entry = manifest.get(componentId);
  if (!entry) return [];
  const resolved: string[] = [];
  const visited = new Set<string>();
  const resolve = (id: string) => {
    if (visited.has(id)) return;
    visited.add(id);
    const comp = manifest.get(id);
    if (!comp) return;
    for (const depId of comp.dependencies) { resolve(depId); }
    resolved.push(id);
  };
  resolve(componentId);
  return resolved;
};

const validateDependencies = (componentId: string) => {
  const entry = manifest.get(componentId);
  if (!entry) return { valid: false, missing: [] };
  const missing = [];
  for (const depId of entry.dependencies) {
    if (!manifest.has(depId)) missing.push(depId);
  }
  return { valid: missing.length === 0, missing };
};

const getStats = () => {
  const stats: { total: number; byStatus: Record<string, number>; byType: Record<string, number> } = { total: manifest.size, byStatus: {}, byType: {} };
  for (const status of Object.values(ComponentStatus)) stats.byStatus[status] = 0;
  for (const type of Object.values(ComponentType)) stats.byType[type] = 0;
  for (const entry of manifest.values()) { stats.byStatus[entry.status]++; stats.byType[entry.type]++; }
  return stats;
};

const init = () => {
  _initPorts();
  _portsInitialized = true;
  return { success: true };
};

const healthCheck = () => {
  const stats = getStats();
  const errorCount = stats.byStatus[ComponentStatus.ERROR] || 0;
  return { status: errorCount === 0 ? 'HEALTHY' : 'DEGRADED', stats, errorCount, version: VERSION, moduleId: MODULE_ID, portsInitialized: _portsInitialized };
};

const info = () => ({ moduleId: MODULE_ID, version: VERSION, componentsCount: manifest.size, stats: getStats(), portsInitialized: _portsInitialized });

export { ComponentStatus, ComponentType, register, unregister, get, getAll, getByType, getByStatus, setStatus, onStatusChange, has, count, clear, getLoadOrder, resolveDependencies, validateDependencies, getStats, init, healthCheck, info, MODULE_ID, VERSION };
