import Icons from "./icons.js";
const VERSION = "2.0.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell-command-palette";
const COMMAND_TYPES = { ACTION: "action", NAVIGATION: "navigation", SEARCH: "search", SETTING: "setting", DEBUG: "debug" };
const PANEL_ID = "dsd-command-palette";
const OVERLAY_ID = "dsd-command-overlay";
const STORAGE_KEY = "app-shell-command-palette-recent";
const _commands = /* @__PURE__ */ new Map();
let _recentCommands = [];
let _isVisible = false;
let _selectedIndex = 0;
let _searchQuery = "";
let _filteredCommands = [];
let _panelElement = null;
let _overlayElement = null;
let _initialized = false;
let _subscribers = [];
let _metrics = { opens: 0, executions: 0, searches: 0, errors: 0 };
const _config = { hotkey: "ctrl+k", maxRecent: 10, maxResults: 15, placeholder: "Digite um comando...", showRecent: true, showIcons: true, fuzzySearch: true, groupByType: true, persistRecent: true };
function _icon(name, size) {
  return Icons.icon(name, size || 16);
}
function _getCommandIcon(cmd) {
  const iconMap = {
    "toggle-theme": "sun",
    "toggle-sidebar": "sidebar",
    "open-debug-panel": "tool",
    "health-check": "activity",
    "export-config": "download",
    "show-info": "info",
    "clear-cache": "trash",
    "fullscreen": "maximize"
  };
  return iconMap[cmd.id] || "terminal";
}
function _loadRecent() {
  if (!_config.persistRecent) return;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) _recentCommands = JSON.parse(saved).slice(0, _config.maxRecent);
  } catch (e) {
  }
}
function _saveRecent() {
  if (!_config.persistRecent) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_recentCommands.slice(0, _config.maxRecent)));
  } catch (e) {
  }
}
function _addToRecent(commandId) {
  _recentCommands = _recentCommands.filter((id) => id !== commandId);
  _recentCommands.unshift(commandId);
  if (_recentCommands.length > _config.maxRecent) _recentCommands = _recentCommands.slice(0, _config.maxRecent);
  _saveRecent();
}
function _notify(event, data) {
  _subscribers.forEach((cb) => {
    try {
      cb(event, data);
    } catch (e) {
    }
  });
}
function _filterCommands(query) {
  _searchQuery = query.toLowerCase().trim();
  _metrics.searches++;
  if (!_searchQuery) {
    if (_config.showRecent && _recentCommands.length > 0) {
      _filteredCommands = _recentCommands.map((id) => _commands.get(id)).filter(Boolean).slice(0, _config.maxResults);
    } else {
      _filteredCommands = Array.from(_commands.values()).filter((c) => c.visible !== false).sort((a, b) => (b.priority || 0) - (a.priority || 0)).slice(0, _config.maxResults);
    }
  } else {
    _filteredCommands = Array.from(_commands.values()).filter((cmd) => {
      if (cmd.visible === false) return false;
      const searchIn = `${cmd.title} ${cmd.description || ""} ${(cmd.keywords || []).join(" ")}`.toLowerCase();
      if (_config.fuzzySearch) {
        return _searchQuery.split("").every((char) => searchIn.includes(char));
      }
      return searchIn.includes(_searchQuery);
    }).sort((a, b) => (b.priority || 0) - (a.priority || 0)).slice(0, _config.maxResults);
  }
  _selectedIndex = 0;
}
function _executeSelected() {
  const cmd = _filteredCommands[_selectedIndex];
  if (!cmd) return;
  try {
    if (typeof cmd.handler === "function") {
      cmd.handler();
    }
    _addToRecent(cmd.id);
    _metrics.executions++;
    _notify("execute", { command: cmd.id });
    hide();
  } catch (e) {
    _metrics.errors++;
    console.debug("%c[ERROR]%c [CommandPalette] Execute error:", "color:#ef4444;font-weight:bold", "color:inherit", e.message || e);
  }
}
function _handleKeydown(e) {
  if (!_isVisible) return;
  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      _selectedIndex = Math.min(_selectedIndex + 1, _filteredCommands.length - 1);
      _render();
      break;
    case "ArrowUp":
      e.preventDefault();
      _selectedIndex = Math.max(_selectedIndex - 1, 0);
      _render();
      break;
    case "Enter":
      e.preventDefault();
      _executeSelected();
      break;
    case "Escape":
      e.preventDefault();
      hide();
      break;
  }
}
function _handleGlobalKeydown(e) {
  const isCtrlK = (e.ctrlKey || e.metaKey) && e.key === "k";
  if (isCtrlK) {
    e.preventDefault();
    toggle();
  }
}
function _injectStyles() {
  if (typeof document === "undefined") return;
  const linkId = "dsd-panel-ui-css";
  if (document.getElementById(linkId)) return;
  const link = document.createElement("link");
  link.id = linkId;
  link.rel = "stylesheet";
  link.href = "/components/app-shell/styles/_panel-ui.css";
  document.head.appendChild(link);
}
function _render() {
  if (!_panelElement) return;
  const listHtml = _filteredCommands.length === 0 ? '<div class="dsd-ui-empty">Nenhum comando encontrado</div>' : _filteredCommands.map((cmd, i) => {
    const selected = i === _selectedIndex ? " selected" : "";
    const iconName = _getCommandIcon(cmd);
    const shortcutHtml = cmd.shortcut ? `<div class="dsd-ui-command-item__shortcut"><kbd class="dsd-ui-kbd">${cmd.shortcut}</kbd></div>` : "";
    return `<div class="dsd-ui-command-item${selected}" data-index="${i}"><div class="dsd-ui-command-item__icon">${_icon(iconName, 20)}</div><div class="dsd-ui-command-item__content"><div class="dsd-ui-command-item__title">${cmd.title}</div>${cmd.description ? `<div class="dsd-ui-command-item__desc">${cmd.description}</div>` : ""}</div>${shortcutHtml}</div>`;
  }).join("");
  _panelElement.innerHTML = `<div class="dsd-ui-header" style="padding:var(--ui-space-sm) var(--ui-space-md)"><input type="text" class="dsd-ui-input" id="dsd-command-input" placeholder="${_config.placeholder}" value="${_searchQuery}" autocomplete="off" /></div><div class="dsd-ui-command-list">${listHtml}</div><div style="display:flex;justify-content:center;gap:var(--ui-space-md);padding:var(--ui-space-sm);border-top:1px solid var(--ui-border);font-size:10px;color:var(--ui-text-muted)"><span><kbd class="dsd-ui-kbd">\u2191\u2193</kbd> navegar</span><span><kbd class="dsd-ui-kbd">Enter</kbd> executar</span><span><kbd class="dsd-ui-kbd">Esc</kbd> fechar</span></div>`;
  const input = _panelElement.querySelector("#dsd-command-input");
  if (input) {
    input.focus();
    input.oninput = (e) => {
      _filterCommands(e.target.value);
      _render();
    };
  }
  const items = _panelElement.querySelectorAll(".dsd-ui-command-item");
  items.forEach((item) => {
    item.onclick = () => {
      _selectedIndex = parseInt(item.getAttribute("data-index"), 10);
      _executeSelected();
    };
    item.onmouseenter = () => {
      _selectedIndex = parseInt(item.getAttribute("data-index"), 10);
      _render();
    };
  });
}
function _registerDefaultCommands() {
  const defaults = [
    { id: "toggle-theme", title: "Alternar tema claro/escuro", type: COMMAND_TYPES.SETTING, shortcut: "Alt+T", handler() {
      const s = window.AppShell;
      if (s && s.theme) s.theme.toggleTheme();
    }, priority: 100 },
    { id: "toggle-sidebar", title: "Alternar sidebar", type: COMMAND_TYPES.ACTION, handler() {
      const s = window.AppShell;
      if (s && s.layoutPrefs) s.layoutPrefs.toggleSidebar();
    }, priority: 90 },
    { id: "open-debug-panel", title: "Abrir Debug Panel", type: COMMAND_TYPES.DEBUG, shortcut: "Alt+F12", handler() {
      const s = window.AppShell;
      if (s && s.debugPanel) s.debugPanel.open();
    }, priority: 85 },
    { id: "health-check", title: "Executar Health Check", type: COMMAND_TYPES.DEBUG, handler() {
      const s = window.AppShell;
      if (s) {
        const r = s.healthCheck();
        console.log("Health:", r);
      }
    }, priority: 80 },
    { id: "export-config", title: "Exportar configura\xE7\xE3o", type: COMMAND_TYPES.ACTION, handler() {
      const s = window.AppShell;
      if (s && s.configExporter) s.configExporter.exportToFile();
    }, priority: 70 },
    { id: "show-info", title: "Mostrar informa\xE7\xF5es do sistema", type: COMMAND_TYPES.DEBUG, handler() {
      const s = window.AppShell;
      if (s) console.log("Info:", s.info());
    }, priority: 65 },
    { id: "clear-cache", title: "Limpar cache de regi\xF5es", type: COMMAND_TYPES.ACTION, handler() {
      const s = window.AppShell;
      if (s && s.cache) s.cache.clear();
    }, priority: 60 },
    { id: "fullscreen", title: "Entrar em tela cheia", type: COMMAND_TYPES.ACTION, handler() {
      if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
    }, priority: 50 }
  ];
  defaults.forEach((cmd) => {
    if (!_commands.has(cmd.id)) _commands.set(cmd.id, cmd);
  });
}
function init() {
  if (_initialized) return true;
  if (typeof document === "undefined") return false;
  _injectStyles();
  _loadRecent();
  _registerDefaultCommands();
  document.addEventListener("keydown", _handleGlobalKeydown);
  document.addEventListener("keydown", _handleKeydown);
  _initialized = true;
  return true;
}
function register(command) {
  if (!command || !command.id || !command.title) return false;
  _commands.set(command.id, command);
  return true;
}
function registerMany(commands) {
  return commands.map(register).filter(Boolean).length;
}
function unregister(commandId) {
  return _commands.delete(commandId);
}
function execute(commandId) {
  const cmd = _commands.get(commandId);
  if (!cmd || typeof cmd.handler !== "function") return false;
  try {
    cmd.handler();
    _addToRecent(commandId);
    _metrics.executions++;
    _notify("execute", { command: commandId });
    return true;
  } catch (e) {
    _metrics.errors++;
    return false;
  }
}
function show() {
  if (typeof document === "undefined") return false;
  _injectStyles();
  if (!_overlayElement) {
    _overlayElement = document.createElement("div");
    _overlayElement.id = OVERLAY_ID;
    _overlayElement.className = "dsd-ui-overlay";
    _overlayElement.onclick = hide;
    document.body.appendChild(_overlayElement);
  }
  _overlayElement.classList.add("visible");
  if (!_panelElement) {
    _panelElement = document.createElement("div");
    _panelElement.id = PANEL_ID;
    _panelElement.className = "dsd-ui-panel dsd-ui-panel--command";
    document.body.appendChild(_panelElement);
  }
  _isVisible = true;
  _searchQuery = "";
  _filterCommands("");
  _panelElement.style.display = "flex";
  _render();
  _metrics.opens++;
  _notify("show", {});
  return true;
}
function hide() {
  if (_overlayElement) _overlayElement.classList.remove("visible");
  if (_panelElement) _panelElement.style.display = "none";
  _isVisible = false;
  _notify("hide", {});
  return true;
}
function toggle() {
  return _isVisible ? hide() : show();
}
function isVisible() {
  return _isVisible;
}
function getCommand(id) {
  return _commands.get(id);
}
function getAllCommands() {
  return Array.from(_commands.values());
}
function getCommandsByType(type) {
  return getAllCommands().filter((c) => c.type === type);
}
function getRecentCommands() {
  return _recentCommands.map((id) => _commands.get(id)).filter(Boolean);
}
function clearRecent() {
  _recentCommands = [];
  _saveRecent();
}
function configure(options) {
  Object.assign(_config, options);
}
function getConfig() {
  return { ..._config };
}
function subscribe(callback) {
  if (typeof callback === "function") _subscribers.push(callback);
  return () => {
    _subscribers = _subscribers.filter((cb) => cb !== callback);
  };
}
function getMetrics() {
  return { ..._metrics };
}
function healthCheck() {
  const checks = { initialized: _initialized, commandsRegistered: _commands.size > 0, noErrors: _metrics.errors === 0 };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 3 ? "HEALTHY" : "DEGRADED", score: `${passed}/3`, checks, commandCount: _commands.size, metrics: _metrics, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, initialized: _initialized, isVisible: _isVisible, commandCount: _commands.size, recentCount: _recentCommands.length, config: _config, metrics: _metrics, timestamp: Date.now() };
}
function destroy() {
  if (typeof document !== "undefined") {
    document.removeEventListener("keydown", _handleGlobalKeydown);
    document.removeEventListener("keydown", _handleKeydown);
  }
  hide();
  _initialized = false;
}
if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => {
    init();
  });
  else init();
}
var command_palette_default = { VERSION, MODULE_ID, COMMAND_TYPES, init, destroy, register, registerMany, unregister, execute, show, hide, toggle, isVisible, getCommand, getAllCommands, getCommandsByType, getRecentCommands, clearRecent, configure, getConfig, subscribe, getMetrics, healthCheck, info };
export {
  COMMAND_TYPES,
  MODULE_ID,
  VERSION,
  clearRecent,
  configure,
  command_palette_default as default,
  destroy,
  execute,
  getAllCommands,
  getCommand,
  getCommandsByType,
  getConfig,
  getMetrics,
  getRecentCommands,
  healthCheck,
  hide,
  info,
  init,
  isVisible,
  register,
  registerMany,
  show,
  subscribe,
  toggle,
  unregister
};
