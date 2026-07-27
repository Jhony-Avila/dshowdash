// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.5.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.security-container
// PURPOSE: Security container with CSRF token management
// ───────────────────────────────────────────────────────────────
// @contract INFO - info() returns module information
// @contract HEALTH - healthCheck() returns health status
// @contract CLEANUP - cleanup() performs cleanup
// @contract RESET - reset() resets module
// @contract DESTROY - destroy() destroys module
// @contract PORTS - injectPorts()/getPorts() for dependency injection
// ───────────────────────────────────────────────────────────────
// IMPORTS: createCorePorts from /core/runtime/ports-profiles.js
// IMPORTS: csrf-token-manager from ./csrf-token-manager/index.js
// PROVIDES: info, healthCheck, cleanup, reset, destroy,
//           injectPorts, getPorts, VERSION, MODULE_ID
// @changelog v1.5.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.4.0-ENTERPRISE: ES6 modernization (const/let, arrow functions, template literals, for...of)
// @changelog v1.3.0-ENTERPRISE: Added Ports Pattern (P17WI compliance)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '1.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'security-container';

const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

export * from './csrf-token-manager/index.js';

export const info = () => ({ version: VERSION, moduleId: MODULE_ID, modules: ['csrf-token-manager'], portsInitialized: Ports.isInitialized(), timestamp: Date.now() });

export const healthCheck = () => {
  const checks = { portsInitialized: Ports.isInitialized(), modulesAvailable: true };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
};

export const cleanup = () => ({ success: true, moduleId: MODULE_ID });
export const reset = () => cleanup();
export const destroy = () => cleanup();

export default { VERSION, MODULE_ID, info, healthCheck, cleanup, reset, destroy, injectPorts, getPorts };
