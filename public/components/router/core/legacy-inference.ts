// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: router.core.legacy-inference
// PURPOSE: Router - Legacy Inference
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   createResolvedRoute from ./route-factory.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   isKnownDynamicPattern() — exported function
//   inferDynamicRoute() — exported function
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
import { createResolvedRoute } from './route-factory.js';
export const VERSION = '1.1.0-P17WI';
export const MODULE_ID = 'router.core.legacy-inference';
const Ports = createCorePorts({ moduleId: MODULE_ID });
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
const knownPatterns = [/^status-/, /^meu-perfil$/, /^preferencias$/, /^seguranca$/, /^sessoes$/];
export function isKnownDynamicPattern(path: string) { const cleanPath = path.replace(/^\//, ''); return knownPatterns.some(p => p.test(cleanPath)); }
export function inferDynamicRoute(path: string) { const cleanPath = path.replace(/^\//, ''); let panel = 'panel-status'; let page = 'panel-status'; let title = cleanPath.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); if (cleanPath === 'meu-perfil') { panel = 'panel-profile'; page = 'panel-profile'; title = 'Meu Perfil'; } else if (cleanPath === 'preferencias') { panel = 'panel-preferences'; page = 'panel-preferences'; title = 'Preferências'; } else if (cleanPath === 'seguranca') { panel = 'panel-security'; page = 'panel-security'; title = 'Segurança'; } else if (cleanPath === 'sessoes') { panel = 'panel-sessions'; page = 'panel-sessions'; title = 'Sessões'; } else if (cleanPath.startsWith('status-')) { title = `Status: ${cleanPath.replace('status-', '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`; } const config = { page, title, public: false, requiresAuth: true, permissions: [] as string[], featureFlags: [] as string[], layout: 'default', defaultHash: `#/${cleanPath}`, id: `inferred-${cleanPath}`, name: cleanPath, defaultView: panel, virtualDefaults: { view: panel, tab: 'overview', section: null as string | null, entity: null as string | null, mode: 'view' }, tags: ['LEGACY', 'INFERRED', 'NOT_AAA'] }; const resolved = createResolvedRoute(config, `/${cleanPath}`, 'inferred'); resolved._isLegacyInferred = true; resolved._aaa = false; return resolved; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, patterns: knownPatterns.length, portsInitialized: Ports.isInitialized() }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, patterns: knownPatterns.length, portsInitialized: Ports.isInitialized() }; }
export default { isKnownDynamicPattern, inferDynamicRoute, healthCheck, injectPorts, getPorts };
