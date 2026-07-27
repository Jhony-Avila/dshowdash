// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-state-persistence
// PURPOSE: Container State Persistence Component
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MAIN_EVENTS from /core/runtime/events/catalog/main.events.js
//   CONTAINER_EVENTS from /core/runtime/events/catalog/container.events.js
//   createLogger from ../utils/logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectEventBus() — exported function
//   STORAGE_TYPE — exported value
//   createStatePersistence() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   eventType
// LISTENS (eventos):
//   CONTAINER_EVENTS.COLLAPSED
//   CONTAINER_EVENTS.DRAG_END
//   CONTAINER_EVENTS.FULLSCREEN
//   CONTAINER_EVENTS.RESIZE_END
//   MAIN_EVENTS.SPLIT_RESIZE
//   MAIN_EVENTS.TAB_CHANGED
//   MAIN_EVENTS.TAB_CLOSED
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { MAIN_EVENTS } from '/core/runtime/events/catalog/main.events.js';
import { CONTAINER_EVENTS } from '/core/runtime/events/catalog/container.events.js';

export const VERSION = '8.2.0-ENTERPRISE';
export const MODULE_ID = 'container-state-persistence';
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
  if (options.storageType !== undefined && !['local', 'session', 'memory'].includes(options.storageType as string)) errors.push('storageType must be local|session|memory');
  if (options.storageKey !== undefined && typeof options.storageKey !== 'string') errors.push('storageKey must be a string');
  if (options.autoSave !== undefined && typeof options.autoSave !== 'boolean') errors.push('autoSave must be a boolean');
  if (options.autoSaveDelay !== undefined && (typeof options.autoSaveDelay !== 'number' || options.autoSaveDelay < 0)) errors.push('autoSaveDelay must be a positive number');
  if (errors.length > 0) logger.warn('Invalid options', { errors });
  return errors.length === 0;
}

export const STORAGE_TYPE = { LOCAL: 'local', SESSION: 'session', MEMORY: 'memory' };

export function createStatePersistence(container: HTMLElement, options: Record<string, any> = {}) {
  _validateOptions(options);
  const { storageType = STORAGE_TYPE.LOCAL, storageKey, autoSave = true, autoSaveDelay = 500, persistedFields = ['position', 'size', 'minimized', 'fullscreen', 'tabs', 'splitSizes'], onSave, onRestore, onError, eventBus } = options;
  if (eventBus && !_injectedEventBus) _injectedEventBus = eventBus;

  let _initialized = false;
  let _storage: { getItem: (key: string) => string | null; setItem: (key: string, value: string) => void; removeItem: (key: string) => void } | null = null;
  let _state = {} as Record<string, unknown>;
  let _saveTimeout: ReturnType<typeof setTimeout> | null = null;
  let _isRestoring = false;
  let _eventUnsubscribers: ((() => void) | null)[] = [];
  let _memoryStore: Record<string, any> = {};

  function _getKey() { return storageKey || `dsd-container-${container.id}`; }

  function _getStorage() {
    if (storageType === STORAGE_TYPE.MEMORY) return { getItem: (k: string) => _memoryStore[k] || null, setItem: (k: string, v: string) => { _memoryStore[k] = v; }, removeItem: (k: string) => { delete _memoryStore[k]; } };
    if (storageType === STORAGE_TYPE.SESSION) return typeof sessionStorage !== 'undefined' ? sessionStorage : null;
    return typeof localStorage !== 'undefined' ? localStorage : null;
  }

  function _collectState() {
    const state = { timestamp: Date.now(), containerId: container.id };
    if (persistedFields.includes('position')) {
      const rect = container.getBoundingClientRect();
      (state as Record<string, unknown>).position = { x: rect.left, y: rect.top };
    }
    if (persistedFields.includes('size')) {
      (state as Record<string, unknown>).size = { width: container.offsetWidth, height: container.offsetHeight };
    }
    if (persistedFields.includes('minimized')) {
      (state as Record<string, unknown>).minimized = container.classList.contains('dsd-container--minimized');
    }
    if (persistedFields.includes('fullscreen')) {
      (state as Record<string, unknown>).fullscreen = container.classList.contains('dsd-container--fullscreen');
    }
    if (persistedFields.includes('tabs')) {
      const tabManager = (container as unknown as Record<string, unknown>)._tabManagerComponent as Record<string, (...args: unknown[]) => unknown> | undefined;

      if (tabManager) (state as Record<string, unknown>).tabs = { activeTabId: (tabManager.getActiveTab() as Record<string, unknown> | null)?.id };
    }
    if (persistedFields.includes('splitSizes')) {
      const splitView = (container as unknown as Record<string, unknown>)._splitViewComponent as Record<string, (...args: unknown[]) => unknown> | undefined;

      if (splitView) (state as Record<string, unknown>).splitSizes = splitView.getSizes();
    }
    return state;
  }

  function _applyState(state: Record<string, unknown>) {
    if (!state) return false;
    _isRestoring = true;
    try {
      if ((state as Record<string, unknown>).position && persistedFields.includes('position')) {
        const drag = (container as unknown as Record<string, unknown>)._dragComponent as Record<string, (...args: unknown[]) => unknown> | undefined;
        if (drag) drag.setPosition((state.position as Record<string, number>).x, (state.position as Record<string, number>).y);
      }
      if ((state as Record<string, unknown>).size && persistedFields.includes('size')) {
        const resize = (container as unknown as Record<string, unknown>)._resizeComponent as Record<string, (...args: unknown[]) => unknown> | undefined;
        if (resize) resize.setSize((state.size as Record<string, number>).width, (state.size as Record<string, number>).height);
      }
      if ((state as Record<string, unknown>).minimized !== undefined && persistedFields.includes('minimized')) {
        const controls = (container as unknown as Record<string, unknown>)._controlsComponent as Record<string, (...args: unknown[]) => unknown> | undefined;
        if (controls && (state as Record<string, unknown>).minimized !== controls.isMinimized()) controls.minimize();
      }
      if ((state as Record<string, unknown>).fullscreen !== undefined && persistedFields.includes('fullscreen')) {
        const controls = (container as unknown as Record<string, unknown>)._controlsComponent as Record<string, (...args: unknown[]) => unknown> | undefined;
        if (controls && (state as Record<string, unknown>).fullscreen !== controls.isFullscreen()) controls.maximize();
      }
      if ((state as Record<string, unknown>).tabs && persistedFields.includes('tabs')) {
        const tabManager = (container as unknown as Record<string, unknown>)._tabManagerComponent as Record<string, (...args: unknown[]) => unknown> | undefined;
        if (tabManager && ((state as Record<string, unknown>).tabs as Record<string, unknown>)?.activeTabId) tabManager.activateTab(((state as Record<string, unknown>).tabs as Record<string, unknown>).activeTabId);
      }
      if ((state as Record<string, unknown>).splitSizes && persistedFields.includes('splitSizes')) {
        const splitView = (container as unknown as Record<string, unknown>)._splitViewComponent as Record<string, (...args: unknown[]) => unknown> | undefined;
        if (splitView) splitView.setSizes((state as Record<string, unknown>).splitSizes);
      }
      _state = state;
      onRestore?.(state);
      return true;
    } catch (e) {
      onError?.('apply_state_failed', e);
      return false;
    } finally {
      Promise.resolve().then(() => { _isRestoring = false; });
    }
  }

  function _scheduleSave() {
    if (!autoSave || _isRestoring) return;
    if (_saveTimeout) clearTimeout(_saveTimeout);
    _saveTimeout = setTimeout(() => persistence.save(), autoSaveDelay);
  }

  function _setupAutoSave() {
    if (!autoSave) return;
    const eb = _getEventBus();
    if (!eb?.on) return;
    const containerId = container.id;
    const filterByContainer = (data: Record<string, unknown>) => !containerId || !data.containerId || data.containerId === containerId;
    _eventUnsubscribers.push(eb.on(CONTAINER_EVENTS.RESIZE_END, (data: Record<string, unknown>) => { if (filterByContainer(data)) _scheduleSave(); }));
    _eventUnsubscribers.push(eb.on(CONTAINER_EVENTS.DRAG_END, (data: Record<string, unknown>) => { if (filterByContainer(data)) _scheduleSave(); }));
    _eventUnsubscribers.push(eb.on(CONTAINER_EVENTS.COLLAPSED, (data: Record<string, unknown>) => { if (filterByContainer(data)) _scheduleSave(); }));
    _eventUnsubscribers.push(eb.on(CONTAINER_EVENTS.FULLSCREEN, (data: Record<string, unknown>) => { if (filterByContainer(data)) _scheduleSave(); }));
    _eventUnsubscribers.push(eb.on(MAIN_EVENTS.TAB_CHANGED, (data: Record<string, unknown>) => { if (filterByContainer(data)) _scheduleSave(); }));
    _eventUnsubscribers.push(eb.on(MAIN_EVENTS.TAB_CLOSED, (data: Record<string, unknown>) => { if (filterByContainer(data)) _scheduleSave(); }));
    _eventUnsubscribers.push(eb.on(MAIN_EVENTS.SPLIT_RESIZE, (data: Record<string, unknown>) => { if (filterByContainer(data)) _scheduleSave(); }));
  }

  function _removeAutoSave() {
    _eventUnsubscribers.forEach((unsub) => { if (typeof unsub === 'function') unsub(); });
    _eventUnsubscribers = [];
  }

  const persistence = {
    init() {
      if (_initialized) return this;
      _storage = _getStorage();
      _setupAutoSave();
      _initialized = true;
      return this;
    },
    save() {
      if (!_storage || _isRestoring) return false;
      try {
        const state = _collectState();
        const json = JSON.stringify(state);
        _storage.setItem(_getKey(), json);
        _state = state;
        onSave?.(state);
        _emitEvent(MAIN_EVENTS.STATE_SAVE, { state, containerId: container.id });
        return true;
      } catch (e) {
        onError?.('save_failed', e);
        return false;
      }
    },
    restore() {
      if (!_storage) return false;
      try {
        const json = _storage.getItem(_getKey());
        if (!json) return false;
        const state = JSON.parse(json);
        const success = _applyState(state);
        if (success) _emitEvent(MAIN_EVENTS.STATE_RESTORE, { state, containerId: container.id });
        return success;
      } catch (e) {
        onError?.('restore_failed', e);
        return false;
      }
    },
    clear() {
      if (!_storage) return false;
      try { _storage.removeItem(_getKey()); _state = {} as Record<string, unknown>; return true; }
      catch (e) { onError?.('clear_failed', e); return false; }
    },
    getState() { return { ..._state }; },
    setState(partialState: Record<string, unknown>) { _state = { ..._state, ...partialState }; _scheduleSave(); return this; },
    hasState() { return _storage ? _storage.getItem(_getKey()) !== null : false; },
    getTimestamp() { return _state.timestamp || null; },
    isInitialized() { return _initialized; },
    isRestoring() { return _isRestoring; },
    destroy() {
      _removeAutoSave();
      if (_saveTimeout) { clearTimeout(_saveTimeout); _saveTimeout = null; }
      _state = {} as Record<string, unknown>;
      _initialized = false;
      _isRestoring = false;
    },
    healthCheck() {
      return { status: _initialized ? 'HEALTHY' : 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID, storageType, hasState: persistence.hasState(), timestamp: _state.timestamp, hasInjectedEventBus: !!_injectedEventBus, isRestoring: _isRestoring, listenersViaEventBus: _eventUnsubscribers.length, hasValidation: true };
    }
  };
  return persistence;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, hasInjectedEventBus: !!_injectedEventBus, hasValidation: true }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, hasInjectedEventBus: !!_injectedEventBus, hasValidation: true }; }

export default { createStatePersistence, injectEventBus, info, healthCheck, VERSION, MODULE_ID, STORAGE_TYPE };
