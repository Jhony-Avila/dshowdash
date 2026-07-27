import { createLogger } from "../logger.js";
import { getEnv, ENV } from "../../config.js";
import { createStyles } from "./styles.js";
import { formatTimestamp } from "./helpers.js";
import { renderOverview } from "./renderers/overview.js";
import { renderLogs } from "./renderers/logs.js";
import { renderPerformance } from "./renderers/performance.js";
import { renderPlugins } from "./renderers/plugins.js";
const VERSION = "1.0.0-MODULAR";
const MODULE_ID = "container-main:devtools-panel";
import { createStyles as createStyles2 } from "./styles.js";
import { formatStatus, createElement, formatTimestamp as formatTimestamp2 } from "./helpers.js";
function createDevToolsPanel(options = {}) {
  const {
    position = "bottom-right",
    collapsed = true,
    theme = "dark",
    shortcut = "ctrl+shift+d",
    autoHideInProduction = true,
    maxLogs = 200
  } = options;
  const _logger = createLogger(MODULE_ID);
  let _container = null;
  let _isCollapsed = collapsed;
  let _bootstrap = null;
  let _eventBus = null;
  let _logs = [];
  let _activeTab = "overview";
  let _stylesInjected = false;
  function _addLog(level, message) {
    const timestamp = formatTimestamp();
    _logs.push({ level, message, timestamp });
    if (_logs.length > maxLogs) _logs.shift();
    if (_activeTab === "logs" && !_isCollapsed) _render();
  }
  function _renderContent() {
    switch (_activeTab) {
      case "logs":
        return renderLogs(_logs);
      case "performance":
        return renderPerformance(_bootstrap);
      case "plugins":
        return renderPlugins(_bootstrap);
      default:
        return renderOverview(_bootstrap);
    }
  }
  function _render() {
    if (!_container) return;
    if (_isCollapsed) {
      _container.innerHTML = `<div class="cm-devtools-toggle" onclick="window.__cmDevTools.toggle()">\u{1F6E0}\uFE0F</div>`;
      _container.className = `cm-devtools ${position} collapsed`;
    } else {
      _container.className = `cm-devtools ${position} expanded`;
      _container.innerHTML = `
        <div class="cm-devtools-header">
          <span class="cm-devtools-title">\u{1F6E0}\uFE0F Container-Main DevTools</span>
          <button class="cm-devtools-btn" onclick="window.__cmDevTools.toggle()">\u2212</button>
        </div>
        <div class="cm-devtools-tabs">
          <button class="cm-devtools-tab ${_activeTab === "overview" ? "active" : ""}" onclick="window.__cmDevTools.setTab('overview')">Overview</button>
          <button class="cm-devtools-tab ${_activeTab === "logs" ? "active" : ""}" onclick="window.__cmDevTools.setTab('logs')">Logs</button>
          <button class="cm-devtools-tab ${_activeTab === "performance" ? "active" : ""}" onclick="window.__cmDevTools.setTab('performance')">Performance</button>
          <button class="cm-devtools-tab ${_activeTab === "plugins" ? "active" : ""}" onclick="window.__cmDevTools.setTab('plugins')">Plugins</button>
        </div>
        <div class="cm-devtools-content">${_renderContent()}</div>
      `;
    }
  }
  function _injectStyles() {
    if (_stylesInjected) return;
    const styleEl = document.createElement("style");
    styleEl.textContent = createStyles(theme);
    document.head.appendChild(styleEl);
    _stylesInjected = true;
  }
  function _init() {
    if (typeof document === "undefined") return;
    if (autoHideInProduction && getEnv() === ENV.PRODUCTION) return;
    _injectStyles();
    _container = document.createElement("div");
    _container.id = "cm-devtools";
    document.body.appendChild(_container);
    document.addEventListener("keydown", (e) => {
      const keys = shortcut.split("+");
      const ctrl = keys.includes("ctrl") ? e.ctrlKey : true;
      const shift = keys.includes("shift") ? e.shiftKey : true;
      const key = keys[keys.length - 1].toLowerCase();
      if (ctrl && shift && e.key.toLowerCase() === key) {
        e.preventDefault();
        panel.toggle();
      }
    });
    _render();
    _logger.debug("DevTools panel initialized");
  }
  const panel = {
    inject({ bootstrap, eventBus }) {
      _bootstrap = bootstrap;
      _eventBus = eventBus;
      if (_eventBus) {
        _eventBus.on("bootstrap:error", (data) => _addLog("error", data.message || "Error"));
        _eventBus.on("bootstrap:state-changed", (data) => _addLog("info", `State: ${data.state}`));
        _eventBus.on("bootstrap:performance-critical", () => _addLog("warn", "Performance critical!"));
      }
      _render();
    },
    toggle() {
      _isCollapsed = !_isCollapsed;
      _render();
    },
    show() {
      _isCollapsed = false;
      _render();
    },
    hide() {
      _isCollapsed = true;
      _render();
    },
    setTab(tab) {
      _activeTab = tab;
      _render();
    },
    refresh() {
      _render();
    },
    snapshot() {
      const snapshots = _bootstrap?.getStateSnapshots();
      if (snapshots) {
        const id = snapshots.create("devtools-manual");
        _addLog("info", `Snapshot created: ${id}`);
      }
    },
    async reboot() {
      if (confirm("Reboot the application?")) {
        await _bootstrap?.reboot();
      }
    },
    clearLogs() {
      _logs = [];
      _render();
    },
    log(level, message) {
      _addLog(level, message);
    },
    healthCheck() {
      return {
        status: "HEALTHY",
        version: VERSION,
        moduleId: MODULE_ID,
        visible: !_isCollapsed,
        logsCount: _logs.length
      };
    },
    info() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        position,
        shortcut,
        theme
      };
    },
    destroy() {
      if (_container) {
        _container.remove();
        _container = null;
      }
    }
  };
  if (typeof window !== "undefined") {
    window.__cmDevTools = panel;
  }
  _init();
  return panel;
}
let _instance = null;
function getDevToolsPanel(options = {}) {
  if (!_instance) {
    _instance = createDevToolsPanel(options);
  }
  return _instance;
}
function resetDevToolsPanel() {
  if (_instance) {
    _instance.destroy();
    _instance = null;
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID };
}
var devtools_panel_default = {
  VERSION,
  MODULE_ID,
  createDevToolsPanel,
  getDevToolsPanel,
  resetDevToolsPanel,
  info,
  healthCheck
};
export {
  MODULE_ID,
  VERSION,
  createDevToolsPanel,
  createElement,
  createStyles2 as createStyles,
  devtools_panel_default as default,
  formatStatus,
  formatTimestamp2 as formatTimestamp,
  getDevToolsPanel,
  healthCheck,
  info,
  resetDevToolsPanel
};
