// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: router.core.route-factory
// PURPOSE: Router - Route Factory
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   extractLayoutHints() — exported function
//   createResolvedRoute() — exported function
//   createFallbackRoute() — exported function
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
export const MODULE_ID = 'router.core.route-factory';
const Ports = createCorePorts({ moduleId: MODULE_ID });
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
export function extractLayoutHints(config: Record<string, unknown>) { return { layout: config.layout || 'default', defaultView: (config.defaultView || null) as string | null, defaultHash: (config.defaultHash || '') as string, virtualDefaults: (config.virtualDefaults || null) as Record<string, unknown> | null, mountMain: (config.mountMain || false) as boolean, panel: (config.panel || null) as string | null, domain: (config.domain || null) as string | null }; }
export function createResolvedRoute(config: Record<string, any>, canonicalPath: string, matchType: string, extras?: Record<string, any>) { if (extras === undefined) extras = {}; const coreRoute = { path: canonicalPath, page: config.page, title: config.title || '', public: !!config.public, requiresAuth: config.requiresAuth !== false, permissions: config.permissions || [], featureFlags: config.featureFlags || [], id: config.id || null, name: config.name || null, tags: config.tags || [], params: extras.params || {}, query: extras.query || {}, hash: extras.hash || '', matched: true, matchType, _aaa: true }; const layoutHints = extractLayoutHints(config); return Object.assign({}, coreRoute, { _layoutHints: layoutHints, layout: layoutHints.layout, defaultView: layoutHints.defaultView as string | null, defaultHash: layoutHints.defaultHash as string, virtualDefaults: layoutHints.virtualDefaults as Record<string, unknown> | null }, extras); }
export function createFallbackRoute(originalPath: string, notFoundConfig: Record<string, unknown>) { const notFound = notFoundConfig || {}; return { path: notFound.path || '/404', page: notFound.page || 'not-found', title: notFound.title || 'Página Não Encontrada', public: true, requiresAuth: false, permissions: [] as string[], featureFlags: [] as string[], id: 'not-found', name: 'not-found', tags: ['error', '404'], params: {}, query: {}, hash: '', matched: false, matchType: 'fallback', originalPath, isNotFound: true, _aaa: true, _layoutHints: { layout: 'full-screen', defaultView: null as string | null, defaultHash: '', virtualDefaults: null as Record<string, unknown> | null, mountMain: false, panel: null as string | null, domain: null as string | null }, layout: 'full-screen', defaultHash: '' }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() }; }
export default { extractLayoutHints, createResolvedRoute, createFallbackRoute, healthCheck, injectPorts, getPorts };
