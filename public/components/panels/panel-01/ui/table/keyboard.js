const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/keyboard";
class KeyboardHandler {
  constructor(container, options = {}) {
    this.container = container;
    this.onAction = options.onAction || (() => {
    });
    this._handler = null;
    this._searchFocused = false;
    this._abortController = null;
  }
  init() {
    this._abortController = new AbortController();
    this._handler = (e) => this._handleKey(e);
    document.addEventListener("keydown", this._handler, { signal: this._abortController.signal });
    const searchInput = this.container?.querySelector('[data-filter="q"]');
    if (searchInput) {
      searchInput.addEventListener("focus", () => this._searchFocused = true);
      searchInput.addEventListener("blur", () => this._searchFocused = false);
    }
  }
  _handleKey(e) {
    if (this._searchFocused && e.key !== "Escape") return;
    switch (e.key) {
      case "/":
        e.preventDefault();
        this.container?.querySelector('[data-filter="q"]')?.focus();
        break;
      case "Escape":
        this.container?.querySelector('[data-filter="q"]')?.blur();
        this.onAction("escape");
        break;
      case "r":
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          this.onAction("refresh");
        }
        break;
      case "e":
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          this.onAction("export");
        }
        break;
      case "ArrowUp":
      case "ArrowDown":
        if (!this._searchFocused) {
          e.preventDefault();
          this.onAction(e.key === "ArrowUp" ? "prev-row" : "next-row");
        }
        break;
      case "Enter":
        if (!this._searchFocused) this.onAction("view-selected");
        break;
    }
  }
  destroy() {
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
    this._handler = null;
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var keyboard_default = KeyboardHandler;
export {
  KeyboardHandler,
  MODULE_ID,
  VERSION,
  keyboard_default as default,
  healthCheck,
  info
};
