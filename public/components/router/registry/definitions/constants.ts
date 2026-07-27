// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.2.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: router.registry.definitions.constants
// PURPOSE: Router Definitions - Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   GUARD_POLICIES — exported value
//   PERMISSION_GRAMMAR — exported value
//   ROUTES_SCHEMA — exported value
//   DOMAINS — exported value
//   LAYOUTS — exported value
//   injectPorts() — exported function
//   getPorts() — exported function
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
export const VERSION = '6.2.0-P17WI';
export const MODULE_ID = 'router.registry.definitions.constants';
const Ports = createCorePorts({ moduleId: MODULE_ID });
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
export const GUARD_POLICIES = Object.freeze({ UARPS: 'uarps', PERMISSIONS: 'permissions', HYBRID: 'hybrid', LEGACY: 'legacy', PUBLIC: 'public' });
export const PERMISSION_GRAMMAR = Object.freeze({ CAPABILITY_PREFIX: 'cap:', ROLE_PREFIX: 'role:', LEVEL_PREFIX: 'level:' });
export const ROUTES_SCHEMA = Object.freeze({ path: 'string', id: 'string', name: 'string', title: 'string', public: 'boolean', requiresAuth: 'boolean', permissions: ['string'], featureFlags: ['string'], layout: 'string', defaultView: 'string', virtualDefaults: { view: 'string', tab: 'string', section: 'string', entity: 'string', mode: 'string' }, seo: { title: 'string', description: 'string' }, aliases: ['string'], tags: ['string'], mountMain: 'boolean', domain: 'string', guardPolicy: 'string', minLevel: 'number' });
export const DOMAINS = Object.freeze({ DASHBOARD: 'dashboard', CLIENTES: 'clientes', FINANCEIRO: 'financeiro', COMERCIAL: 'comercial', RH: 'rh', SUPRIMENTOS: 'suprimentos', JURIDICO: 'juridico', INTEGRACOES: 'integracoes', IMPORTACAO: 'importacao', OPERACIONAL: 'operacional', ADMIN: 'admin', SYSTEM: null });
export const LAYOUTS = Object.freeze({ DEFAULT: 'default', LOGIN_ONLY: 'login-only', FULL_SCREEN: 'full-screen' });
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() }; }
export default { VERSION, MODULE_ID, ROUTES_SCHEMA, DOMAINS, LAYOUTS, GUARD_POLICIES, PERMISSION_GRAMMAR, healthCheck, injectPorts, getPorts };
