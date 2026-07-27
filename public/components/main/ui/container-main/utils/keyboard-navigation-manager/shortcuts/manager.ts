// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: manager
// PURPOSE: Keyboard Navigation Manager - Shortcuts Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getGlobalShortcuts, incrementMetric from ../state.js
//   _emit from ../helpers/logger.js
//
// PROVIDES:
//   _getShortcutKey() — exported function
//   _handleGlobalKeyDown() — exported function
//   registerShortcut() — exported function
//   unregisterShortcut() — exported function
//   getShortcuts() — exported function
//   enableShortcut() — exported function
//   disableShortcut() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { getGlobalShortcuts, incrementMetric } from '../state.js';
import { _emit } from '../helpers/logger.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.keyboard-navigation-manager.shortcuts.manager';

export function _getShortcutKey(e: KeyboardEvent) {
  const parts = [];
  if (e.ctrlKey) parts.push('ctrl');
  if (e.altKey) parts.push('alt');
  if (e.shiftKey) parts.push('shift');
  if (e.metaKey) parts.push('meta');
  parts.push(e.key.toLowerCase());
  return parts.join('+');
}

export function _handleGlobalKeyDown(e: Event) {
  incrementMetric('keyPresses');
  
  // @ts-expect-error TS migration - TS2345
  const shortcutKey = _getShortcutKey(e);
  const shortcuts = getGlobalShortcuts();
  
  if (shortcuts.has(shortcutKey)) {
    const shortcut = shortcuts.get(shortcutKey);
    if (!shortcut.disabled) {
      e.preventDefault();
      shortcut.handler(e);
      incrementMetric('shortcutsTriggered');
      _emit('shortcutTriggered', { key: shortcutKey });
      return;
    }
  }
}

export function registerShortcut(shortcut: Record<string, unknown>, handler: (...args: unknown[]) => void, options: Record<string, unknown> = {}) {
  const key = (shortcut.toLowerCase as (...args: unknown[]) => unknown)();
  
  getGlobalShortcuts().set(key, {
    handler,
    description: options.description || '',
    disabled: false,
    scope: options.scope || 'global'
  });
  
  _emit('shortcutRegistered', { shortcut: key });
  return true;
}

export function unregisterShortcut(shortcut: Record<string, unknown>) {
  const key = (shortcut.toLowerCase as (...args: unknown[]) => unknown)();
  const result = getGlobalShortcuts().delete(key);
  if (result) {
    _emit('shortcutUnregistered', { shortcut: key });
  }
  return result;
}

export function getShortcuts() {
  const shortcuts: unknown[] = [];
  getGlobalShortcuts().forEach((value, key) => {
    shortcuts.push({
      shortcut: key,
      description: value.description,
      disabled: value.disabled,
      scope: value.scope
    });
  });
  return shortcuts;
}

export function enableShortcut(shortcut: Record<string, unknown>) {
  const key = (shortcut.toLowerCase as (...args: unknown[]) => unknown)();
  const entry = getGlobalShortcuts().get(key);
  if (entry) {
    entry.disabled = false;
    return true;
  }
  return false;
}

export function disableShortcut(shortcut: Record<string, unknown>) {
  const key = (shortcut.toLowerCase as (...args: unknown[]) => unknown)();
  const entry = getGlobalShortcuts().get(key);
  if (entry) {
    entry.disabled = true;
    return true;
  }
  return false;
}
