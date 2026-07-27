// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: components/permissions-guard/core/policies
// PURPOSE: Permissions Guard - Policies
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
//   unregister() — exported function
//   get() — exported function
//   getAll() — exported function
//   evaluate() — exported function
//   healthCheck() — exported function
//   info() — exported function
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
export const VERSION = '8.2.0-P17WI';
export const MODULE_ID = 'components/permissions-guard/core/policies';
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
const _policies = new Map();
export function register(name: string, policy: (context: Record<string, unknown>) => { allowed: boolean; reason?: string }) { _policies.set(name, policy); _getPort('logger')?.debug(`[${MODULE_ID}] Policy registered: ${name}`); }
export function unregister(name: string) { _policies.delete(name); }
export function get(name: string) { return _policies.get(name); }
export function getAll() { return Array.from(_policies.entries()); }
export function evaluate(name: string, context: Record<string, unknown>) { const policy = _policies.get(name); if (!policy) { _getPort('logger')?.warn(`[${MODULE_ID}] Policy not found: ${name}`); return { allowed: false, reason: 'policy_not_found' }; } try { return policy(context); } catch (e) { _getPort('logger')?.error(`[${MODULE_ID}] Policy evaluation error:`, e); return { allowed: false, reason: 'evaluation_error' }; } }
export function healthCheck() { return { status: 'healthy', policyCount: _policies.size, portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID }; }
export function info() { return { version: VERSION, moduleId: MODULE_ID, policyCount: _policies.size, policies: Array.from(_policies.keys()), portsInitialized: Ports.isInitialized() }; }
export const PolicyManager = { register, unregister, get, getAll, evaluate, healthCheck, info };
export default { register, unregister, get, getAll, evaluate, healthCheck, info, VERSION, MODULE_ID, injectPorts, getPorts };
