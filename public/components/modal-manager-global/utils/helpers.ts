// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.3.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.modal-manager-global.utils.helpers
// PURPOSE: Modal Manager Global Helpers - Utility functions
// ───────────────────────────────────────────────────────────────
// @contract MODULE_ID - module constant identifier
// @contract VERSION - module constant version
// @contract INJECT_PORTS - injectPorts() for dependency injection
// @contract GET_PORTS - getPorts() returns ports snapshot
// @contract GENERATE_ID - generateId() generates unique modal id
// @contract CREATE_BACKDROP - createBackdrop() creates backdrop element
// @contract TRAP_FOCUS - trapFocus() traps focus in element
// @contract LOCK_SCROLL - lockScroll() locks body scroll
// @contract DEEP_CLONE - deepClone() deep clones object
// @contract EXECUTE_CALLBACK - executeCallback() safely executes callback
// @contract ESCAPE_HTML - escapeHtml() escapes HTML entities
// @contract GET_FIRST_FOCUSABLE - getFirstFocusable() gets first focusable
// @contract GET_ALL_FOCUSABLE - getAllFocusable() gets all focusables
// @contract HEALTH - healthCheck() returns health status
// @contract INFO - info() returns module information
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   generateId() — exported function
//   createBackdrop() — exported function
//   trapFocus() — exported function
//   lockScroll() — exported function
//   deepClone() — exported function
//   executeCallback() — exported function
//   escapeHtml() — exported function
//   getFirstFocusable() — exported function
//   getAllFocusable() — exported function
//   init() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   getVersion() — exported function
//
// RECEIVES (via init/options): ctx object with ports
// EMITS (eventos): (none)
// LISTENS (eventos): (none)
// WINDOW ACCESS: document, window
// ───────────────────────────────────────────────────────────────
// @changelog v2.3.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v2.2.0-ENTERPRISE: Export VERSION padronizado
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const MODULE_ID = 'components.modal-manager-global.utils.helpers';
export const VERSION = '2.3.0-P2-ENTERPRISE';

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

export function generateId(prefix: string) { prefix = prefix || 'modal'; return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; }

export function createBackdrop(options: Record<string, unknown>) { options = options || {}; if (typeof document === 'undefined') return null; const backdrop = document.createElement('div'); backdrop.className = `modal-backdrop${options.className ? ` ${options.className}` : ''}`; backdrop.style.cssText = `position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:${options.zIndex || 1000}`; return backdrop; }

export function trapFocus(element: HTMLElement) { if (!element || typeof document === 'undefined') return () => {}; const focusable = element.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'); const first = focusable[0]; const last = focusable[focusable.length - 1]; const handler = (e: KeyboardEvent) => { if (e.key === 'Tab') { if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } } }; element.addEventListener('keydown', handler); if (first) first.focus(); return () => { element.removeEventListener('keydown', handler); }; }

export function lockScroll() { if (typeof document === 'undefined') return () => {}; const scrollY = window.scrollY; document.body.style.position = 'fixed'; document.body.style.top = `-${scrollY}px`; document.body.style.width = '100%'; return () => { document.body.style.position = ''; document.body.style.top = ''; document.body.style.width = ''; window.scrollTo(0, scrollY); }; }

export function deepClone(obj: unknown): unknown { if (obj === null || typeof obj !== 'object') return obj; if (obj instanceof Date) return new Date(obj.getTime()); if (Array.isArray(obj)) return obj.map(item => deepClone(item)); const source = obj as Record<string, unknown>; const cloned: Record<string, unknown> = {}; for (const key in source) { if (source.hasOwnProperty(key)) { cloned[key] = deepClone(source[key]); } } return cloned; }

export function executeCallback(callback: ((...args: unknown[]) => void) | null | undefined, data: Record<string, unknown>) { if (typeof callback === 'function') { try { callback(data); } catch (e) { const logger = _getPort('logger'); if (logger && logger.error) logger.error('[helpers] Callback error:', e); } } }

export function escapeHtml(str: string) { if (typeof str !== 'string') return ''; const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }; return str.replace(/[&<>"']/g, m => map[m]); }

export function getFirstFocusable(container: HTMLElement) { if (!container) return null; const focusables = getAllFocusable(container); return focusables.length > 0 ? focusables[0] : null; }

export function getAllFocusable(container: HTMLElement) { if (!container) return []; const selector = 'button, [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])'; const elements = container.querySelectorAll<HTMLElement>(selector); const result: HTMLElement[] = []; for (let i = 0; i < elements.length; i++) { const el = elements[i] as HTMLElement & { disabled?: boolean }; if (!el.disabled && el.offsetParent !== null) { result.push(el); } } return result; }

export function init(ctx: Record<string, unknown>) { _initPorts(); if (ctx && ctx.ports) injectPorts(ctx.ports as Record<string, unknown>); return { ok: true, version: VERSION }; }
export function healthCheck() { const checks: Record<string, boolean> = { portsInitialized: Ports.isInitialized(), functionsAvailable: typeof generateId === 'function' && typeof deepClone === 'function' }; const checkKeys = Object.keys(checks); let passed = 0; for (let i = 0; i < checkKeys.length; i++) { if (checks[checkKeys[i]]) passed++; } return { status: passed === checkKeys.length ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${checkKeys.length}`, moduleId: MODULE_ID, version: VERSION, checks, timestamp: Date.now() }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), timestamp: Date.now() }; }
export function getVersion() { return VERSION; }

export default { MODULE_ID, VERSION, init, generateId, createBackdrop, trapFocus, lockScroll, deepClone, executeCallback, escapeHtml, getFirstFocusable, getAllFocusable, healthCheck, info, getVersion, injectPorts, getPorts };
