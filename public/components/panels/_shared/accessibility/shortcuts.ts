// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels/_shared/accessibility/shortcuts
// PURPOSE: Panels Shared - Keyboard Shortcuts
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   register() — exported function
//   unregister() — exported function
//   enable() — exported function
//   disable() — exported function
//   isEnabled() — exported function
//   getRegistered() — exported function
//   destroy() — exported function
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panels/_shared/accessibility/shortcuts';

const _shortcuts = new Map();
let _enabled = true;
let _handler: ((event: KeyboardEvent) => void) | null = null;
let _abortController: AbortController | null = null;

function parseKey(key: string) {
  const parts = key.toLowerCase().split('+');
  return {
    ctrl: parts.includes('ctrl'),
    alt: parts.includes('alt'),
    shift: parts.includes('shift'),
    meta: parts.includes('meta'),
    key: parts.find((p: string) => !['ctrl', 'alt', 'shift', 'meta'].includes(p)) || ''
  };
}

function matchEvent(event: KeyboardEvent, parsed: { ctrl: boolean; alt: boolean; shift: boolean; meta: boolean; key: string }) {
  return event.ctrlKey === parsed.ctrl &&
         event.altKey === parsed.alt &&
         event.shiftKey === parsed.shift &&
         event.metaKey === parsed.meta &&
         event.key.toLowerCase() === parsed.key;
}

function handleKeydown(event: KeyboardEvent) {
  if (!_enabled) return;
  
  for (const [key, { callback, parsed, options }] of _shortcuts) {
    if (matchEvent(event, parsed)) {
      if (options.preventDefault !== false) event.preventDefault();
      if (options.stopPropagation) event.stopPropagation();
      callback(event);
      return;
    }
  }
}

export function register(key: string, callback: (event: KeyboardEvent) => void, options: { preventDefault?: boolean; stopPropagation?: boolean } = {}) {
  const parsed = parseKey(key);
  _shortcuts.set(key, { callback, parsed, options });

  if (!_handler) {
    _handler = handleKeydown;
    _abortController = new AbortController();
    document.addEventListener('keydown', _handler, { signal: _abortController.signal });
  }

  return () => unregister(key);
}

export function unregister(key: string) {
  _shortcuts.delete(key);
}

export function enable() { _enabled = true; }
export function disable() { _enabled = false; }
export function isEnabled() { return _enabled; }

export function getRegistered() {
  return Array.from(_shortcuts.keys());
}

export function destroy() {
  if (_abortController) {
    _abortController.abort();
    _abortController = null;
  }
  _handler = null;
  _shortcuts.clear();
}

export function healthCheck() {
  return { status: 'HEALTHY', enabled: _enabled, shortcutCount: _shortcuts.size, version: VERSION, moduleId: MODULE_ID };
}

export default { register, unregister, enable, disable, isEnabled, getRegistered, destroy, healthCheck, VERSION, MODULE_ID };
