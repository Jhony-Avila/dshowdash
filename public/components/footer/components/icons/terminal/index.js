import { Controller } from "./core/controller.js";
import { Lifecycle } from "./core/lifecycle.js";
import { Store } from "./state/store.js";
import { Template } from "./ui/template.js";
import { Tracker } from "./telemetry/tracker.js";
import { Logger } from "./telemetry/logger.js";
const MODULE_ID = "footer-icon-terminal";
const VERSION = "1.0.1-ENTERPRISE";
function _log(level, ...args) {
  if (Logger && typeof Logger[level] === "function") {
    Logger[level]("[TERMINAL]", ...args);
  }
}
const TerminalIcon = {
  getVersion() {
    return VERSION;
  },
  getModuleId() {
    return MODULE_ID;
  },
  // @ts-expect-error TS migration - TS2554
  async init(o = {}) {
    _log("info", "Init");
    return await Controller.init(o);
  },
  async mount(c, p = {}) {
    try {
      const r = await Controller.mount(c, p);
      Store.setProps(r.props);
      Store.markRender();
      Tracker.trackMount();
      Tracker.trackRender(r.props);
      return r;
    } catch (e) {
      Tracker.trackError(e);
      _log("error", "Mount failed:", e.message);
      throw e;
    }
  },
  render(p = {}) {
    Store.setProps(p);
    Store.markRender();
    Tracker.trackRender(p);
    return Template.render(p);
  },
  async unmount() {
    Tracker.trackUnmount();
    const r = await Controller.unmount();
    Store.reset();
    return r;
  },
  async destroy() {
    const r = await Controller.destroy();
    Store.reset();
    Tracker.reset();
    return r;
  },
  // @ts-expect-error TS migration - TS2339
  healthCheck() {
    const l = Lifecycle.info(), m = Tracker.getMetrics();
    const c = { isReady: l.isReady || l.phase === "idle", noErrors: m.errors === 0 };
    const p = Object.values(c).filter(Boolean).length;
    return { status: p === 2 ? "HEALTHY" : "DEGRADED", score: `${p}/2`, checks: c, version: VERSION, timestamp: Date.now() };
  },
  info() {
    return { moduleId: MODULE_ID, version: VERSION, lifecycle: Lifecycle.info(), metrics: Tracker.getMetrics(), timestamp: Date.now() };
  }
};
if (typeof window !== "undefined") {
  window.__dev = window.__dev || {};
  window.__dev.footerIconTerminal = { getVersion: () => VERSION, info: () => TerminalIcon.info(), healthCheck: () => TerminalIcon.healthCheck() };
}
var terminal_default = TerminalIcon;
export {
  MODULE_ID,
  TerminalIcon,
  VERSION,
  terminal_default as default
};
