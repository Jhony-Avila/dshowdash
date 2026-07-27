
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:state-persistence
// PURPOSE: Container State Persistence - Persistência de estado do container
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getStorageManager, STORAGE_TYPES from ./storage-manager.js
//   createLogger from ./logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   STORAGE_KEYS — exported value
//   createContainerStatePersistence() — exported function
//   getContainerStatePersistence() — exported function
//   resetContainerStatePersistence() — exported function
//   info() — exported function
//   healthCheck() — exported function
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

import { getStorageManager, STORAGE_TYPES } from './storage-manager.js';
import { createLogger } from './logger.js';

export const VERSION = '1.0.0';
export const MODULE_ID = 'container-main:state-persistence';

// Chaves de storage
export const STORAGE_KEYS = Object.freeze({
  CONTAINER_STATE: 'container_state',
  LAYOUT_PREFS: 'layout_preferences',
  PANEL_HISTORY: 'panel_history',
  USER_SETTINGS: 'user_settings'
});

// Estado padrão
const DEFAULT_STATE = Object.freeze({
  collapsed: false,
  fullscreen: false,
  width: null,
  height: null,
  position: { x: null, y: null },
  zoomLevel: 100,
  splitView: null,
  lastPanel: null,
  panelHistory: [],
  customSettings: {}
});

// Cria o serviço de persistência
export function createContainerStatePersistence(options: Record<string, unknown> = {}) {
  const {
    containerId = 'container-main',
    autoSave = true,
    debounceMs = 500,
    maxHistorySize = 20,
    storageType = STORAGE_TYPES.LOCAL
  } = options;

  const _logger = createLogger(MODULE_ID);
  const _storage = getStorageManager({ prefix: 'dsd_' });
  const _namespace = (_storage.namespace as (...args: unknown[]) => unknown)(`container:${containerId}`);
  
  let _state = { ...DEFAULT_STATE };
  let _initialized = false;
  let _saveTimeout: unknown = null;
  let _listeners: Set<Function> = new Set();

  // Debounce save
  function _debouncedSave() {
    // @ts-expect-error TS migration - TS2769
    if (_saveTimeout) clearTimeout(_saveTimeout);
    _saveTimeout = setTimeout(() => _save(), Number(debounceMs));
  }

  // Salva estado
  async function _save() {
    try {
      await ((_namespace as Record<string, unknown>).set as (...args: unknown[]) => unknown)(STORAGE_KEYS.CONTAINER_STATE, _state, { storage: storageType });
      _notifyListeners('saved', _state);
      _logger.debug('State saved:', _state);
    } catch (error) {
      _logger.error('Failed to save state:', error);
    }
  }

  // Notifica listeners
  function _notifyListeners(event: string, data: Record<string, unknown>) {
    _listeners.forEach(listener => {
      try {
        listener({ event, data, timestamp: Date.now() });
      } catch (e) {
        // @ts-expect-error strict migration — TS2345
        _logger.warn('Listener error:', e);
      }
    });
  }

  const persistence = {
    // Inicializa e restaura estado
    async init() {
      if (_initialized) return _state;

      try {
        const saved = await ((_namespace as Record<string, unknown>).get as (...args: unknown[]) => unknown)(STORAGE_KEYS.CONTAINER_STATE, { 
          storage: storageType,
          defaultValue: null 
        });

        if (saved) {
          // @ts-expect-error TS migration - TS2740
          _state = { ...(DEFAULT_STATE as Record<string, unknown>), ...(saved as Record<string, unknown>) };
          _logger.debug('State restored:', _state);
          _notifyListeners('restored', _state);
        } else {
          _state = { ...DEFAULT_STATE };
          _logger.debug('No saved state, using defaults', {});
        }

        _initialized = true;
        return _state;
      } catch (error) {
        _logger.error('Failed to restore state:', error);
        _state = { ...DEFAULT_STATE };
        _initialized = true;
        return _state;
      }
    },

    // Getters
    getState() {
      return { ..._state };
    },

    get(key: string) {
      return (_state as Record<string, unknown>)[key];
    },

    isCollapsed() {
      return _state.collapsed;
    },

    isFullscreen() {
      return _state.fullscreen;
    },

    getZoomLevel() {
      return _state.zoomLevel;
    },

    getLastPanel() {
      return _state.lastPanel;
    },

    getPanelHistory() {
      return [..._state.panelHistory];
    },

    getSplitView() {
      // @ts-expect-error strict migration — TS2698
      return _state.splitView ? { ..._state.splitView } : null;
    },

    // Setters
    set(key: string, value: unknown) {
      if ((_state as Record<string, unknown>)[key] !== value) {
        (_state as Record<string, unknown>)[key] = value;
        _notifyListeners('changed', { key, value });
        if (autoSave) _debouncedSave();
      }
      return this;
    },

    setCollapsed(collapsed: boolean) {
      return this.set('collapsed', Boolean(collapsed));
    },

    setFullscreen(fullscreen: boolean) {
      return this.set('fullscreen', Boolean(fullscreen));
    },

    setZoomLevel(level: string) {
      // @ts-expect-error TS migration - TS2345
      const clamped = Math.max(50, Math.min(200, level));
      return this.set('zoomLevel', clamped);
    },

    setSize(width: number, height: number) {
      // @ts-expect-error strict migration — TS2322
      _state.width = width;
      // @ts-expect-error strict migration — TS2322
      _state.height = height;
      _notifyListeners('changed', { key: 'size', value: { width, height } });
      if (autoSave) _debouncedSave();
      return this;
    },

    setPosition(x: number, y: number) {
      // @ts-expect-error strict migration — TS2322
      _state.position = { x, y };
      _notifyListeners('changed', { key: 'position', value: { x, y } });
      if (autoSave) _debouncedSave();
      return this;
    },

    setSplitView(config: Record<string, unknown>) {
      // @ts-expect-error strict migration — TS2322
      _state.splitView = config;
      _notifyListeners('changed', { key: 'splitView', value: config });
      if (autoSave) _debouncedSave();
      return this;
    },

    // Panel navigation history
    recordPanelVisit(panelId: string, metadata = {}) {
      if (!panelId) return this;

      // @ts-expect-error strict migration — TS2322
      _state.lastPanel = panelId;
      
      // Remove duplicate if exists
      // @ts-expect-error strict migration — TS2339
      _state.panelHistory = _state.panelHistory.filter(p => p.panelId !== panelId);
      
      // Add to front
      // @ts-expect-error strict migration — TS2345
      _state.panelHistory.unshift({
        panelId,
        timestamp: Date.now(),
        ...metadata
      });

      // Trim to max size
      if (_state.panelHistory.length > Number(maxHistorySize)) {
        _state.panelHistory = _state.panelHistory.slice(0, Number(maxHistorySize));
      }

      _notifyListeners('panelVisited', { panelId, history: _state.panelHistory });
      if (autoSave) _debouncedSave();
      return this;
    },

    clearPanelHistory() {
      _state.panelHistory = [];
      _state.lastPanel = null;
      if (autoSave) _debouncedSave();
      return this;
    },

    // Custom settings
    setCustomSetting(key: string, value: unknown) {
      (_state.customSettings as Record<string, unknown>)[key] = value;
      _notifyListeners('customSettingChanged', { key, value });
      if (autoSave) _debouncedSave();
      return this;
    },

    getCustomSetting(key: string, defaultValue: string | null = null) {
      return (_state.customSettings as Record<string, unknown>)[key] ?? defaultValue;
    },

    // Bulk operations
    async setState(newState: string) {
      // @ts-expect-error TS migration - TS2740, TS2352
      _state = { ...(DEFAULT_STATE as unknown as Record<string, unknown>), ...(_state as Record<string, unknown>), ...(newState as Record<string, unknown>) };
      _notifyListeners('stateUpdated', _state);
      if (autoSave) await _save();
      return this;
    },

    async merge(partialState: unknown) {
      Object.assign(_state, partialState);
      _notifyListeners('stateMerged', (partialState as Record<string, unknown>));
      if (autoSave) await _save();
      return this;
    },

    // Save/Reset
    async save() {
      // @ts-expect-error TS migration - TS2769
      if (_saveTimeout) clearTimeout(_saveTimeout);
      await _save();
      return this;
    },

    async reset() {
      _state = { ...DEFAULT_STATE };
      await _save();
      _notifyListeners('reset', _state);
      return this;
    },

    async clear() {
      await ((_namespace as Record<string, unknown>).clear as (...args: unknown[]) => unknown)({ storage: storageType });
      _state = { ...DEFAULT_STATE };
      // @ts-expect-error strict migration — TS2345
      _notifyListeners('cleared', null);
      return this;
    },

    // Event listeners
    subscribe(listener: (...args: unknown[]) => void) {
      if (typeof listener === 'function') {
        _listeners.add(listener);
        return () => _listeners.delete(listener);
      }
      return () => {};
    },

    unsubscribe(listener: (...args: unknown[]) => void) {
      _listeners.delete(listener);
    },

    // Apply state to DOM element
    applyToElement(element: HTMLElement) {
      if (!element) return;

      // Collapsed state
      element.classList.toggle('dsd-container--collapsed', _state.collapsed);
      element.setAttribute('data-collapsed', String(_state.collapsed));

      // Fullscreen state
      element.classList.toggle('dsd-container--fullscreen', _state.fullscreen);
      element.setAttribute('data-fullscreen', String(_state.fullscreen));

      // Zoom level
      if (_state.zoomLevel !== 100) {
        // @ts-expect-error TS migration - TS2345
        element.style.setProperty('--cm-zoom-level', _state.zoomLevel / 100);
      }

      // Size
      if (_state.width) element.style.width = typeof _state.width === 'number' ? `${_state.width}px` : _state.width;
      if (_state.height) element.style.height = typeof _state.height === 'number' ? `${_state.height}px` : _state.height;

      _logger.debug('State applied to element', {});
    },

    // Capture state from DOM element
    captureFromElement(element: HTMLElement) {
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const styles = getComputedStyle(element);

      this.merge({
        collapsed: element.classList.contains('dsd-container--collapsed'),
        fullscreen: element.classList.contains('dsd-container--fullscreen'),
        width: rect.width,
        height: rect.height,
        position: { x: rect.left, y: rect.top }
      });

      _logger.debug('State captured from element', {});
    },

    // Utilities
    isInitialized() {
      return _initialized;
    },

    hasChanges() {
      return JSON.stringify(_state) !== JSON.stringify(DEFAULT_STATE);
    },

    // Health check
    healthCheck() {
      return {
        status: _initialized ? 'HEALTHY' : 'NOT_INITIALIZED',
        version: VERSION,
        moduleId: MODULE_ID,
        containerId,
        initialized: _initialized,
        hasChanges: this.hasChanges(),
        historySize: _state.panelHistory.length,
        listenersCount: _listeners.size
      };
    },

    // Info
    info() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        containerId,
        autoSave,
        debounceMs,
        maxHistorySize,
        storageType,
        keys: Object.keys(STORAGE_KEYS)
      };
    },

    // Destroy
    destroy() {
      // @ts-expect-error TS migration - TS2769
      if (_saveTimeout) clearTimeout(_saveTimeout);
      _listeners.clear();
      _initialized = false;
    }
  };

  return persistence;
}

// Singleton por container
const _instances = new Map();

export function getContainerStatePersistence(containerId = 'container-main', options = {}) {
  if (!_instances.has(containerId)) {
    _instances.set(containerId, createContainerStatePersistence({ ...options, containerId }));
  }
  return _instances.get(containerId);
}

export function resetContainerStatePersistence(containerId = 'container-main') {
  const instance = _instances.get(containerId);
  if (instance) {
    instance.destroy();
    _instances.delete(containerId);
  }
}

// Exports
export function info() {
  return { moduleId: MODULE_ID, version: VERSION, instances: _instances.size };
}

export function healthCheck() {
  const results = {};
  for (const [id, instance] of _instances) {
    (results as Record<string, unknown>)[id] = instance.healthCheck();
  }
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, instances: results };
}

export default {
  VERSION,
  MODULE_ID,
  STORAGE_KEYS,
  createContainerStatePersistence,
  getContainerStatePersistence,
  resetContainerStatePersistence,
  info,
  healthCheck
};
