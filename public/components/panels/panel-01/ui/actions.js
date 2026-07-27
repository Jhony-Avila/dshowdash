const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/actions";
class ActionsHandler {
  constructor(container, options = {}) {
    this.container = container;
    this.handlers = options.handlers || {};
    this._listener = null;
  }
  init() {
    if (!this.container) return;
    this._listener = (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const action = btn.dataset.action;
      if (this.handlers[action]) {
        e.preventDefault();
        this.handlers[action](btn, e);
      }
    };
    this.container.addEventListener("click", this._listener);
  }
  registerHandler(action, handler) {
    this.handlers[action] = handler;
  }
  destroy() {
    if (this._listener && this.container) {
      this.container.removeEventListener("click", this._listener);
    }
    this._listener = null;
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var actions_default = ActionsHandler;
export {
  ActionsHandler,
  MODULE_ID,
  VERSION,
  actions_default as default,
  healthCheck,
  info
};
