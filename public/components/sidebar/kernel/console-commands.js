const MODULE_ID = "sidebar-kernel-console-commands";
const VERSION = "1.1.0-ES6";
let _kernel = null;
let _registered = false;
function _status() {
  if (!_kernel) return console.warn("[sk] Kernel not connected");
  const i = _kernel.info();
  console.log("%cSidebarKernel Status", "font-weight:bold;color:#8B5CF6");
  console.log("Version:", i.data.version);
  console.log("Status:", i.data.status);
  const h = _kernel.healthCheck();
  console.log("Health:", h.status, `(${h.score}%)`);
  console.log("Features:", i.data.featuresCount);
  console.log("Uptime:", `${Math.round(i.data.uptime / 1e3)}s`);
  return h;
}
function _list() {
  if (!_kernel) return console.warn("[sk] Kernel not connected");
  const result = _kernel.listFeatures();
  if (result.ok) {
    console.log("%cFeatures", "font-weight:bold;color:#8B5CF6");
    console.table(result.data.features);
  }
  return result.data.features;
}
function _enable(id) {
  if (!_kernel) return console.warn("[sk] Kernel not connected");
  const result = _kernel.enableFeature(id);
  console.log(result.ok ? `\u2713 Enabled: ${id}` : `\u2717 Failed: ${id}`, result);
  return result;
}
function _disable(id) {
  if (!_kernel) return console.warn("[sk] Kernel not connected");
  const result = _kernel.disableFeature(id, "manual");
  console.log(result.ok ? `\u2713 Disabled: ${id}` : `\u2717 Failed: ${id}`, result);
  return result;
}
function _health() {
  if (!_kernel) return console.warn("[sk] Kernel not connected");
  const h = _kernel.healthCheck();
  console.log("%cHealth Check", "font-weight:bold;color:#8B5CF6");
  console.log("Status:", h.status);
  console.log("Score:", `${h.score}%`);
  if (h.issues && h.issues.length > 0) {
    console.log("Issues:");
    h.issues.forEach((i) => {
      console.log("  -", `${i.code}:`, i.message);
    });
  }
  return h;
}
function _metrics() {
  if (!_kernel) return console.warn("[sk] Kernel not connected");
  const m = _kernel.metrics();
  console.log("%cMetrics", "font-weight:bold;color:#8B5CF6");
  console.table(m.data);
  return m.data;
}
function _help() {
  console.log("%cSidebarKernel Console Commands", "font-weight:bold;color:#8B5CF6");
  console.log("");
  console.log("  sk.status()        - Show kernel status");
  console.log("  sk.list()          - List all features");
  console.log("  sk.enable(id)      - Enable a feature");
  console.log("  sk.disable(id)     - Disable a feature");
  console.log("  sk.health()        - Run health check");
  console.log("  sk.metrics()       - Show metrics");
  console.log("  sk.help()          - Show this help");
  console.log("");
}
function registerCommands(kernel) {
  if (_registered) return { ok: true, alreadyRegistered: true };
  _kernel = kernel;
  if (typeof window !== "undefined") {
    window.sk = {
      status: _status,
      list: _list,
      enable: _enable,
      disable: _disable,
      health: _health,
      metrics: _metrics,
      help: _help
    };
    _registered = true;
  }
  return { ok: true };
}
function unregisterCommands() {
  if (typeof window !== "undefined" && window.sk) {
    delete window.sk;
  }
  _kernel = null;
  _registered = false;
  return { ok: true };
}
var console_commands_default = {
  MODULE_ID,
  VERSION,
  registerCommands,
  unregisterCommands
};
export {
  MODULE_ID,
  VERSION,
  console_commands_default as default,
  registerCommands,
  unregisterCommands
};
