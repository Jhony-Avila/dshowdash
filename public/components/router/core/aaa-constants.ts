// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: router.core.aaa-constants
// PURPOSE: Router - AAA Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   ROUTER_STRICT — exported value
//   AAA_FLAGS — exported value
//   AAA_CONTRACT — exported value
//   injectPorts() — exported function
//   getPorts() — exported function
//   setStrictMode() — exported function
//   isStrictMode() — exported function
//   getAAAContract() — exported function
//   getAAAFlags() — exported function
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
export const VERSION = '1.1.0-P17WI';
export const MODULE_ID = 'router.core.aaa-constants';
const Ports = createCorePorts({ moduleId: MODULE_ID });
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
export const ROUTER_STRICT = { value: true };
export const AAA_FLAGS = { INFERENCE_FROZEN: true, INFERENCE_FROZEN_DATE: '2025-12-23', LAYOUT_SEPARATION: true, LAYOUT_SEPARATION_DATE: '2025-12-23', REGISTRY_HARDENED: true, REGISTRY_HARDENED_DATE: '2025-12-23', ROUTER_STRICT: true, ROUTER_STRICT_DATE: '2025-12-23', AAA_COMPLETE: true, AAA_COMPLETE_DATE: '2025-12-23' };
export const AAA_CONTRACT = { version: '1.0.0', methods: ['resolve', 'canNavigate', 'navigate', 'getStatus', 'healthCheck'], principles: ['Router resolve intenção, não experiência', 'Router não inventa rotas', 'Router não decide layout', 'Router é determinístico'] };
export function setStrictMode(enabled: boolean) { const previous = ROUTER_STRICT.value; ROUTER_STRICT.value = !!enabled; AAA_FLAGS.ROUTER_STRICT = ROUTER_STRICT.value; return { previous, current: ROUTER_STRICT.value }; }
export function isStrictMode() { return ROUTER_STRICT.value; }
export function getAAAContract() { return Object.assign({}, AAA_CONTRACT); }
export function getAAAFlags() { return Object.assign({}, AAA_FLAGS); }
export function info() { return { moduleId: MODULE_ID, version: VERSION, strict: ROUTER_STRICT.value, portsInitialized: Ports.isInitialized() }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, strict: ROUTER_STRICT.value, portsInitialized: Ports.isInitialized() }; }
export default { ROUTER_STRICT, AAA_FLAGS, AAA_CONTRACT, setStrictMode, isStrictMode, getAAAContract, getAAAFlags, healthCheck, injectPorts, getPorts };
