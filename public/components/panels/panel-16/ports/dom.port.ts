// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-16:port:dom
// PURPOSE: DOM Port - Panel-16 AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   DomPort — exported value
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-16:port:dom';

let _windowRef: Window | null = null;
let _documentRef: Document | null = null;

export const DomPort = {
  inject(windowRef: Window, documentRef: Document) { _windowRef = windowRef; _documentRef = documentRef; },
  _getWindow() { if (_windowRef) return _windowRef; if (typeof window !== 'undefined') return window; return null; },
  _getDocument() { if (_documentRef) return _documentRef; if (typeof document !== 'undefined') return document; return null; },
  getViewportWidth() { const win = this._getWindow(); return win?.innerWidth || 1024; },
  getViewportHeight() { const win = this._getWindow(); return win?.innerHeight || 768; },
  openWindow(url: string, target = '_blank', features = '') { const win = this._getWindow(); if (win?.open) return win.open(url, target, features); return null; },
  createElement(tagName: string) { const doc = this._getDocument(); if (doc?.createElement) return doc.createElement(tagName); return null; },
  querySelector(selector: string) { const doc = this._getDocument(); if (doc?.querySelector) return doc.querySelector(selector); return null; },
  addEventListener(target: string, event: string, handler: EventListener, options?: AddEventListenerOptions) { if (target === 'document') { const doc = this._getDocument(); if (doc?.addEventListener) doc.addEventListener(event, handler, options); } else if (target === 'window') { const win = this._getWindow(); if (win?.addEventListener) win.addEventListener(event, handler, options); } },
  removeEventListener(target: string, event: string, handler: EventListener) { if (target === 'document') { const doc = this._getDocument(); if (doc?.removeEventListener) doc.removeEventListener(event, handler); } else if (target === 'window') { const win = this._getWindow(); if (win?.removeEventListener) win.removeEventListener(event, handler); } },
  isHidden() { const doc = this._getDocument(); return doc?.hidden || false; },
  isAvailable() { return !!(this._getWindow() && this._getDocument()); },
  reset() { _windowRef = null; _documentRef = null; },
  info() { return { moduleId: MODULE_ID, version: VERSION, injected: !!(_windowRef || _documentRef), available: this.isAvailable(), viewport: { width: this.getViewportWidth(), height: this.getViewportHeight() } }; },
  healthCheck() { return { status: this.isAvailable() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, available: this.isAvailable(), timestamp: Date.now() }; }
};

export default DomPort;
