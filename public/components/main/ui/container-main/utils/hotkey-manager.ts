// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-PHASE6-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:hotkey-manager
// PURPOSE: Hotkey Manager - Atalhos de teclado globais
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ./logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   MODIFIERS — exported value
//   SCOPES — exported value
//   createHotkeyManager() — exported function
//   getHotkeyManager() — exported function
//   resetHotkeyManager() — exported function
//   registerHotkey() — exported function
//   unregisterHotkey() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'keydown'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createLogger } from './logger.js';

export const VERSION = '1.0.0-PHASE6';
export const MODULE_ID = 'container-main:hotkey-manager';

export const MODIFIERS = Object.freeze({ CTRL: 'ctrl', ALT: 'alt', SHIFT: 'shift', META: 'meta' });
export const SCOPES = Object.freeze({ GLOBAL: 'global', INPUT: 'input', MODAL: 'modal' });

export function createHotkeyManager(options: Record<string, unknown> = {}) {
  const { preventDefault = true, stopPropagation = true, enableInInputs = false, debug = false } = options;

  const _logger = createLogger(MODULE_ID);
  const _hotkeys = new Map();
  const _scopes = new Set([SCOPES.GLOBAL]);
  let _enabled = true;
  let _counter = 0;
  let _metrics = { triggered: 0, blocked: 0 };

  function _normalizeKey(key: string) {
    return key.toLowerCase().replace('control', 'ctrl').replace('command', 'meta').replace('option', 'alt').replace('escape', 'esc').replace('arrowup', 'up').replace('arrowdown', 'down').replace('arrowleft', 'left').replace('arrowright', 'right').replace(' ', 'space');
  }

  function _parseCombo(combo: Record<string, unknown>) {
    // @ts-expect-error TS migration - TS2339
    const parts = (combo.toLowerCase as (...args: unknown[]) => unknown)().split('+').map((p: unknown) => (p as string).trim());
    const modifiers = { ctrl: false, alt: false, shift: false, meta: false };
    let key = '';

    for (const part of parts) {
      if (part === 'ctrl' || part === 'control') modifiers.ctrl = true;
      else if (part === 'alt' || part === 'option') modifiers.alt = true;
      else if (part === 'shift') modifiers.shift = true;
      else if (part === 'meta' || part === 'cmd' || part === 'command') modifiers.meta = true;
      else key = _normalizeKey(part);
    }

    return { modifiers, key, combo: `${modifiers.ctrl ? 'ctrl+' : ''}${modifiers.alt ? 'alt+' : ''}${modifiers.shift ? 'shift+' : ''}${modifiers.meta ? 'meta+' : ''}${key}` };
  }

  function _matchesModifiers(e: Event, modifiers: Record<string, unknown>) {
    // @ts-expect-error TS migration - TS2339
    return e.ctrlKey === modifiers.ctrl && e.altKey === modifiers.alt && e.shiftKey === modifiers.shift && e.metaKey === modifiers.meta;
  }

  function _isInputElement(el: HTMLElement) {
    const tagName = el?.tagName?.toLowerCase();
    return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || el?.isContentEditable;
  }

  function _handleKeydown(e: KeyboardEvent) {
    if (!_enabled) return;

    const key = _normalizeKey(e.key);
    // @ts-expect-error TS migration - TS2345
    const isInput = _isInputElement(e.target);

    for (const [id, config] of _hotkeys) {
      if (config.key !== key) continue;
      if (!_matchesModifiers(e, config.modifiers)) continue;
      if (!_scopes.has(config.scope) && config.scope !== SCOPES.GLOBAL) continue;
      if (isInput && !config.enableInInputs && !enableInInputs) { _metrics.blocked++; continue; }
      if (config.disabled) continue;

      if (debug) _logger.debug(`Hotkey triggered: ${config.combo}`);

      if (config.preventDefault ?? preventDefault) e.preventDefault();
      if (config.stopPropagation ?? stopPropagation) e.stopPropagation();

      try {
        config.handler(e, config);
        _metrics.triggered++;
      } catch (err) {
        _logger.error(`Hotkey error [${config.combo}]:`, err);
      }

      if (!config.allowMultiple) break;
    }
  }

  document.addEventListener('keydown', _handleKeydown);

  const manager = {
    register(combo: unknown, handler: (...args: unknown[]) => void, options: Record<string, unknown> = {}) {
      const parsed = _parseCombo((combo as Record<string, unknown>));
      const id = options.id || `hk-${++_counter}`;

      const config = {
        id,
        combo: parsed.combo,
        key: parsed.key,
        modifiers: parsed.modifiers,
        handler,
        scope: options.scope || SCOPES.GLOBAL,
        description: options.description || '',
        enableInInputs: options.enableInInputs || false,
        preventDefault: options.preventDefault,
        stopPropagation: options.stopPropagation,
        allowMultiple: options.allowMultiple || false,
        disabled: false
      };

      _hotkeys.set(id, config);
      return id;
    },

    unregister(id: string) {
      return _hotkeys.delete(id);
    },

    enable(id: string) {
      const hk = _hotkeys.get(id);
      if (hk) hk.disabled = false;
    },

    disable(id: string) {
      const hk = _hotkeys.get(id);
      if (hk) hk.disabled = true;
    },

    enableAll() { _enabled = true; },
    disableAll() { _enabled = false; },

    setScope(scope: string) {
      _scopes.clear();
      _scopes.add(SCOPES.GLOBAL);
      // @ts-expect-error TS migration - TS2345
      if (scope !== SCOPES.GLOBAL) _scopes.add(scope);
    },

    // @ts-expect-error TS migration - TS2345
    addScope(scope: string) { _scopes.add(scope); },
    // @ts-expect-error TS migration - TS2345
    removeScope(scope: string) { if (scope !== SCOPES.GLOBAL) _scopes.delete(scope); },
    getScopes() { return [..._scopes]; },

    list() {
      return Array.from(_hotkeys.values()).map(h => ({
        id: h.id,
        combo: h.combo,
        description: h.description,
        scope: h.scope,
        disabled: h.disabled
      }));
    },

    getByCombo(combo: unknown) {
      const parsed = _parseCombo((combo as Record<string, unknown>));
      return Array.from(_hotkeys.values()).filter(h => h.combo === parsed.combo);
    },

    trigger(combo: unknown) {
      const parsed = _parseCombo((combo as Record<string, unknown>));
      for (const [id, config] of _hotkeys) {
        if (config.combo === parsed.combo && !config.disabled) {
          config.handler(null, config);
          _metrics.triggered++;
          return true;
        }
      }
      return false;
    },

    getMetrics() { return { ..._metrics, registered: _hotkeys.size, scopes: [..._scopes] }; },
    resetMetrics() { _metrics = { triggered: 0, blocked: 0 }; },

    healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, registered: _hotkeys.size, enabled: _enabled, metrics: _metrics }; },
    info() { return { moduleId: MODULE_ID, version: VERSION, registered: _hotkeys.size, enabled: _enabled, scopes: [..._scopes], modifiers: Object.keys(MODIFIERS) }; },

    destroy() {
      document.removeEventListener('keydown', _handleKeydown);
      _hotkeys.clear();
      _scopes.clear();
    }
  };

  return manager;
}

let _instance: Record<string, unknown> | null = null;
export function getHotkeyManager(options: Record<string, unknown> = {}) { if (!_instance) _instance = createHotkeyManager(options); return _instance; }
export function resetHotkeyManager() { if (_instance) { (_instance.destroy as (...args: unknown[]) => unknown)(); _instance = null; } }

export function registerHotkey(combo: Record<string, unknown>, handler: (...args: unknown[]) => void, options: Record<string, unknown>) { return (getHotkeyManager().register as (...args: unknown[]) => unknown)(combo, handler, options); }
export function unregisterHotkey(id: string) { return (getHotkeyManager().unregister as (...args: unknown[]) => unknown)(id); }

export function info() { return { moduleId: MODULE_ID, version: VERSION, modifiers: Object.keys(MODIFIERS), scopes: Object.keys(SCOPES) }; }
export function healthCheck() { if (_instance) return (_instance.healthCheck as (...args: unknown[]) => unknown)(); return { status: 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID }; }

export default { VERSION, MODULE_ID, MODIFIERS, SCOPES, createHotkeyManager, getHotkeyManager, resetHotkeyManager, registerHotkey, unregisterHotkey, info, healthCheck };
