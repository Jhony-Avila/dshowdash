import { VERSION, MODULE_ID, COMMAND_TYPES, PALETTE_MODES, DEFAULT_CONFIG } from "./constants.js";
import {
  _instance,
  setInstance,
  _isOpen,
  _isInitialized,
  setIsOpen,
  setIsInitialized,
  _commands,
  _listeners,
  _metrics,
  getConfig,
  setConfig,
  getCurrentMode,
  getRecentCommands,
  getPaletteElement,
  getInputElement,
  setFilteredResults,
  setSelectedIndex,
  getMetrics
} from "./state.js";
import { _log, _emit, _loadState } from "./helpers/index.js";
import { _filterCommands } from "./filter/index.js";
import { _createPaletteDOM, _renderResults } from "./ui/index.js";
import { _setupGlobalHotkey } from "./events/hotkey.js";
import { _registerDefaultCommands } from "./commands/defaults.js";
function createCommandPaletteManager(options = {}) {
  setConfig({ ...DEFAULT_CONFIG, ...options });
  _loadState();
  _log("info", "Command Palette Manager created");
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
function getCommandPaletteManager(options = {}) {
  if (!_instance) {
    setInstance(createCommandPaletteManager(options));
  }
  return _instance;
}
function init() {
  if (_isInitialized) return true;
  _createPaletteDOM();
  _setupGlobalHotkey();
  _registerDefaultCommands();
  setIsInitialized(true);
  _emit("initialized", {});
  _log("info", "Initialized");
  return true;
}
function destroy() {
  if (!_isInitialized) return true;
  const paletteElement = getPaletteElement();
  if (paletteElement) {
    paletteElement.remove();
  }
  _commands.clear();
  setIsInitialized(false);
  _log("info", "Destroyed");
  return true;
}
function open(initialQuery = "") {
  if (!_isInitialized) init();
  if (_isOpen) return;
  setIsOpen(true);
  _metrics.opens++;
  const paletteElement = getPaletteElement();
  const inputElement = getInputElement();
  paletteElement.classList.add("dsd-command-palette--open");
  inputElement.value = initialQuery;
  inputElement.focus();
  setFilteredResults(_filterCommands(initialQuery));
  setSelectedIndex(0);
  _renderResults();
  _emit("opened", {});
}
function close() {
  if (!_isOpen) return;
  setIsOpen(false);
  const paletteElement = getPaletteElement();
  const inputElement = getInputElement();
  paletteElement.classList.remove("dsd-command-palette--open");
  inputElement.value = "";
  _emit("closed", {});
}
function toggle() {
  if (_isOpen) {
    close();
  } else {
    open();
  }
}
function registerCommand(command) {
  if (!command.id || !command.title) {
    _log("error", "Command must have id and title");
    return false;
  }
  _commands.set(command.id, {
    type: COMMAND_TYPES.ACTION,
    ...command
  });
  _emit("commandRegistered", { command });
  return true;
}
function unregisterCommand(commandId) {
  const result = _commands.delete(commandId);
  if (result) {
    _emit("commandUnregistered", { commandId });
  }
  return result;
}
function registerCommands(commands) {
  let registered = 0;
  commands.forEach((cmd) => {
    if (registerCommand(cmd)) registered++;
  });
  return registered;
}
function getCommand(commandId) {
  return _commands.get(commandId) || null;
}
function getAllCommands() {
  return Array.from(_commands.values());
}
function clearCommands() {
  const count = _commands.size;
  _commands.clear();
  return count;
}
function setMode(mode) {
  if (!Object.values(PALETTE_MODES).includes(mode)) return false;
  const prefixes = {
    [PALETTE_MODES.GOTO]: ">",
    [PALETTE_MODES.SETTINGS]: "@",
    [PALETTE_MODES.SEARCH]: "?",
    [PALETTE_MODES.COMMANDS]: ""
  };
  const inputElement = getInputElement();
  if (_isOpen && inputElement) {
    inputElement.value = prefixes[mode];
    inputElement.focus();
    inputElement.dispatchEvent(new Event("input"));
  }
  return true;
}
function subscribe(callback) {
  if (typeof callback !== "function") return () => {
  };
  _listeners.push(callback);
  return () => {
    const idx = _listeners.indexOf(callback);
    if (idx >= 0) _listeners.splice(idx, 1);
  };
}
function healthCheck() {
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
    status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY",
    score: `${passed}/${total}`,
    checks,
    commandCount: _commands.size,
    metrics,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
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
export {
  clearCommands,
  close,
  createCommandPaletteManager,
  destroy,
  getAllCommands,
  getCommand,
  getCommandPaletteManager,
  healthCheck,
  info,
  init,
  open,
  registerCommand,
  registerCommands,
  setMode,
  subscribe,
  toggle,
  unregisterCommand
};
