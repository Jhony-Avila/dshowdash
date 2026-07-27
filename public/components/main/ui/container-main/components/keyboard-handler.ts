// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-keyboard-handler
// PURPOSE: Container Keyboard Handler Component
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CONTAINER_EVENTS from /core/runtime/events/catalog/container.events.js
//   createLogger from ../utils/logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectEventBus() — exported function
//   DEFAULT_SHORTCUTS — exported value
//   createKeyboardHandler() — exported function
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

import { CONTAINER_EVENTS } from '/core/runtime/events/catalog/container.events.js';

export const VERSION = '8.2.0-ENTERPRISE';
export const MODULE_ID = 'container-keyboard-handler';
import { createLogger } from '../utils/logger.js';
const logger = createLogger(MODULE_ID);

let _injectedEventBus: { emit?: (event: string, data: Record<string, unknown>) => void; on?: (event: string, callback: (data: Record<string, unknown>) => void) => (() => void) } | null = null;

export function injectEventBus(eventBus: typeof _injectedEventBus) { _injectedEventBus = eventBus; }

function _getEventBus() { return _injectedEventBus; }

function _emitEvent(eventType: string, payload: Record<string, unknown>) {
  const eb = _getEventBus();
  if (eb?.emit) { eb.emit(eventType, { source: MODULE_ID, timestamp: Date.now(), ...payload }); return true; }
  return false;
}

// Options validation
function _validateOptions(options: Record<string, unknown>) {
  const errors = [];
  if (options.shortcuts !== undefined && typeof options.shortcuts !== 'object') errors.push('shortcuts must be an object');
  if (options.enabled !== undefined && typeof options.enabled !== 'boolean') errors.push('enabled must be a boolean');
  if (options.preventDefaults !== undefined && typeof options.preventDefaults !== 'boolean') errors.push('preventDefaults must be a boolean');
  if (options.onAction !== undefined && typeof options.onAction !== 'function') errors.push('onAction must be a function');
  if (errors.length > 0) logger.warn('Invalid options', { errors });
  return errors.length === 0;
}

export const DEFAULT_SHORTCUTS = {
  'Escape': 'escape', 'F5': 'refresh', 'F11': 'fullscreen',
  'Ctrl+M': 'minimize', 'Ctrl+Shift+M': 'maximize', 'Ctrl+W': 'close',
  'Ctrl+R': 'refresh', 'Alt+Enter': 'fullscreen'
};

export function createKeyboardHandler(container: HTMLElement, options: Record<string, any> = {}) {
  _validateOptions(options);
  const { shortcuts = DEFAULT_SHORTCUTS, onAction, enabled = true, preventDefaults = true, eventBus } = options;
  if (eventBus && !_injectedEventBus) _injectedEventBus = eventBus;

  let _initialized = false;
  let _enabled = enabled;
  let _boundHandler: EventListener | null = null;
  let _shortcuts = { ...shortcuts };

  function _normalizeKey(e: KeyboardEvent) {
    const parts = [];
    if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
    if (e.shiftKey) parts.push('Shift');
    if (e.altKey) parts.push('Alt');
    let key = e.key;
    if (key === ' ') key = 'Space';
    if (key.length === 1) key = key.toUpperCase();
    parts.push(key);
    return parts.join('+');
  }

  function _handleKeydown(e: Event) {
    if (!_enabled) return;
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
    const combo = _normalizeKey(e as KeyboardEvent);
    const action = _shortcuts[combo];
    if (action) {
      if (preventDefaults) { e.preventDefault(); e.stopPropagation(); }
      onAction?.(action, e);
      _emitEvent(CONTAINER_EVENTS.KEYBOARD_ACTION, { action, combo, containerId: container.id });
    }
  }

  const keyboard = {
    init() {
      if (_initialized) return this;
      _boundHandler = _handleKeydown.bind(this);
      if (_enabled) {
        container.addEventListener('keydown', _boundHandler as EventListener);
        document.addEventListener('keydown', _boundHandler as EventListener);
      }
      container.setAttribute('data-keyboard-enabled', String(_enabled));
      _initialized = true;
      return this;
    },
    enable() {
      _enabled = true;
      container.setAttribute('data-keyboard-enabled', 'true');
      if (_initialized && _boundHandler) {
        container.addEventListener('keydown', _boundHandler as EventListener);
        document.addEventListener('keydown', _boundHandler as EventListener);
      }
      return this;
    },
    disable() {
      _enabled = false;
      container.setAttribute('data-keyboard-enabled', 'false');
      if (_boundHandler) {
        container.removeEventListener('keydown', _boundHandler as EventListener);
        document.removeEventListener('keydown', _boundHandler as EventListener);
      }
      return this;
    },
    isEnabled() { return _enabled; },
    isInitialized() { return _initialized; },
    addShortcut(combo: string, action: string) {
      if (typeof combo !== 'string' || !action) return this;
      _shortcuts[combo] = action;
      return this;
    },
    removeShortcut(combo: string) { delete _shortcuts[combo]; return this; },
    getShortcuts() { return { ..._shortcuts }; },
    destroy() {
      this.disable();
      container.removeAttribute('data-keyboard-enabled');
      _boundHandler = null;
      _shortcuts = {};
      _initialized = false;
    },
    healthCheck() {
      return { status: _initialized ? 'HEALTHY' : 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID, enabled: _enabled, shortcutCount: Object.keys(_shortcuts).length, hasInjectedEventBus: !!_injectedEventBus, hasValidation: true };
    }
  };
  return keyboard;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, hasInjectedEventBus: !!_injectedEventBus, hasValidation: true }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, hasInjectedEventBus: !!_injectedEventBus, hasValidation: true }; }

export default { createKeyboardHandler, injectEventBus, info, healthCheck, VERSION, MODULE_ID, DEFAULT_SHORTCUTS };
