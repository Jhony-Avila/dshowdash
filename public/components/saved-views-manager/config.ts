// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.4.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: saved-views-manager.config
// PURPOSE: SavedViewsManager - Config Module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   CONFIG — exported value
//   VIEW_TYPES — exported value
//   logger — exported value
//   injectPorts() — exported function
//   getPorts() — exported function
//   createMetrics() — exported function
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
import { createUiPorts } from '/core/runtime/ports-profiles.js';
export const VERSION = '2.4.0-P17WI';
export const MODULE_ID = 'saved-views-manager.config';
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts(): void { Ports.init(); }
function _getPort(name: string): Record<string, unknown> | null { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>): unknown { return Ports.inject(p); }
export function getPorts(): Record<string, unknown> { return Ports.snapshot(); }
export const CONFIG = { endpoints: { list: '/api/saved-views/?action=list', get: '/api/saved-views/?action=get', types: '/api/saved-views/?action=types', create: '/api/saved-views/?action=create', update: '/api/saved-views/?action=update', setDefault: '/api/saved-views/?action=set-default', delete: '/api/saved-views/' }, retry: { maxAttempts: 3, baseDelay: 1000, maxDelay: 5000 }, timeout: 10000 };
export const VIEW_TYPES = { DASHBOARD: 'dashboard', PANEL: 'panel', REPORT: 'report', FILTER: 'filter', LAYOUT: 'layout', CUSTOM: 'custom' };
export function createMetrics(): { listCount: number; createCount: number; updateCount: number; deleteCount: number; applyCount: number; errorCount: number; lastActivity: number | null } { return { listCount: 0, createCount: 0, updateCount: 0, deleteCount: 0, applyCount: 0, errorCount: 0, lastActivity: null }; }
export const logger = { info: (msg: string, ctx: Record<string, unknown> = {}): void => { const L = _getPort('logger'); if (L && typeof (L as Record<string, unknown>).info === 'function') (L as Record<string, (...args: unknown[]) => void>).info(msg, { component: MODULE_ID, ...ctx }); }, warn: (msg: string, ctx: Record<string, unknown> = {}): void => { const L = _getPort('logger'); if (L && typeof (L as Record<string, unknown>).warn === 'function') (L as Record<string, (...args: unknown[]) => void>).warn(msg, { component: MODULE_ID, ...ctx }); }, error: (msg: string, ctx: Record<string, unknown> = {}): void => { const L = _getPort('logger'); if (L && typeof (L as Record<string, unknown>).error === 'function') (L as Record<string, (...args: unknown[]) => void>).error(msg, { component: MODULE_ID, ...ctx }); }, debug: (msg: string, ctx: Record<string, unknown> = {}): void => { const L = _getPort('logger'); if (L && typeof (L as Record<string, unknown>).debug === 'function') (L as Record<string, (...args: unknown[]) => void>).debug(msg, { component: MODULE_ID, ...ctx }); } };
export function info(): Record<string, unknown> { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() }; }
export function healthCheck(): Record<string, unknown> { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() }; }
