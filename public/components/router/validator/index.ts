// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: router.validator.index
// PURPOSE: Router Validation - Global Export
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   * as RouterValidation from ./router-validation.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.RouterValidation
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createCorePorts } from '/core/runtime/ports-profiles.js';
import * as RouterValidation from './router-validation.js';
const MODULE_ID = 'router.validator.index';
const VERSION = '1.2.0-ENTERPRISE';
const Ports = createCorePorts({ moduleId: MODULE_ID });
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
export function healthCheck() { const hasValidation = typeof (RouterValidation as any).runValidation === 'function'; return { status: hasValidation ? 'HEALTHY' : 'DEGRADED', module: MODULE_ID, version: VERSION, hasValidation, portsInitialized: Ports.isInitialized(), timestamp: new Date().toISOString() }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), exports: Object.keys(RouterValidation), healthCheck: healthCheck(), timestamp: Date.now() }; }
if (typeof window !== 'undefined') { (window as any).RouterValidation = { ...RouterValidation, validate: (RouterValidation as any).runValidation, validateRoute: (RouterValidation as any).validateNavigationRequest, validateRegistry: (RouterValidation as any).validateRoutesRegistry, healthCheck, info }; }
export { MODULE_ID, VERSION };
export * from './router-validation.js';
export default { ...RouterValidation, MODULE_ID, VERSION, healthCheck, info, injectPorts, getPorts };
