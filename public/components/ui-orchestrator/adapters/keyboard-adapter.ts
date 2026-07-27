// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.5.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: ui-orchestrator.adapters.keyboard-adapter
// PURPOSE: KeyboardAdapter v2.5.0-P18EC
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   init() — exported function
//   destroy() — exported function
//   register() — exported function
//   unregister() — exported function
//   listShortcuts() — exported function
//   enable() — exported function
//   disable() — exported function
//   isEnabled() — exported function
//   isListening() — exported function
//   simulate() — exported function
//   getMetrics() — exported function
//   resetMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   OVERLAY_EVENTS — exported value
//   KEYBOARD_EVENTS — exported value
//
// RECEIVES (via init/options): (see init function)
// EMITS (eventos):
//   OVERLAY_EVENTS.CLOSE
//   eventKey
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   document.addEventListener
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createCorePorts } from '/core/runtime/ports-profiles.js';
export const VERSION = '2.5.0-P18EC';
export const MODULE_ID = 'ui-orchestrator.adapters.keyboard-adapter';
const OVERLAY_EVENTS = { CLOSE: 'overlay:close', CLOSE_REQUEST: 'overlay:close-request' };
const KEYBOARD_EVENTS = { READY: 'ui-orchestrator:keyboard-adapter:ready', SHORTCUT_EXECUTED: 'ui-orchestrator:keyboard:shortcut-executed', CUSTOM_EXECUTED: 'ui-orchestrator:keyboard:custom-executed' };
const hasWindow = typeof window !== 'undefined';
const hasDocument = typeof document !== 'undefined';
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts(): void { Ports.init(); }
function _getPort(name: string): Record<string, unknown> { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>): unknown { return Ports.inject(p); }
export function getPorts(): Record<string, unknown> { return Ports.snapshot(); }
const _log = function(level: string): void { const args = Array.prototype.slice.call(arguments, 1); const logger = _getPort('logger') as Record<string, unknown> | null; if (!logger) return; const fn = (logger[level] as ((...a: unknown[]) => void) | undefined) || (logger.info as (...a: unknown[]) => void); if (typeof fn === 'function') fn.apply(logger, [`[${MODULE_ID}]`].concat(args)); };
let _enabled = true;
let _listening = false;
const _customShortcuts = new Map<string, { callback: (ctx: { shortcut: string }) => void; label: string }>();
let _metrics = { keystrokes: 0, shortcutsMatched: 0, shortcutsExecuted: 0, shortcutsDenied: 0, errors: 0 };
const DEFAULT_SHORTCUTS: Record<string, { intentId: string | null; action?: string; label: string }> = { 'ctrl+k': { intentId: 'keyboard.shortcut.search', label: 'Buscar' }, 'f1': { intentId: 'keyboard.shortcut.help', label: 'Ajuda' }, 'alt+h': { intentId: 'keyboard.shortcut.home', label: 'Home' }, 'ctrl+b': { intentId: 'keyboard.shortcut.sidebar', label: 'Toggle Sidebar' }, 'ctrl+shift+f': { intentId: 'system.action.fullscreen', label: 'Fullscreen' }, 'ctrl+shift+r': { intentId: 'system.action.refresh', label: 'Refresh' }, 'ctrl+shift+t': { intentId: 'system.toggle.theme', label: 'Toggle Theme' }, 'escape': { intentId: null, action: 'close-overlay', label: 'Fechar' } };
export function init(options: Record<string, unknown> = {}): { success: boolean; listening: boolean; portsInitialized: boolean } { if (options === undefined) options = {}; _enabled = options.enabled !== false; if (_enabled && !_listening) _startListening(); _emitEvent(KEYBOARD_EVENTS.READY, { version: VERSION }); return { success: true, listening: _listening, portsInitialized: Ports.isInitialized() }; }
export function destroy(): void { _stopListening(); _customShortcuts.clear(); }
function _startListening(): void { if (_listening || !hasDocument) return; document.addEventListener('keydown', _handleKeydown, { capture: true }); _listening = true; }
function _stopListening(): void { if (!_listening || !hasDocument) return; document.removeEventListener('keydown', _handleKeydown, { capture: true }); _listening = false; }

// @ts-expect-error TS migration - TS2554
function _handleKeydown(event: KeyboardEvent): void { if (!_enabled) return; const target = event.target as HTMLElement | null; const tagName = target && target.tagName ? target.tagName.toLowerCase() : ''; if (tagName === 'input' || tagName === 'textarea' || (target && (target as HTMLElement & { isContentEditable?: boolean }).isContentEditable)) { if (event.key !== 'Escape') return; } _metrics.keystrokes++; try { const shortcutKey = _normalizeShortcut(event); if (_customShortcuts.has(shortcutKey)) { event.preventDefault(); _executeCustomShortcut(shortcutKey); return; } const defaultShortcut = DEFAULT_SHORTCUTS[shortcutKey]; if (defaultShortcut) { event.preventDefault(); _executeDefaultShortcut(defaultShortcut, shortcutKey); return; } } catch (error) { _metrics.errors++; _log('warn', 'Error handling shortcut:', error); } }
function _normalizeShortcut(event: KeyboardEvent): string { const parts: string[] = []; if (event.ctrlKey || event.metaKey) parts.push('ctrl'); if (event.altKey) parts.push('alt'); if (event.shiftKey) parts.push('shift'); parts.push(event.key.toLowerCase()); return parts.join('+'); }
function _executeDefaultShortcut(shortcut: { intentId: string | null; action?: string; label: string }, shortcutKey: string): void { _metrics.shortcutsMatched++; const eb = _getPort('eventBus') as { emit?: (e: string, d: unknown) => void } | null; if (shortcut.action === 'close-overlay') { _emitEvent(OVERLAY_EVENTS.CLOSE_REQUEST, { source: 'keyboard' }); if (eb && eb.emit) eb.emit(OVERLAY_EVENTS.CLOSE, { source: 'keyboard' }); _metrics.shortcutsExecuted++; return; } _metrics.shortcutsExecuted++; _emitEvent(KEYBOARD_EVENTS.SHORTCUT_EXECUTED, { shortcut: shortcutKey, intentId: shortcut.intentId }); }
function _executeCustomShortcut(shortcutKey: string): void { _metrics.shortcutsMatched++; const custom = _customShortcuts.get(shortcutKey); if (custom && custom.callback) { try { custom.callback({ shortcut: shortcutKey }); _metrics.shortcutsExecuted++; _emitEvent(KEYBOARD_EVENTS.CUSTOM_EXECUTED, { shortcut: shortcutKey, label: custom.label }); } catch (error) { _metrics.errors++; } } }
export function register(shortcut: string, callback: (ctx: { shortcut: string }) => void, label: string = ''): () => boolean { if (label === undefined) label = ''; const normalized = shortcut.toLowerCase().replace(/\s+/g, ''); _customShortcuts.set(normalized, { callback, label }); return () => unregister(shortcut); }
export function unregister(shortcut: string): boolean { const normalized = shortcut.toLowerCase().replace(/\s+/g, ''); return _customShortcuts.delete(normalized); }
export function listShortcuts(): { shortcut: string; label: string; source: string; intentId?: string | null }[] { const shortcuts: { shortcut: string; label: string; source: string; intentId?: string | null }[] = []; _customShortcuts.forEach((config, key) => { shortcuts.push({ shortcut: key, label: config.label, source: 'custom' }); }); Object.keys(DEFAULT_SHORTCUTS).forEach((key: string) => { const config = DEFAULT_SHORTCUTS[key]; if (!shortcuts.find(s => s.shortcut === key)) { shortcuts.push({ shortcut: key, label: config.label, intentId: config.intentId, source: 'default' }); } }); return shortcuts; }
export function enable(): void { _enabled = true; if (!_listening) _startListening(); }
export function disable(): void { _enabled = false; }
export function isEnabled(): boolean { return _enabled; }
export function isListening(): boolean { return _listening; }
export function simulate(shortcut: string): Promise<{ executed: boolean; source?: string; intentId?: string | null; reason?: string }> { const normalized = shortcut.toLowerCase().replace(/\s+/g, ''); if (_customShortcuts.has(normalized)) { _executeCustomShortcut(normalized); return Promise.resolve({ executed: true, source: 'custom' }); } const defaultShortcut = DEFAULT_SHORTCUTS[normalized]; if (defaultShortcut) { _executeDefaultShortcut(defaultShortcut, normalized); return Promise.resolve({ executed: true, source: 'default', intentId: defaultShortcut.intentId }); } return Promise.resolve({ executed: false, reason: 'no-matching-shortcut' }); }
function _emitEvent(eventKey: string, data: Record<string, unknown> = {}): void { if (data === undefined) data = {}; const eb = _getPort('eventBus') as { emit?: (e: string, d: unknown) => void } | null; if (eb && eb.emit) eb.emit(eventKey, Object.assign({}, data, { source: MODULE_ID, timestamp: Date.now() })); }
export function getMetrics(): typeof _metrics { return Object.assign({}, _metrics); }
export function resetMetrics(): void { _metrics = { keystrokes: 0, shortcutsMatched: 0, shortcutsExecuted: 0, shortcutsDenied: 0, errors: 0 }; }
export function info(): Record<string, unknown> { const logger = _getPort('logger'); return { moduleId: MODULE_ID, version: VERSION, enabled: _enabled, listening: _listening, customShortcutsCount: _customShortcuts.size, defaultShortcutsCount: Object.keys(DEFAULT_SHORTCUTS).length, allShortcuts: listShortcuts(), metrics: getMetrics(), loggerReady: !!logger, portsInitialized: Ports.isInitialized() }; }
export function healthCheck(): Record<string, unknown> { const logger = _getPort('logger'); const checks = { enabled: _enabled, listening: _listening, lowErrors: _metrics.errors < 5, executionRate: _metrics.shortcutsMatched > 0 ? (_metrics.shortcutsExecuted / _metrics.shortcutsMatched) > 0.5 : true, loggerReady: !!logger, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed >= 4 ? 'HEALTHY' : (passed >= 2 ? 'DEGRADED' : 'UNHEALTHY'), score: `${passed}/${total}`, checks, metrics: getMetrics(), version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() }; }
export { OVERLAY_EVENTS, KEYBOARD_EVENTS };
export default { init, destroy, register, unregister, listShortcuts, enable, disable, isEnabled, isListening, simulate, getMetrics, resetMetrics, info, healthCheck, OVERLAY_EVENTS, KEYBOARD_EVENTS, injectPorts, getPorts, VERSION, MODULE_ID };
