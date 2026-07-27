// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: session-manager.core.ports
// PURPOSE: Session Manager - Core Ports v1.1.0-P17WI
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   initPorts() — exported function
//   getPort() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//   isInitialized() — exported function
//   getTracker() — exported function
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
export const VERSION = '1.1.0-P17WI';
export const MODULE_ID = 'session-manager.core.ports';
const Ports = createCorePorts({ moduleId: MODULE_ID });
export function initPorts() { Ports.init(); }
export function getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
export function isInitialized() { return Ports.isInitialized(); }
export function getTracker() { const sessionManager = getPort('sessionManager'); if (sessionManager && sessionManager.debug && sessionManager.debug.tracker) { return sessionManager.debug.tracker; } return { track() {} }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, initialized: Ports.isInitialized() }; }
export default { initPorts, getPort, injectPorts, getPorts, isInitialized, getTracker };
