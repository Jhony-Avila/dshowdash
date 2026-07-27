// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-config-presets
// PURPOSE: Container Config Presets Component
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MAIN_EVENTS from /core/runtime/events/catalog/main.events.js
//   createLogger from ../utils/logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectEventBus() — exported function
//   PRESETS — exported value
//   createConfigPresets() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   MAIN_EVENTS.PRESET_CHANGE
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { MAIN_EVENTS } from '/core/runtime/events/catalog/main.events.js';

export const VERSION = '8.2.0-ENTERPRISE';
export const MODULE_ID = 'container-config-presets';
import { createLogger } from '../utils/logger.js';
const logger = createLogger(MODULE_ID);

let _injectedEventBus: { emit?: (event: string, data: Record<string, unknown>) => void; on?: (event: string, callback: (data: Record<string, unknown>) => void) => (() => void) } | null = null;

export function injectEventBus(eventBus: typeof _injectedEventBus) { _injectedEventBus = eventBus; }

function _getEventBus() { return _injectedEventBus; }

function _emitPresetChange(container: HTMLElement, payload: Record<string, unknown>) {
  const eb = _getEventBus();
  if (eb?.emit) { eb.emit(MAIN_EVENTS.PRESET_CHANGE, { source: MODULE_ID, timestamp: Date.now(), containerId: container.id, ...payload }); return true; }
  return false;
}

// Options validation
function _validateOptions(options: Record<string, unknown>) {
  const errors = [];
  if (options.defaultPreset !== undefined && typeof options.defaultPreset !== 'string') errors.push('defaultPreset must be a string');
  if (options.onPresetChange !== undefined && typeof options.onPresetChange !== 'function') errors.push('onPresetChange must be a function');
  if (errors.length > 0) logger.warn('Invalid options', { errors });
  return errors.length === 0;
}

export const PRESETS = {
  default: { name: 'Padrão', description: 'Configuração padrão do container', config: { draggable: true, resizable: true, minimizable: true, maximizable: true, closable: true, showHeader: true, showFooter: false, animation: true, borderRadius: 8, shadow: 'medium' } },
  compact: { name: 'Compacto', description: 'Layout compacto com menos espaçamento', config: { draggable: true, resizable: true, minimizable: true, maximizable: false, closable: true, showHeader: true, showFooter: false, animation: true, borderRadius: 4, shadow: 'small' } },
  minimal: { name: 'Minimalista', description: 'Interface limpa e sem distrações', config: { draggable: true, resizable: false, minimizable: false, maximizable: false, closable: true, showHeader: false, showFooter: false, animation: false, borderRadius: 0, shadow: 'none' } },
  modal: { name: 'Modal', description: 'Comportamento de janela modal', config: { draggable: true, resizable: false, minimizable: false, maximizable: false, closable: true, showHeader: true, showFooter: true, animation: true, borderRadius: 12, shadow: 'large' } },
  fullscreen: { name: 'Tela Cheia', description: 'Ocupar toda a tela disponível', config: { draggable: false, resizable: false, minimizable: false, maximizable: false, closable: true, showHeader: true, showFooter: false, animation: false, borderRadius: 0, shadow: 'none' } },
  dashboard: { name: 'Dashboard', description: 'Otimizado para painéis de dashboard', config: { draggable: true, resizable: true, minimizable: true, maximizable: true, closable: false, showHeader: true, showFooter: false, animation: true, borderRadius: 8, shadow: 'medium' } }
};

export function createConfigPresets(container: HTMLElement, options: Record<string, any> = {}) {
  _validateOptions(options);
  const { defaultPreset = 'default', onPresetChange, eventBus } = options;
  if (eventBus && !_injectedEventBus) _injectedEventBus = eventBus;

  let _initialized = false;
  let _currentPreset = defaultPreset;
  let _customPresets: Record<string, any> = {};

  function _getAllPresets() { return { ...PRESETS, ..._customPresets }; }

  const presets = {
    init() { if (_initialized) return this; _initialized = true; return this; },
    getCurrentPreset() { return _currentPreset; },
    getPreset(name: string) { return (_getAllPresets() as Record<string, unknown>)[name] || null; },
    getPresetConfig(name: string) { return ((_getAllPresets() as Record<string, unknown>)[name] as Record<string, unknown>)?.config || null; },
    setPreset(name: string) {
      const allPresets = _getAllPresets();
      if (!(allPresets as Record<string, unknown>)[name]) return false;
      const prevPreset = _currentPreset;
      _currentPreset = name;
      onPresetChange?.(name, ((allPresets as Record<string, unknown>)[name] as Record<string, unknown>)?.config, prevPreset);
      _emitPresetChange(container, { preset: name, config: ((allPresets as Record<string, unknown>)[name] as Record<string, unknown>)?.config, prevPreset });
      return true;
    },
    listPresets() {
      const allPresets = _getAllPresets();

      return Object.entries(allPresets).map(([key, preset]) => ({ id: key, name: preset.name, description: preset.description, isCustom: !!_customPresets[key], isCurrent: key === _currentPreset }));
    },
    addCustomPreset(id: string, preset: Record<string, unknown>) {
      if (typeof id !== 'string' || !id) return this;
      if ((PRESETS as Record<string, unknown>)[id]) throw new Error(`Cannot override built-in preset "${id}"`);
      _customPresets[id] = { name: (preset.name as string) || id, description: (preset.description as string) || '', config: { ...PRESETS.default.config, ...(preset.config as Record<string, unknown>) } };
      return this;
    },
    removeCustomPreset(id: string) {
      if (!_customPresets[id]) return false;
      delete _customPresets[id];
      if (_currentPreset === id) this.setPreset('default');
      return true;
    },
    mergeConfig(basePreset: string, overrides: Record<string, unknown>) {
      const base = this.getPresetConfig(basePreset);
      return base ? { ...base, ...overrides } : overrides;
    },
    exportPreset(name: string) { const preset = this.getPreset(name); return preset ? JSON.stringify(preset, null, 2) : null; },
    importPreset(id: string, json: string) {
      try { this.addCustomPreset(id, JSON.parse(json)); return true; }
      catch { return false; }
    },
    isInitialized() { return _initialized; },
    destroy() { _initialized = false; _customPresets = {}; },
    healthCheck() {
      return { status: _initialized ? 'HEALTHY' : 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID, currentPreset: _currentPreset, builtInPresets: Object.keys(PRESETS).length, customPresets: Object.keys(_customPresets).length, hasInjectedEventBus: !!_injectedEventBus, hasValidation: true };
    }
  };
  return presets;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, hasInjectedEventBus: !!_injectedEventBus, presetsCount: Object.keys(PRESETS).length, hasValidation: true }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, presetsCount: Object.keys(PRESETS).length, hasInjectedEventBus: !!_injectedEventBus, hasValidation: true }; }

export default { createConfigPresets, injectEventBus, healthCheck, info, VERSION, MODULE_ID, PRESETS };
