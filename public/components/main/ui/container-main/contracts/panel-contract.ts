
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-LOGGER-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:contracts:panel
// PURPOSE: Panel Contract - Interface para painéis de conteúdo
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   LIFECYCLE_STATES, createLifecycleWrapper from ./lifecycle-contract.js
//   SLOT_TYPES, RENDER_MODES, LOAD_PRIORITY from ./slot-contract.js
//   createLogger from ../utils/logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   PANEL_CATEGORIES — exported value
//   PANEL_CAPABILITIES — exported value
//   PANEL_CONFIG_SCHEMA — exported value
//   validatePanelConfig() — exported function
//   PANEL_INTERFACE — exported value
//   validatePanelInterface() — exported function
//   createPanel() — exported function
//   registerPanelDefinition() — exported function
//   getPanelDefinition() — exported function
//   getRegisteredPanels() — exported function
//   createPanelFromRegistry() — exported function
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

import { LIFECYCLE_STATES, createLifecycleWrapper } from './lifecycle-contract.js';
import { SLOT_TYPES, RENDER_MODES, LOAD_PRIORITY } from './slot-contract.js';
import { createLogger } from '../utils/logger.js';

export const VERSION = '1.1.0-LOGGER-INTEGRATED';
export const MODULE_ID = 'container-main:contracts:panel';

const logger = createLogger(MODULE_ID);

// Categorias de painel
export const PANEL_CATEGORIES = Object.freeze({
  STATIC: 'static',
  DYNAMIC: 'dynamic',
  MEDIA: 'media',
  REALTIME: 'realtime',
  INTERACTIVE: 'interactive'
});

// Capacidades de painel
export const PANEL_CAPABILITIES = Object.freeze({
  RESIZABLE: 'resizable',
  DRAGGABLE: 'draggable',
  CLOSABLE: 'closable',
  REFRESHABLE: 'refreshable',
  EXPORTABLE: 'exportable',
  PRINTABLE: 'printable',
  FULLSCREEN: 'fullscreen',
  SPLIT_VIEW: 'split-view'
});

// Schema de configuração de painel
export const PANEL_CONFIG_SCHEMA = {
  id: { type: 'string', required: true },
  title: { type: 'string', default: 'Panel' },
  category: { type: 'enum', values: Object.values(PANEL_CATEGORIES), default: PANEL_CATEGORIES.STATIC },
  capabilities: { type: 'array', default: [] as unknown[] },
  slotType: { type: 'enum', values: Object.values(SLOT_TYPES), default: SLOT_TYPES.PANEL },
  renderMode: { type: 'enum', values: Object.values(RENDER_MODES), default: RENDER_MODES.LAZY },
  priority: { type: 'enum', values: Object.values(LOAD_PRIORITY), default: LOAD_PRIORITY.NORMAL },
  refreshInterval: { type: 'number', default: 0 },
  cacheTimeout: { type: 'number', default: 0 },
  minWidth: { type: 'number', default: 200 },
  minHeight: { type: 'number', default: 100 },
  maxRetries: { type: 'number', default: 3 }
};

// Valida configuração de painel
export function validatePanelConfig(config: Record<string, unknown>) {
  const result = { valid: true, errors: [] as unknown[], normalized: {} };

  Object.entries(PANEL_CONFIG_SCHEMA).forEach(([key, schema]: [string, any]) => {
    const value = config[key];

    if (schema.required && (value === undefined || value === null)) {
      result.valid = false;
      result.errors.push(`Missing required field: ${key}`);
      return;
    }

    if (value === undefined) {
      (result.normalized as Record<string, unknown>)[key] = schema.default;
      return;
    }

    if (schema.type === 'enum' && !schema.values.includes(value)) {
      result.valid = false;
      result.errors.push(`Invalid value for ${key}: ${value}`);
      return;
    }

    if (schema.type === 'array' && !Array.isArray(value)) {
      result.valid = false;
      result.errors.push(`Invalid type for ${key}: expected array`);
      return;
    }

    (result.normalized as Record<string, unknown>)[key] = value;
  });

  return result;
}

// Interface que todo painel deve implementar
export const PANEL_INTERFACE = {
  required: [
    'getId',
    'getTitle',
    'getCategory',
    'getConfig',
    'render',
    'destroy',
    'getState',
    'healthCheck'
  ],
  optional: [
    'refresh',
    'pause',
    'resume',
    'resize',
    'export',
    'print',
    'onActivate',
    'onDeactivate',
    'onError'
  ]
};

// Valida se um objeto implementa a interface de painel
export function validatePanelInterface(obj: Record<string, unknown>) {
  const result = { valid: true, missing: [] as unknown[], optional: [] as unknown[], warnings: [] as unknown[] };

  PANEL_INTERFACE.required.forEach(method => {
    if (typeof obj[method] !== 'function') {
      result.valid = false;
      result.missing.push(method);
    }
  });

  PANEL_INTERFACE.optional.forEach(method => {
    if (typeof obj[method] === 'function') {
      result.optional.push(method);
    }
  });

  return result;
}

// Factory para criar um painel compatível com o contrato
export function createPanel(config: unknown, implementation: any) {
  const validation = validatePanelConfig(config as Record<string, unknown>);
  if (!validation.valid) {
    throw new Error(`Invalid panel config: ${validation.errors.join(', ')}`);
  }

  const _config: any = validation.normalized;
  let _element: any = null;
  let _refreshTimer: unknown = null;
  let _state: any = {
    lifecycle: LIFECYCLE_STATES.IDLE,
    rendered: false,
    active: false,
    error: null,
    lastRefresh: null
  };

  const _panel = {
    getId: () => _config.id,
    getTitle: () => _config.title,
    getCategory: () => _config.category,
    getConfig: () => ({ ..._config }),
    getCapabilities: () => [..._config.capabilities],
    hasCapability: (cap: unknown) => _config.capabilities.includes(cap),

    getState: () => ({ ..._state }),

    async render(targetElement: unknown) {
      if (_state.rendered) return this;

      _element = targetElement;
      _state.lifecycle = LIFECYCLE_STATES.INITIALIZING;

      try {
        if (implementation.render) {
          await implementation.render(_element, _config);
        }
        _state.rendered = true;
        _state.lifecycle = LIFECYCLE_STATES.READY;
        _state.error = null;

        // Setup auto-refresh se configurado
        if (_config.refreshInterval > 0) {
          _refreshTimer = setInterval(() => _panel.refresh(), _config.refreshInterval);
        }

      } catch (e: any) {
        _state.error = e;
        _state.lifecycle = LIFECYCLE_STATES.ERROR;
        throw e;
      }

      return this;
    },

    async refresh() {
      if (!_state.rendered) return this;

      try {
        if (implementation.refresh) {
          await implementation.refresh(_element, _config);
        }
        _state.lastRefresh = Date.now();
        _state.error = null;
      } catch (e: any) {
        _state.error = e;
        implementation.onError?.(e);
      }

      return this;
    },

    async destroy() {
      if (_refreshTimer) {
        clearInterval(_refreshTimer as ReturnType<typeof setInterval>);
        _refreshTimer = null;
      }

      _state.lifecycle = LIFECYCLE_STATES.DESTROYING;

      try {
        if (implementation.destroy) {
          await implementation.destroy();
        }
        if (_element) {
          _element.innerHTML = '';
        }
      } catch (e: any) {
        logger.error(`Error during destroy`, { panelId: _config.id, error: e.message });
      }

      _state.rendered = false;
      _state.active = false;
      _state.lifecycle = LIFECYCLE_STATES.DESTROYED;
      _element = null;

      return this;
    },

    pause() {
      if (_state.lifecycle !== LIFECYCLE_STATES.ACTIVE) return this;
      if (_refreshTimer) clearInterval(_refreshTimer as ReturnType<typeof setInterval>);
      if (implementation.pause) implementation.pause();
      _state.lifecycle = LIFECYCLE_STATES.PAUSED;
      return this;
    },

    resume() {
      if (_state.lifecycle !== LIFECYCLE_STATES.PAUSED) return this;
      if (_config.refreshInterval > 0) {
        _refreshTimer = setInterval(() => _panel.refresh(), _config.refreshInterval);
      }
      if (implementation.resume) implementation.resume();
      _state.lifecycle = LIFECYCLE_STATES.ACTIVE;
      return this;
    },

    activate() {
      if (_state.lifecycle === LIFECYCLE_STATES.READY || _state.lifecycle === LIFECYCLE_STATES.PAUSED) {
        _state.lifecycle = LIFECYCLE_STATES.ACTIVE;
        _state.active = true;
        implementation.onActivate?.();
      }
      return this;
    },

    deactivate() {
      if (_state.lifecycle === LIFECYCLE_STATES.ACTIVE) {
        _state.active = false;
        implementation.onDeactivate?.();
      }
      return this;
    },

    resize(dimensions: Record<string, unknown>) {
      if (implementation.resize) {
        implementation.resize(dimensions);
      }
      return this;
    },

    async export(format = 'json') {
      if (!_config.capabilities.includes(PANEL_CAPABILITIES.EXPORTABLE)) {
        throw new Error('Panel does not support export');
      }
      if (implementation.export) {
        return implementation.export(format);
      }
      return null;
    },

    getElement: () => _element,

    healthCheck() {
      const implHealth = implementation.healthCheck?.() || { status: 'N/A' };
      return {
        status: _state.error ? 'ERROR' : _state.rendered ? 'HEALTHY' : 'IDLE',
        panelId: _config.id,
        category: _config.category,
        lifecycle: _state.lifecycle,
        rendered: _state.rendered,
        active: _state.active,
        error: _state.error?.message || null,
        lastRefresh: _state.lastRefresh,
        capabilities: _config.capabilities,
        implementation: implHealth
      };
    }
  };

  // Wrap com lifecycle contract
  // @ts-expect-error strict migration — TS2345
  return createLifecycleWrapper(_panel, { id: _config.id });
}

// Registry de painéis
const _panelRegistry = new Map();

// Registra definição de painel
export function registerPanelDefinition(id: string, definition: Record<string, unknown>) {
  _panelRegistry.set(id, definition);
}

// Obtém definição de painel
export function getPanelDefinition(id: string) {
  return _panelRegistry.get(id);
}

// Lista painéis registrados
export function getRegisteredPanels() {
  return Array.from(_panelRegistry.keys());
}

// Cria instância de painel a partir do registry
export function createPanelFromRegistry(id: string, configOverrides = {}) {
  const definition = _panelRegistry.get(id);
  if (!definition) {
    throw new Error(`Panel definition not found: ${id}`);
  }
  
  const config = { ...definition.config, ...configOverrides, id };
  return createPanel(config, definition.implementation);
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    categories: Object.keys(PANEL_CATEGORIES).length,
    capabilities: Object.keys(PANEL_CAPABILITIES).length,
    registeredPanels: _panelRegistry.size
  };
}

export function healthCheck() {
  return {
    status: 'HEALTHY',
    version: VERSION,
    moduleId: MODULE_ID,
    registeredPanels: _panelRegistry.size
  };
}

export default {
  VERSION, MODULE_ID,
  PANEL_CATEGORIES, PANEL_CAPABILITIES,
  PANEL_CONFIG_SCHEMA, PANEL_INTERFACE,
  validatePanelConfig, validatePanelInterface,
  createPanel,
  registerPanelDefinition, getPanelDefinition, getRegisteredPanels, createPanelFromRegistry,
  info, healthCheck
};
