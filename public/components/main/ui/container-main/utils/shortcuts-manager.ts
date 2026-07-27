// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-LOGGER-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-shortcuts-manager
// PURPOSE: Container-Main Shortcuts Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ./logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectEventBus() — exported function
//   init() — exported function
//   register() — exported function
//   unregister() — exported function
//   has() — exported function
//   get() — exported function
//   getAll() — exported function
//   setScope() — exported function
//   getScope() — exported function
//   enable() — exported function
//   disable() — exported function
//   isEnabled() — exported function
//   clear() — exported function
//   registerDefaults() — exported function
//   destroy() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   eventType
// LISTENS (eventos):
//   'keydown'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createLogger } from './logger.js';

export const VERSION = '1.1.0-LOGGER-INTEGRATED';
export const MODULE_ID = 'container-shortcuts-manager';

const logger = createLogger(MODULE_ID);

let _shortcuts = new Map();
let _enabled = true;
let _keydownHandler: unknown = null;
let _injectedEventBus: Record<string, unknown> | null = null;
let _scope = 'global';

export function injectEventBus(eventBus: unknown) { _injectedEventBus = eventBus as Record<string, unknown>; }

function _emitEvent(eventType: string, payload: Record<string, unknown>) {
  if (_injectedEventBus?.emit) {
    (_injectedEventBus.emit as (...args: unknown[]) => unknown)(eventType, { source: MODULE_ID, timestamp: Date.now(), ...payload });
  }
}

function _normalizeKey(key: string) {
  return key.toLowerCase()
    .replace(/ctrl/i, 'ctrl')
    .replace(/alt/i, 'alt')
    .replace(/shift/i, 'shift')
    .replace(/meta|cmd|command/i, 'meta')
    .split('+')
    .sort()
    .join('+');
}

function _getKeyCombo(event: string) {
  const parts = [];
  // @ts-expect-error TS migration - TS2339
  if (event.ctrlKey) parts.push('ctrl');
  // @ts-expect-error TS migration - TS2339
  if (event.altKey) parts.push('alt');
  // @ts-expect-error TS migration - TS2339
  if (event.shiftKey) parts.push('shift');
  // @ts-expect-error TS migration - TS2339
  if (event.metaKey) parts.push('meta');
  
  // @ts-expect-error TS migration - TS2339
  const key = event.key.toLowerCase();
  if (!['control', 'alt', 'shift', 'meta'].includes(key)) {
    parts.push(key);
  }
  
  return parts.sort().join('+');
}

function _handleKeydown(event: string) {
  if (!_enabled) return;
  
  // Ignore if typing in input
  // @ts-expect-error TS migration - TS2339
  const target = event.target;
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
    return;
  }
  
  const combo = _getKeyCombo(event);
  const shortcut = _shortcuts.get(combo);
  
  if (shortcut && (shortcut.scope === 'global' || shortcut.scope === _scope)) {
    // @ts-expect-error TS migration - TS2339
    event.preventDefault();
    // @ts-expect-error TS migration - TS2339
    event.stopPropagation();
    
    try {
      shortcut.handler(event);
      _emitEvent('shortcut:triggered', { combo, description: shortcut.description });
    } catch (e: any) {
      logger.error('Error in handler', { combo, error: e.message });
    }
  }
}

export function init() {
  if (_keydownHandler) return;
  _keydownHandler = _handleKeydown;
  // @ts-expect-error TS migration - TS2769
  document.addEventListener('keydown', _keydownHandler);
}

export function register(key: string, handler: (...args: unknown[]) => void, options: Record<string, unknown> = {}) {
  const { description = '', scope = 'global', override = false } = options;
  const normalizedKey = _normalizeKey(key);
  
  if (_shortcuts.has(normalizedKey) && !override) {
    logger.warn('Shortcut already registered', { key });
    return false;
  }
  
  _shortcuts.set(normalizedKey, { handler, description, scope, key });
  return true;
}

export function unregister(key: string) {
  const normalizedKey = _normalizeKey(key);
  return _shortcuts.delete(normalizedKey);
}

export function has(key: string) {
  return _shortcuts.has(_normalizeKey(key));
}

export function get(key: string) {
  return _shortcuts.get(_normalizeKey(key));
}

export function getAll() {
  const all: unknown[] = [];
  _shortcuts.forEach((value, key) => {
    all.push({ combo: key, ...value });
  });
  return all;
}

export function setScope(scope: string) {
  _scope = scope;
}

export function getScope() {
  return _scope;
}

export function enable() {
  _enabled = true;
}

export function disable() {
  _enabled = false;
}

export function isEnabled() {
  return _enabled;
}

export function clear() {
  const count = _shortcuts.size;
  _shortcuts.clear();
  return count;
}

// Common shortcuts
export function registerDefaults() {
  // @ts-expect-error strict migration — TS2345
  register('ctrl+s', (e: Event) => _emitEvent('shortcut:save', {}), { description: 'Salvar' });
  // @ts-expect-error strict migration — TS2345
  register('ctrl+z', (e: Event) => _emitEvent('shortcut:undo', {}), { description: 'Desfazer' });
  // @ts-expect-error strict migration — TS2345
  register('ctrl+shift+z', (e: Event) => _emitEvent('shortcut:redo', {}), { description: 'Refazer' });
  // @ts-expect-error strict migration — TS2345
  register('escape', (e: Event) => _emitEvent('shortcut:escape', {}), { description: 'Fechar/Cancelar' });
  // @ts-expect-error strict migration — TS2345
  register('ctrl+f', (e: Event) => _emitEvent('shortcut:search', {}), { description: 'Buscar' });
  // @ts-expect-error strict migration — TS2345
  register('f11', (e: Event) => _emitEvent('shortcut:fullscreen', {}), { description: 'Tela cheia' });
  // @ts-expect-error strict migration — TS2345
  register('ctrl+/', (e: Event) => _emitEvent('shortcut:help', {}), { description: 'Ajuda' });
}

export function destroy() {
  if (_keydownHandler) {
    // @ts-expect-error TS migration - TS2769
    document.removeEventListener('keydown', _keydownHandler);
    _keydownHandler = null;
  }
  _shortcuts.clear();
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, shortcutCount: _shortcuts.size, enabled: _enabled, scope: _scope };
}

export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, shortcutCount: _shortcuts.size, enabled: _enabled };
}

export default {
  init, register, unregister, has, get, getAll, setScope, getScope, enable, disable, isEnabled, clear, registerDefaults, destroy,
  injectEventBus, info, healthCheck, VERSION, MODULE_ID
};
