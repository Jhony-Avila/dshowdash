// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.0.0-P23)
// ═══════════════════════════════════════════════════════════════
// MODULE: icon-registry:core
// PURPOSE: Icon Registry - Core Registry
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   register() — exported function
//   get() — exported function
//   has() — exported function
//   list() — exported function
//   listNamespaces() — exported function
//   count() — exported function
//   clear() — exported function
//   getManifest() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '3.0.0-P23';
export const MODULE_ID = 'icon-registry:core';

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _log = (level: string, ...args: unknown[]) => {
  const logger = _getPort('logger');
  if (!logger) return;
  const fn = logger[level] || logger.info;
  if (typeof fn === 'function') fn(`[${MODULE_ID}]`, ...args);
};

const _icons = new Map();
const _namespaces = new Set<string>();
let _loadedAt: number | null = null;
let _errors: Array<{ type: string; timestamp: number }> = [];

export function register(namespace: string, icons: Record<string, unknown>) {
  _initPorts();
  if (!namespace || typeof namespace !== 'string') { _errors.push({ type: 'INVALID_NAMESPACE', timestamp: Date.now() }); throw new Error('IconRegistry: namespace must be a non-empty string'); }
  if (!icons || typeof icons !== 'object') { _errors.push({ type: 'INVALID_ICONS', timestamp: Date.now() }); throw new Error('IconRegistry: icons must be an object'); }
  _namespaces.add(namespace);
  let count = 0;
  for (const [name, svg] of Object.entries(icons)) { if (typeof svg !== 'string') continue; const key = `${namespace}:${name}`; _icons.set(key, svg); count++; }
  if (!_loadedAt) _loadedAt = Date.now();
  return count;
}

export function get(fullName: string) {
  if (!fullName || typeof fullName !== 'string') return null;
  if (!fullName.includes(':')) { _log('warn', `Invalid icon name "${fullName}". Use format "namespace:name"`); return null; }
  return _icons.get(fullName) || null;
}

export function has(fullName: string) { if (!fullName || typeof fullName !== 'string') return false; return _icons.has(fullName); }
export function list(namespace: string | null = null) { if (namespace) { const prefix = `${namespace}:`; return Array.from(_icons.keys()).filter(k => k.startsWith(prefix)); } return Array.from(_icons.keys()); }
export function listNamespaces() { return Array.from(_namespaces); }
export function count(namespace: string | null = null) { if (namespace) { const prefix = `${namespace}:`; return Array.from(_icons.keys()).filter(k => k.startsWith(prefix)).length; } return _icons.size; }
export function clear() { _icons.clear(); _namespaces.clear(); _loadedAt = null; _errors = []; }

// P23: Registry Manifest
export function getManifest() {
  const byNamespace = {};
  for (const ns of _namespaces) { (byNamespace as any)[ns] = count(ns); }
  return {
    registryId: MODULE_ID,
    version: VERSION,
    loadedAt: _loadedAt,
    itemCount: _icons.size,
    items: Array.from(_icons.keys()),
    namespaces: Array.from(_namespaces),
    iconsByNamespace: byNamespace,
    errors: _errors.slice(-10),
    p23Governance: true,
    timestamp: Date.now()
  };
}

export function info() {
  const portsSnapshot = Ports.snapshot();
  const byNamespace = {};
  for (const ns of _namespaces) { (byNamespace as any)[ns] = count(ns); }
  return { moduleId: MODULE_ID, version: VERSION, totalIcons: _icons.size, namespaces: Array.from(_namespaces), iconsByNamespace: byNamespace, portsInitialized: portsSnapshot._initialized, p23Governance: true };
}

export function healthCheck() {
  const portsSnapshot = Ports.snapshot();
  const logger = _getPort('logger');
  return { status: _icons.size > 0 ? 'HEALTHY' : 'DEGRADED', totalIcons: _icons.size, namespaces: Array.from(_namespaces), version: VERSION, moduleId: MODULE_ID, portsInitialized: portsSnapshot._initialized, loggerReady: !!logger, p23Governance: true };
}

export default { register, get, has, list, listNamespaces, count, clear, info, healthCheck, getManifest, injectPorts, getPorts };
