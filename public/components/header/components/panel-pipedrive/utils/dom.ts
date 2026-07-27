// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/components/panel-pipedrive/utils/dom
// PURPOSE: panel-pipedrive - DOM Utilities (Enterprise)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createElement() — exported function
//   removeElement() — exported function
//   emptyElement() — exported function
//   addClass() — exported function
//   removeClass() — exported function
//   toggleClass() — exported function
//   hasClass() — exported function
//   setAttr() — exported function
//   getAttr() — exported function
//   removeAttr() — exported function
//   healthCheck() — exported function
//   info() — exported function
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

import { VERSION } from '/core/version.js'; export { VERSION };
export const MODULE_ID = 'header/components/panel-pipedrive/utils/dom';

export function $(selector: string, context = document) { return context.querySelector(selector); }
export function $$(selector: string, context = document) { return Array.from(context.querySelectorAll(selector)); }

export function createElement(tag: string, attrs = {}, children = []) {
  const el = document.createElement(tag);
  // @ts-expect-error TS migration - TS2322, TS2345
  Object.entries(attrs).forEach(([k, v]) => { if (k === 'className') el.className = v; else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v); else el.setAttribute(k, v); });
  children.forEach(child => { if (typeof child === 'string') el.appendChild(document.createTextNode(child)); else if (child) el.appendChild(child); });
  return el;
}

export function removeElement(el: HTMLElement|null) { if (el && el.parentNode) el.parentNode.removeChild(el); }
export function emptyElement(el: HTMLElement|null) { if (el) while (el.firstChild) el.removeChild(el.firstChild); }
// @ts-expect-error TS migration - TS2345
export function addClass(el: HTMLElement|null, ...classes: unknown[]) { if (el) el.classList.add(...classes); }
// @ts-expect-error TS migration - TS2345
export function removeClass(el: HTMLElement|null, ...classes: unknown[]) { if (el) el.classList.remove(...classes); }
export function toggleClass(el: HTMLElement|null, className: string, force: boolean) { if (el) return el.classList.toggle(className, force); }
export function hasClass(el: HTMLElement|null, className: string) { return el ? el.classList.contains(className) : false; }
// @ts-expect-error TS migration - TS2345
export function setAttr(el: HTMLElement|null, name: string, value: unknown) { if (el) el.setAttribute(name, value); }
export function getAttr(el: HTMLElement|null, name: string) { return el ? el.getAttribute(name) : null; }
export function removeAttr(el: HTMLElement|null, name: string) { if (el) el.removeAttribute(name); }

export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { domReady: typeof document !== 'undefined' } }; }
export function info() { return { version: VERSION, moduleId: MODULE_ID }; }
export default { $, $$, createElement, removeElement, emptyElement, addClass, removeClass, toggleClass, hasClass, setAttr, getAttr, removeAttr };
