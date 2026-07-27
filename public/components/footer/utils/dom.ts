// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.2.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: footer-utils-dom
// PURPOSE: Footer Utils - DOM Helpers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createElement() — exported function
//   addClass() — exported function
//   removeClass() — exported function
//   toggleClass() — exported function
//   hasClass() — exported function
//   setAttr() — exported function
//   getAttr() — exported function
//   removeElement() — exported function
//   getMetrics() — exported function
//   getVersion() — exported function
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

export const VERSION = '6.2.0-ENTERPRISE';
export const MODULE_ID = 'footer-utils-dom';

const _metrics = { queries: 0, creates: 0 };

// @ts-expect-error TS migration - TS2322, TS2349
export function $(selector: string, context: Record<string,unknown>) { context = context || document; _metrics.queries++; return context.querySelector(selector); }
// @ts-expect-error TS migration - TS2322, TS2349
export function $$(selector: string, context: Record<string,unknown>) { context = context || document; _metrics.queries++; return Array.from(context.querySelectorAll(selector)); }

export function createElement(tag: string, attrs: Record<string,unknown>, children: unknown) {
  attrs = attrs || {}; children = children || [];
  _metrics.creates++;
  const el = document.createElement(tag);
  Object.keys(attrs).forEach(key => {
    const value = attrs[key];
    // @ts-expect-error TS migration - TS2322
    if (key === 'className') { el.className = value; }
    // @ts-expect-error TS migration - TS2322
    else if (key === 'dataset') { Object.keys(value).forEach(dataKey => { el.dataset[dataKey] = (value as Record<string,unknown>)[dataKey]; }); }
    // @ts-expect-error TS migration - TS2769
    else if (key.indexOf('on') === 0 && typeof value === 'function') { el.addEventListener(key.slice(2).toLowerCase(), value); }
    // @ts-expect-error TS migration - TS2345
    else { el.setAttribute(key, value); }
  });
  // @ts-expect-error TS migration - TS2339
  children.forEach((child: unknown) => { if (typeof child === 'string') { el.appendChild(document.createTextNode(child)); } else if (child instanceof HTMLElement) { el.appendChild(child); } });
  return el;
}

export function addClass(el: HTMLElement|null) { if (el) el.classList.add(...Array.prototype.slice.call(arguments, 1)); }
export function removeClass(el: HTMLElement|null) { if (el) el.classList.remove(...Array.prototype.slice.call(arguments, 1)); }
export function toggleClass(el: HTMLElement|null, className: string, force: boolean) { if (el) el.classList.toggle(className, force); }
export function hasClass(el: HTMLElement|null, className: string) { return el ? el.classList.contains(className) : false; }
// @ts-expect-error TS migration - TS2345
export function setAttr(el: HTMLElement|null, name: string, value: unknown) { if (el) el.setAttribute(name, value); }
export function getAttr(el: HTMLElement|null, name: string) { return el ? el.getAttribute(name) : null; }
export function removeElement(el: HTMLElement|null) { if (el) el.remove(); }

export function getMetrics() { return { queries: _metrics.queries, creates: _metrics.creates }; }
export function getVersion() { return VERSION; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics() }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { domReady: typeof document !== 'undefined' }, metrics: getMetrics() }; }

export default { $, $$, createElement, addClass, removeClass, toggleClass, hasClass, setAttr, getAttr, removeElement, getMetrics, getVersion, info, healthCheck, VERSION, MODULE_ID };
