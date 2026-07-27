// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.5.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: login-modal-utils-dom
// PURPOSE: Login Modal - DOM Utilities (Modularized)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   DOMHelpers — exported value
//   FocusUtils() — exported function
//   ScrollUtils() — exported function
//   A11yInertUtils() — exported function
//   SanitizeUtils() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '5.5.0-ENTERPRISE';
export const MODULE_ID = 'login-modal-utils-dom';

const _metrics = { focusQueries: 0, inertSets: 0, scrollLocks: 0, scrollUnlocks: 0, escapes: 0 };

export function FocusUtils(this: any, config?: Record<string, unknown>) {
  config = config || {};
  this.config = config;
  this.telemetry = config.telemetry || null;
  this.visibilityPolicy = config.visibilityPolicy || 'offsetParent';
  this.selectorWhitelist = this._normalizeSelectors(config.selectorWhitelist);
  this.selectorBlacklist = this._normalizeSelectors(config.selectorBlacklist) || [];
}

FocusUtils.prototype._normalizeSelectors = (selectors: string[] | string | null) => {
  if (!selectors) return null;
  if (Array.isArray(selectors)) return selectors;
  if (typeof selectors === 'string') return [selectors];
  return null;
};

FocusUtils.prototype.getFocusableElements = function(container: HTMLElement) {
  const self = this;
  _metrics.focusQueries++;
  const baseSelectors = ['a[href]', 'area[href]', 'input:not([disabled])', 'select:not([disabled])', 'textarea:not([disabled])', 'button:not([disabled])', '[tabindex]:not([tabindex="-1"]):not([disabled])', '[contenteditable="true"]'];
  const selectors = this.selectorWhitelist || baseSelectors;
  let elements = Array.from(container.querySelectorAll(selectors.join(',')));
  if (this.selectorBlacklist.length > 0) {
    const blacklistSelector = this.selectorBlacklist.join(',');
    elements = elements.filter((el: Element) => !(el as HTMLElement).matches(blacklistSelector));
  }
  elements = elements.filter((el: Element) => {
    if (el.hasAttribute('inert')) return false;
    if ((el as HTMLElement).tabIndex < 0) return false;
    return self._isVisible(el);
  });
  this._track('focus:elements-found', { count: elements.length });
  return elements;
};

FocusUtils.prototype._isVisible = function(element: HTMLElement) {
  switch (this.visibilityPolicy) {
    case 'offsetParent': return element.offsetParent !== null || element === document.activeElement;
    case 'computedStyle': const style = window.getComputedStyle(element); return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    case 'all': return true;
    default: return element.offsetParent !== null;
  }
};

FocusUtils.prototype._track = function(event: string, detail: Record<string, unknown>) { detail = detail || {}; if (this.telemetry && typeof this.telemetry === 'function') { this.telemetry(event, Object.assign({ timestamp: Date.now(), source: 'focus-utils' }, detail)); } };

export function ScrollUtils(this: any, config?: Record<string, unknown>) {
  config = config || {};
  this.config = config;
  this.target = config.target || document.documentElement;
  this.telemetry = config.telemetry || null;
  this.locked = false;
}

ScrollUtils.prototype.lock = function() {
  if (this.locked) return;
  _metrics.scrollLocks++;
  const prev = this.target.style.overflow || '';
  this.target.dataset.prevOverflow = prev;
  this.target.style.overflow = 'hidden';
  this.locked = true;
  this._track('scroll:locked');
};

ScrollUtils.prototype.unlock = function() {
  if (!this.locked) return;
  _metrics.scrollUnlocks++;
  const prev = this.target.dataset.prevOverflow || '';
  this.target.style.overflow = prev;
  delete this.target.dataset.prevOverflow;
  this.locked = false;
  this._track('scroll:unlocked');
};

ScrollUtils.prototype.isLocked = function() { return this.locked; };
ScrollUtils.prototype._track = function(event: string, detail: Record<string, unknown>) { detail = detail || {}; if (this.telemetry && typeof this.telemetry === 'function') { this.telemetry(event, Object.assign({ timestamp: Date.now(), source: 'scroll-utils' }, detail)); } };

export function A11yInertUtils(this: any, config?: Record<string, unknown>) { config = config || {}; this.config = config; this.telemetry = config.telemetry || null; }

A11yInertUtils.prototype.setInert = function(element: HTMLElement, inert: boolean) {
  inert = inert !== false;
  if (!element) return;
  _metrics.inertSets++;
  if ('inert' in HTMLElement.prototype) { element.inert = inert; }
  else { if (inert) { element.setAttribute('aria-hidden', 'true'); element.setAttribute('data-inert-polyfill', 'true'); } else { element.removeAttribute('aria-hidden'); element.removeAttribute('data-inert-polyfill'); } }
  this._track('inert:set', { inert, elementId: element.id });
};

A11yInertUtils.prototype._track = function(event: string, detail: Record<string, unknown>) { detail = detail || {}; if (this.telemetry && typeof this.telemetry === 'function') { this.telemetry(event, Object.assign({ timestamp: Date.now(), source: 'inert-utils' }, detail)); } };

export function SanitizeUtils(this: any, config?: Record<string, unknown>) { config = config || {}; this.config = config; this.preserveLineBreaks = config.preserveLineBreaks || false; }

SanitizeUtils.prototype.escapeHtml = function(text: string) {
  if (!text) return '';
  _metrics.escapes++;
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  let escaped = String(text).replace(/[&<>"']/g, (m: string) => map[m]);
  if (this.preserveLineBreaks) { escaped = escaped.replace(/\n/g, '<br>'); }
  return escaped;
};

SanitizeUtils.prototype.stripHtml = (text: string) => { if (!text) return ''; const div = document.createElement('div'); div.textContent = text; return div.innerHTML; };

let _focusUtilsInstance: any = null;
let _scrollUtilsInstance: any = null;
let _inertUtilsInstance: any = null;
let _sanitizeUtilsInstance: any = null;

export const DOMHelpers = {
  getFocusableElements(container: HTMLElement) { if (!_focusUtilsInstance) { _focusUtilsInstance = new (FocusUtils as any)(); } return _focusUtilsInstance.getFocusableElements(container); },
  setInert(element: HTMLElement, inert: boolean) { if (!_inertUtilsInstance) { _inertUtilsInstance = new (A11yInertUtils as any)(); } return _inertUtilsInstance.setInert(element, inert !== false); },
  lockScroll() { if (!_scrollUtilsInstance) { _scrollUtilsInstance = new (ScrollUtils as any)(); } return _scrollUtilsInstance.lock(); },
  unlockScroll() { if (!_scrollUtilsInstance) { _scrollUtilsInstance = new (ScrollUtils as any)(); } return _scrollUtilsInstance.unlock(); },
  escapeHtml(text: string) { if (!_sanitizeUtilsInstance) { _sanitizeUtilsInstance = new (SanitizeUtils as any)(); } return _sanitizeUtilsInstance.escapeHtml(text); }
};

export function info() { return { moduleId: MODULE_ID, version: VERSION, metrics: Object.assign({}, _metrics), timestamp: Date.now() }; }

export function healthCheck() {
  const checks = { focusUtilsAvailable: typeof FocusUtils === 'function', scrollUtilsAvailable: typeof ScrollUtils === 'function', sanitizeUtilsAvailable: typeof SanitizeUtils === 'function', domHelpersExported: !!DOMHelpers };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${total}`, healthy: passed >= 3, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}

export default DOMHelpers;
