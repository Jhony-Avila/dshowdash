// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels/panel-integration-chatgpt/accessibility/shortcuts
// PURPOSE: Integração  - Keyboard Shortcuts
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   register() — exported function
//   unregister() — exported function
//   handleKeydown() — exported function
//   enable() — exported function
//   disable() — exported function
//   isEnabled() — exported function
//   getShortcuts() — exported function
//   healthCheck() — exported function
//   info() — exported function
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panels/panel-integration-chatgpt/accessibility/shortcuts';

const _shortcuts = new Map();
let _enabled = true;

export function register(key: string, callback: (event: KeyboardEvent) => void, description = '') {
  _shortcuts.set(key.toLowerCase(), { callback, description });
}

export function unregister(key: string) {
  _shortcuts.delete(key.toLowerCase());
}

export function handleKeydown(event: KeyboardEvent) {
  if (!_enabled) return;
  
  const key = [];
  if (event.ctrlKey) key.push('ctrl');
  if (event.altKey) key.push('alt');
  if (event.shiftKey) key.push('shift');
  key.push(event.key.toLowerCase());
  
  const combo = key.join('+');
  const shortcut = _shortcuts.get(combo);
  
  if (shortcut) {
    event.preventDefault();
    shortcut.callback(event);
  }
}

export function enable() { _enabled = true; }
export function disable() { _enabled = false; }
export function isEnabled() { return _enabled; }
export function getShortcuts() { return Array.from(_shortcuts.entries()); }

export function healthCheck() {
  return { status: 'healthy', version: VERSION, moduleId: MODULE_ID, enabled: _enabled, shortcutCount: _shortcuts.size };
}

export function info() {
  return { version: VERSION, moduleId: MODULE_ID, enabled: _enabled, shortcuts: getShortcuts(), healthCheck: healthCheck() };
}

export default { register, unregister, handleKeydown, enable, disable, isEnabled, getShortcuts, healthCheck, info, VERSION, MODULE_ID };
