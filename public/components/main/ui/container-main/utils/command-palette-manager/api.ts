// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: api
// PURPOSE: Command Palette - Public API
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, COMMAND_TYPES, PALETTE_MODES, DEFAULT_CONFIG from ./const...
//   _instance, setInstance, _isOpen, _isInitialized, setIsOpen, setIsInitialized,...
//   _log, _emit, _loadState from ./helpers/index.js
//   _filterCommands from ./filter/index.js
//   _createPaletteDOM, _renderResults from ./ui/index.js
//   _setupGlobalHotkey from ./events/hotkey.js
//   _registerDefaultCommands from ./commands/defaults.js
//
// PROVIDES:
//   createCommandPaletteManager() — exported function
//   getCommandPaletteManager() — exported function
//   init() — exported function
//   destroy() — exported function
//   open() — exported function
//   close() — exported function
//   toggle() — exported function
//   registerCommand() — exported function
//   unregisterCommand() — exported function
//   registerCommands() — exported function
//   getCommand() — exported function
//   getAllCommands() — exported function
//   clearCommands() — exported function
//   setMode() — exported function
//   subscribe() — exported function
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

import { VERSION, MODULE_ID, COMMAND_TYPES, PALETTE_MODES, DEFAULT_CONFIG } from './constants.js';
import {
  _instance, setInstance,
  _isOpen, _isInitialized, setIsOpen, setIsInitialized,
  _commands, _listeners, _metrics,
  getConfig, setConfig,
  getCurrentMode, setCurrentMode,
  getRecentCommands,
  getPaletteElement, getInputElement,
  setFilteredResults, setSelectedIndex,
  getMetrics
} from './state.js';
import { _log, _emit, _loadState } from './helpers/index.js';
import { _filterCommands } from './filter/index.js';
import { _createPaletteDOM, _renderResults } from './ui/index.js';
import { _setupGlobalHotkey } from './events/hotkey.js';
import { _registerDefaultCommands } from './commands/defaults.js';

export function createCommandPaletteManager(options: Record<string, unknown> = {}) {
  setConfig({ ...DEFAULT_CONFIG, ...options });
  _loadState();
  
  _log('info', 'Command Palette Manager created');
  
  return {
    init,
    destroy,
    open,
    close,
    toggle,
    isOpen: () => _isOpen,
    registerCommand,
    unregisterCommand,
    registerCommands,
    getCommand,
    getAllCommands,
    clearCommands,
    setMode,
    getMode: () => getCurrentMode(),
    subscribe,
    healthCheck,
    info
  };
}

export function getCommandPaletteManager(options: Record<string, unknown> = {}) {
  if (!_instance) {
    setInstance(createCommandPaletteManager(options));
  }
  return _instance;
}

export function init() {
  if (_isInitialized) return true;
  
  _createPaletteDOM();
  _setupGlobalHotkey();
  
  // Register some default commands
  _registerDefaultCommands();
  
  setIsInitialized(true);
  _emit('initialized', {});
  _log('info', 'Initialized');
  
  return true;
}

export function destroy() {
  if (!_isInitialized) return true;
  
  const paletteElement = getPaletteElement();
  if (paletteElement) {
    paletteElement.remove();
  }
  
  _commands.clear();
  setIsInitialized(false);
  
  _log('info', 'Destroyed');
  return true;
}

export function open(initialQuery = '') {
  if (!_isInitialized) init();
  if (_isOpen) return;
  
  setIsOpen(true);
  _metrics.opens++;
  
  const paletteElement = getPaletteElement();
  const inputElement = getInputElement();
  
  paletteElement!.classList.add('dsd-command-palette--open');
  // @ts-expect-error TS migration - TS2339
  inputElement.value = initialQuery;
  inputElement!.focus();
  
  setFilteredResults(_filterCommands(initialQuery));
  setSelectedIndex(0);
  _renderResults();
  
  _emit('opened', {});
}

export function close() {
  if (!_isOpen) return;
  
  setIsOpen(false);
  
  const paletteElement = getPaletteElement();
  const inputElement = getInputElement();
  
  paletteElement!.classList.remove('dsd-command-palette--open');
  // @ts-expect-error TS migration - TS2339
  inputElement.value = '';
  
  _emit('closed', {});
}

export function toggle() {
  if (_isOpen) {
    close();
  } else {
    open();
  }
}

export function registerCommand(command: Record<string, unknown>) {
  if (!command.id || !command.title) {
    _log('error', 'Command must have id and title');
    return false;
  }
  
  _commands.set(command.id, {
    type: COMMAND_TYPES.ACTION,
    ...(command as Record<string, unknown>)
  });
  
  _emit('commandRegistered', { command });
  return true;
}

export function unregisterCommand(commandId: string) {
  const result = _commands.delete(commandId);
  if (result) {
    _emit('commandUnregistered', { commandId });
  }
  return result;
}

export function registerCommands(commands: Record<string, unknown>) {
  let registered = 0;
  (commands.forEach as (...args: unknown[]) => unknown)((cmd: unknown) => {
    if (registerCommand((cmd as Record<string, unknown>))) registered++;
  });
  return registered;
}

export function getCommand(commandId: string) {
  return _commands.get(commandId) || null;
}

export function getAllCommands() {
  return Array.from(_commands.values());
}

export function clearCommands() {
  const count = _commands.size;
  _commands.clear();
  return count;
}

export function setMode(mode: string) {
  // @ts-expect-error TS migration - TS2345
  if (!Object.values(PALETTE_MODES).includes(mode)) return false;
  
  const prefixes = {
    [PALETTE_MODES.GOTO]: '>',
    [PALETTE_MODES.SETTINGS]: '@',
    [PALETTE_MODES.SEARCH]: '?',
    [PALETTE_MODES.COMMANDS]: ''
  };
  
  const inputElement = getInputElement();
  
  if (_isOpen && inputElement) {
    // @ts-expect-error TS migration - TS2339
    inputElement.value = (prefixes as Record<string, unknown>)[mode];
    inputElement.focus();
    // Trigger input event
    inputElement.dispatchEvent(new Event('input'));
  }
  
  return true;
}

export function subscribe(callback: (...args: unknown[]) => void) {
  if (typeof callback !== 'function') return () => {};
  _listeners.push(callback);
  return () => {
    const idx = _listeners.indexOf(callback);
    if (idx >= 0) _listeners.splice(idx, 1);
  };
}

export function healthCheck() {
  const paletteElement = getPaletteElement();
  const metrics = getMetrics();
  
  const checks = {
    initialized: _isInitialized,
    hasCommands: _commands.size > 0,
    hasPaletteDOM: !!paletteElement,
    noErrors: metrics.errors === 0
  };
  
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  
  return {
    status: passed === total ? 'HEALTHY' : (passed >= 2 ? 'DEGRADED' : 'UNHEALTHY'),
    score: `${passed}/${total}`,
    checks,
    commandCount: _commands.size,
    metrics,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    commandTypes: Object.values(COMMAND_TYPES),
    paletteModes: Object.values(PALETTE_MODES),
    config: {
      hotkey: getConfig().hotkey,
      maxResults: getConfig().maxResults,
      fuzzySearch: getConfig().fuzzySearch
    },
    isInitialized: _isInitialized,
    isOpen: _isOpen,
    commandCount: _commands.size,
    recentCount: getRecentCommands().length
  };
}
