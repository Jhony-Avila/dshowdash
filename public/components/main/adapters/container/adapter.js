import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { isStrict } from "/core/runtime/enterprise/strict-mode.js";
const MODULE_ID = "components.main.adapters.container";
const VERSION = "8.5.0-P2-ENTERPRISE";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
function _getLogger() {
  const portLogger = _getPort("logger");
  if (portLogger) return portLogger;
  if (typeof window !== "undefined" && window.Core?.windowAdapter?.get) {
    const waLogger = window.Core.windowAdapter.get("Logger");
    if (waLogger) return waLogger;
  }
  return console;
}
const _state = { containerId: "container-main", element: null };
const _metrics = { renders: 0, clears: 0, unsafeRendersPrevented: 0 };
function _isSafeContainer(el) {
  if (!el) return false;
  if (el.id === "app") return false;
  if (el.id === "app-shell") return false;
  if (el === document.body) return false;
  if (el === document.documentElement) return false;
  if (el.id === "container-main") return true;
  if (el.closest('#shell-main-region, [data-region="main"], #main')) return true;
  if (el.closest('[data-region="main"]')) return true;
  return false;
}
function getContainer() {
  if (_state.element && document.contains(_state.element)) return _state.element;
  if (typeof document !== "undefined") {
    const shellMain = document.querySelector('#shell-main-region, [data-region="main"], #main');
    if (shellMain) {
      const containerInShell = shellMain.querySelector("#container-main") || shellMain.querySelector(".dsd-container__content") || shellMain.querySelector('[data-container-main="true"]');
      if (containerInShell) {
        _state.element = containerInShell;
        return _state.element;
      }
    }
    const directContainer = document.getElementById(_state.containerId);
    if (directContainer && _isSafeContainer(directContainer)) {
      _state.element = directContainer;
      return _state.element;
    }
  }
  return null;
}
function render(content) {
  _metrics.renders++;
  const container = getContainer();
  const logger = _getLogger();
  if (!container) {
    if (logger?.warn) {
      logger.warn("[ContainerAdapter] render() - No container found");
    } else if (!isStrict()) {
      console.warn("[ContainerAdapter] render() - No container found");
    }
    return { ok: false, error: "Container not found" };
  }
  if (!_isSafeContainer(container)) {
    _metrics.unsafeRendersPrevented++;
    if (!isStrict()) {
      console.error("[ContainerAdapter] BLOCKED: Attempted to render into unsafe container:", container.id || container.tagName);
    }
    return { ok: false, error: "Unsafe container - render blocked" };
  }
  if (typeof content === "string") {
    container.innerHTML = content;
  } else if (content instanceof HTMLElement) {
    container.innerHTML = "";
    container.appendChild(content);
  }
  return { ok: true };
}
function clear() {
  _metrics.clears++;
  const container = getContainer();
  if (container && _isSafeContainer(container)) {
    container.innerHTML = "";
  }
  return { ok: true };
}
function setContainerId(id) {
  _state.containerId = id;
  _state.element = null;
  return { ok: true };
}
function init(ctx) {
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  if (ctx && ctx.containerId) _state.containerId = ctx.containerId;
  return { ok: true, version: VERSION };
}
function healthCheck() {
  const container = getContainer();
  const hasContainer = !!container;
  const isSafe = hasContainer && _isSafeContainer(container);
  return {
    status: isSafe ? "HEALTHY" : hasContainer ? "DEGRADED" : "UNHEALTHY",
    score: isSafe ? 100 : hasContainer ? 50 : 0,
    moduleId: MODULE_ID,
    version: VERSION,
    checks: {
      containerExists: { ok: hasContainer, severity: "crit" },
      containerIsSafe: { ok: isSafe, severity: "crit" },
      portsInitialized: { ok: Ports.isInitialized(), severity: "info" }
    },
    metrics: _metrics,
    strictMode: isStrict()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    containerId: _state.containerId,
    hasContainer: !!getContainer(),
    containerIsSafe: _isSafeContainer(getContainer()),
    metrics: _metrics,
    portsInitialized: Ports.isInitialized(),
    strictMode: isStrict()
  };
}
function createContainerAdapter(options) {
  options = options || {};
  init(options);
  return {
    getContainer,
    render,
    clear,
    setContainerId,
    healthCheck,
    info,
    VERSION,
    MODULE_ID
  };
}
var adapter_default = { MODULE_ID, VERSION, createContainerAdapter, init, getContainer, render, clear, setContainerId, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  clear,
  createContainerAdapter,
  adapter_default as default,
  getContainer,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  render,
  setContainerId
};
