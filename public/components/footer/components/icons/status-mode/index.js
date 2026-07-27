import { Controller } from "./core/controller.js";
import { Lifecycle } from "./core/lifecycle.js";
import { Store } from "./state/store.js";
import { Template } from "./ui/template.js";
import { States } from "./ui/states.js";
import { Tracker } from "./telemetry/tracker.js";
import { Logger } from "./telemetry/logger.js";
const MODULE_ID = "footer-icon-status-mode";
const VERSION = "1.0.1-ENTERPRISE";
function _log(level, ...args) {
  if (Logger && typeof Logger[level] === "function") {
    Logger[level]("[STATUS-MODE]", ...args);
  }
}
const StatusModeIcon = {
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
      Store.setMode(r.props.mode || "normal");
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
    Store.setMode(p.mode || "normal");
    Store.markRender();
    Tracker.trackRender(p);
    return Template.render(p);
  },
  setMode(mode) {
    const el = Lifecycle.getContainer()?.querySelector(".dsd-icon--status-mode");
    if (el) {
      const oldMode = Store.getMode();
      States.applyMode(el, mode);
      Store.setMode(mode);
      Tracker.trackModeChange();
      _log("info", "Mode changed:", oldMode, "->", mode);
    }
  },
  getMode() {
    return Store.getMode();
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
  healthCheck() {
    const l = Lifecycle.info(), m = Tracker.getMetrics();
    const c = { isReady: l.isReady || l.phase === "idle", noErrors: m.errors === 0 };
    const p = Object.values(c).filter(Boolean).length;
    return { status: p === 2 ? "HEALTHY" : "DEGRADED", score: `${p}/2`, checks: c, currentMode: Store.getMode(), version: VERSION, timestamp: Date.now() };
  },
  info() {
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      lifecycle: Lifecycle.info(),
      currentMode: Store.getMode(),
      metrics: Tracker.getMetrics(),
      availableModes: ["normal", "maintenance", "p0", "incident", "degraded"],
      timestamp: Date.now()
    };
  }
};
if (typeof window !== "undefined") {
  window.__dev = window.__dev || {};
  window.__dev.footerIconStatusMode = { getVersion: () => VERSION, info: () => StatusModeIcon.info(), healthCheck: () => StatusModeIcon.healthCheck(), setMode: (m) => StatusModeIcon.setMode(m) };
}
var status_mode_default = StatusModeIcon;
export {
  MODULE_ID,
  StatusModeIcon,
  VERSION,
  status_mode_default as default
};
