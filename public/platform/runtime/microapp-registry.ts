// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: platform-microapp-registry
// PURPOSE: Microapp Registry
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION
//   MODULE_ID
//   register
//   unregister
//   getInstance
//   setInstance
//   getRegistered
//   getAllRegistered
//   hasApp
//   clear
//   default export
// ═══════════════════════════════════════════════════════════════
'use strict';

const VERSION = '3.1.0-P2-ENTERPRISE';
const MODULE_ID = 'platform-microapp-registry';

let _registry: Record<string, Record<string, unknown>> = {};
let _instances: Record<string, unknown> = {};

function register(appId: string, microapp: Record<string, unknown>) {
  _registry[appId] = Object.assign({}, microapp, { registeredAt: Date.now() });
  return true;
}

function unregister(appId: string) {
  delete _registry[appId];
  delete _instances[appId];
  return true;
}

function getInstance(appId: string) { return _instances[appId] || null; }
function setInstance(appId: string, instance: unknown) { _instances[appId] = instance; }
function getRegistered(appId: string) { return _registry[appId] || null; }
function getAllRegistered() { return Object.keys(_registry); }
function hasApp(appId: string) { return !!_registry[appId]; }
function clear() { _registry = {}; _instances = {}; }

export { VERSION, MODULE_ID, register, unregister, getInstance, setInstance, getRegistered, getAllRegistered, hasApp, clear };
export default { VERSION, MODULE_ID, register, unregister, getInstance, setInstance, getRegistered, getAllRegistered, hasApp, clear };
