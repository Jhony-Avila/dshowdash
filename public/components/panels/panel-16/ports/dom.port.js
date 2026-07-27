const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-16:port:dom";
let _windowRef = null;
let _documentRef = null;
const DomPort = {
  inject(windowRef, documentRef) {
    _windowRef = windowRef;
    _documentRef = documentRef;
  },
  _getWindow() {
    if (_windowRef) return _windowRef;
    if (typeof window !== "undefined") return window;
    return null;
  },
  _getDocument() {
    if (_documentRef) return _documentRef;
    if (typeof document !== "undefined") return document;
    return null;
  },
  getViewportWidth() {
    const win = this._getWindow();
    return win?.innerWidth || 1024;
  },
  getViewportHeight() {
    const win = this._getWindow();
    return win?.innerHeight || 768;
  },
  openWindow(url, target = "_blank", features = "") {
    const win = this._getWindow();
    if (win?.open) return win.open(url, target, features);
    return null;
  },
  createElement(tagName) {
    const doc = this._getDocument();
    if (doc?.createElement) return doc.createElement(tagName);
    return null;
  },
  querySelector(selector) {
    const doc = this._getDocument();
    if (doc?.querySelector) return doc.querySelector(selector);
    return null;
  },
  addEventListener(target, event, handler, options) {
    if (target === "document") {
      const doc = this._getDocument();
      if (doc?.addEventListener) doc.addEventListener(event, handler, options);
    } else if (target === "window") {
      const win = this._getWindow();
      if (win?.addEventListener) win.addEventListener(event, handler, options);
    }
  },
  removeEventListener(target, event, handler) {
    if (target === "document") {
      const doc = this._getDocument();
      if (doc?.removeEventListener) doc.removeEventListener(event, handler);
    } else if (target === "window") {
      const win = this._getWindow();
      if (win?.removeEventListener) win.removeEventListener(event, handler);
    }
  },
  isHidden() {
    const doc = this._getDocument();
    return doc?.hidden || false;
  },
  isAvailable() {
    return !!(this._getWindow() && this._getDocument());
  },
  reset() {
    _windowRef = null;
    _documentRef = null;
  },
  info() {
    return { moduleId: MODULE_ID, version: VERSION, injected: !!(_windowRef || _documentRef), available: this.isAvailable(), viewport: { width: this.getViewportWidth(), height: this.getViewportHeight() } };
  },
  healthCheck() {
    return { status: this.isAvailable() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, available: this.isAvailable(), timestamp: Date.now() };
  }
};
var dom_port_default = DomPort;
export {
  DomPort,
  MODULE_ID,
  VERSION,
  dom_port_default as default
};
