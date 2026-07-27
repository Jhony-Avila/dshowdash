import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { markMounted, markUnmounting, reset as resetLifecycle } from "./lifecycle.js";
import { setMounted, setReady, getState } from "../state/store.js";
import { createBaseShell, createRegions } from "../ui/template.js";
import { applyInitialEffects, resetTransitions } from "../ui/transitions.js";
const VERSION = "3.3.1-EXPORT-FIX";
const MODULE_ID = "app-shell-mount";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPortsSnapshot() {
  return Ports.snapshot();
}
const _metrics = { mounts: 0, unmounts: 0, finalizes: 0, errors: 0 };
function mountShell(options) {
  _initPorts();
  options = options || {};
  return new Promise((resolve) => {
    try {
      const shell = createBaseShell();
      createRegions(shell);
      if (!document.getElementById("app-shell")) {
        document.body.appendChild(shell);
      }
      applyInitialEffects();
      markMounted();
      setMounted(true);
      _metrics.mounts++;
      resolve({ ok: true, shell });
    } catch (e) {
      _metrics.errors++;
      resolve({ ok: false, error: e.message });
    }
  });
}
function unmountShell() {
  _initPorts();
  return new Promise((resolve) => {
    try {
      markUnmounting();
      resetTransitions();
      const shell = document.getElementById("app-shell");
      if (shell && shell.parentNode) {
        shell.parentNode.removeChild(shell);
      }
      setMounted(false);
      setReady(false);
      resetLifecycle();
      _metrics.unmounts++;
      resolve({ ok: true });
    } catch (e) {
      _metrics.errors++;
      resolve({ ok: false, error: e.message });
    }
  });
}
function finalizeShellReady() {
  _initPorts();
  try {
    const shell = document.getElementById("app-shell");
    if (shell) {
      shell.classList.add("ready");
      shell.setAttribute("data-ready", "true");
    }
    setReady(true);
    _metrics.finalizes++;
    return { ok: true };
  } catch (e) {
    _metrics.errors++;
    return { ok: false, error: e.message };
  }
}
function getShellStatus() {
  const state = getState();
  const shellExists = typeof document !== "undefined" && !!document.getElementById("app-shell");
  return {
    mounted: state.mounted || false,
    ready: state.ready || false,
    shellExists,
    phase: state.phase || "idle",
    metrics: Object.assign({}, _metrics),
    timestamp: Date.now()
  };
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function healthCheck() {
  const portsSnapshot = Ports.snapshot();
  const shellExists = !!document.getElementById("app-shell");
  const checks = {
    shellMounted: shellExists,
    noErrors: _metrics.errors === 0,
    portsInitialized: portsSnapshot._initialized
  };
  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if (checks[keys[i]]) passed++;
  }
  return {
    status: passed === keys.length ? "HEALTHY" : "DEGRADED",
    score: `${passed}/${keys.length}`,
    checks,
    shellExists,
    metrics: getMetrics(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  const portsSnapshot = Ports.snapshot();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    shellExists: !!document.getElementById("app-shell"),
    metrics: getMetrics(),
    portsStatus: { initialized: portsSnapshot._initialized },
    timestamp: Date.now()
  };
}
var mount_default = {
  VERSION,
  MODULE_ID,
  mountShell,
  unmountShell,
  finalizeShellReady,
  getShellStatus,
  getMetrics,
  healthCheck,
  info,
  injectPorts,
  getPortsSnapshot
};
export {
  MODULE_ID,
  VERSION,
  mount_default as default,
  finalizeShellReady,
  getMetrics,
  getPortsSnapshot,
  getShellStatus,
  healthCheck,
  info,
  injectPorts,
  mountShell,
  unmountShell
};
