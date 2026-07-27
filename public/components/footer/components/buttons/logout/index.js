import { BUTTON_CONFIG, ACTION_PAYLOAD } from "./contracts.js";
import { createTemplate } from "./ui/template.js";
import { attachEvents } from "./ui/events.js";
import { track } from "./telemetry/tracker.js";
import { runCleanups } from "../_shared/listener-helpers.js";
import { UI_EVENTS } from "/core/runtime/events/catalog/ui.events.js";
const VERSION = "1.0.1-P18EC";
const MODULE_ID = "footer/components/buttons/logout";
class LogoutButton {
  constructor() {
    this._element = null;
    this._hostEl = null;
    this._mounted = false;
    this._initialized = false;
    this._cleanups = [];
    this._config = { ...BUTTON_CONFIG };
  }
  init(ctx = {}) {
    if (this._initialized) return this;
    this._ctx = ctx;
    this._initialized = true;
    return this;
  }
  // @ts-expect-error TS migration - TS2554
  mount(hostEl, props = {}) {
    if (!hostEl) {
      track("error", { message: "hostEl required" });
      return this;
    }
    if (this._mounted && this._hostEl === hostEl) return this;
    if (this._mounted) this.unmount();
    const html = createTemplate({ ...this._config, ...props });
    const temp = document.createElement("div");
    temp.innerHTML = html;
    this._element = temp.firstElementChild;
    attachEvents(this._element, this._cleanups, () => {
      track("clicked");
    });
    hostEl.appendChild(this._element);
    this._hostEl = hostEl;
    this._mounted = true;
    track("mounted");
    return this;
  }
  // @ts-expect-error TS migration - TS2554
  unmount() {
    if (!this._mounted) return this;
    runCleanups(this._cleanups);
    if (this._element?.parentNode) this._element.parentNode.removeChild(this._element);
    this._element = null;
    this._hostEl = null;
    this._mounted = false;
    track("unmounted");
    return this;
  }
  healthCheck() {
    const checks = { initialized: this._initialized, mounted: this._mounted, hasElement: !!this._element, hasHost: !!this._hostEl };
    const score = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return { status: score === total ? "HEALTHY" : score >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${score}/${total}`, checks, version: VERSION, moduleId: MODULE_ID };
  }
  info() {
    return { id: this._config.id, label: this._config.label, icon: this._config.icon, kind: this._config.kind, mounted: this._mounted, initialized: this._initialized, version: VERSION, moduleId: MODULE_ID, emits: [UI_EVENTS.ACTION], actionPayload: ACTION_PAYLOAD };
  }
  getElement() {
    return this._element;
  }
  isMounted() {
    return this._mounted;
  }
  getId() {
    return this._config.id;
  }
}
let _instance = null;
function getInstance() {
  if (!_instance) _instance = new LogoutButton();
  return _instance;
}
function createLogoutButton() {
  return new LogoutButton();
}
const init = (ctx) => getInstance().init(ctx);
const mount = (hostEl, props) => getInstance().mount(hostEl, props);
const unmount = () => getInstance().unmount();
const healthCheck = () => getInstance().healthCheck();
const info = () => getInstance().info();
var logout_default = { LogoutButton, getInstance, createLogoutButton, init, mount, unmount, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  createLogoutButton,
  logout_default as default,
  getInstance,
  healthCheck,
  info,
  init,
  mount,
  unmount
};
