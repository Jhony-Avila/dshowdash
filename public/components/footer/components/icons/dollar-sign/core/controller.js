import { validateProps } from "./contracts.js";
import { Lifecycle } from "./lifecycle.js";
import { EventsHandler } from "./events.js";
const MODULE_ID = "footer-icon-dollar-sign-controller";
const VERSION = "1.1.0-ENTERPRISE";
let _metrics = { inits: 0, mounts: 0, unmounts: 0, destroys: 0, errors: 0 };
const Controller = {
  async init() {
    _metrics.inits++;
    if (Lifecycle.isReady()) return { success: true, alreadyInitialized: true };
    Lifecycle.setInitializing();
    EventsHandler.init();
    Lifecycle.setReady();
    return { success: true };
  },
  // @ts-expect-error TS migration - TS2339
  async mount(container, props = {}) {
    _metrics.mounts++;
    if (!container) {
      _metrics.errors++;
      throw new Error("Container required");
    }
    const v = validateProps(props);
    const { Template } = await import("../ui/template.js");
    container.innerHTML = Template.render(v.props);
    Lifecycle.setMounted(container);
    if (v.props.clickable) {
      const el = container.querySelector(".dsd-icon--dollar-sign");
      if (el) EventsHandler.bindClick(el, () => EventsHandler.emitClicked(v.props));
    }
    EventsHandler.emitMounted(v.props);
    return { success: true, props: v.props };
  },
  async unmount() {
    _metrics.unmounts++;
    Lifecycle.setUnmounting();
    EventsHandler.cleanup();
    const c = Lifecycle.getContainer();
    if (c) c.innerHTML = "";
    EventsHandler.emitUnmounted();
    Lifecycle.reset();
    return { success: true };
  },
  async destroy() {
    _metrics.destroys++;
    await this.unmount();
    EventsHandler.destroy();
    Lifecycle.setDestroyed();
    return { success: true };
  },
  getLifecycle() {
    return Lifecycle.info();
  }
};
function getMetrics() {
  return { ..._metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, lifecycle: Lifecycle.info(), metrics: getMetrics() };
}
function healthCheck() {
  const isReady = Lifecycle.isReady();
  return { status: isReady ? "HEALTHY" : "IDLE", version: VERSION, moduleId: MODULE_ID, checks: { lifecycleReady: isReady }, metrics: getMetrics() };
}
var controller_default = { ...Controller, getMetrics, info, healthCheck, MODULE_ID, VERSION };
export {
  Controller,
  MODULE_ID,
  VERSION,
  controller_default as default,
  getMetrics,
  healthCheck,
  info
};
