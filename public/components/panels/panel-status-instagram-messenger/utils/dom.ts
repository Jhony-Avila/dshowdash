// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels/panel-status-instagram-messenger/utils/dom
// PURPOSE: Status  - DOM Utilities
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   qs() — exported function
//   qsa() — exported function
//   create() — exported function
//   remove() — exported function
//   empty() — exported function
//   show() — exported function
//   hide() — exported function
//   toggle() — exported function
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panels/panel-status-instagram-messenger/utils/dom';

export function qs(selector: string, context: Document | HTMLElement = document) { return context.querySelector(selector); }
export function qsa(selector: string, context: Document | HTMLElement = document) { return Array.from(context.querySelectorAll(selector)); }

export function create(tag: string, attrs: Record<string, unknown> = {}, children: (string | HTMLElement)[] = []) {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'className') el.className = v as string;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
    else el.setAttribute(k, v as string);
  });
  children.forEach(child => {
    if (typeof child === 'string') el.appendChild(document.createTextNode(child));
    else if (child) el.appendChild(child);
  });
  return el;
}

export function remove(el: HTMLElement) { el?.parentNode?.removeChild(el); }
export function empty(el: HTMLElement) { if (el) el.innerHTML = ''; }
export function show(el: HTMLElement) { if (el) el.style.display = ''; }
export function hide(el: HTMLElement) { if (el) el.style.display = 'none'; }
export function toggle(el: HTMLElement, visible: boolean) { if (el) el.style.display = visible ? '' : 'none'; }

export function healthCheck() { return { status: 'healthy', version: VERSION, moduleId: MODULE_ID }; }
export function info() { return { version: VERSION, moduleId: MODULE_ID, healthCheck: healthCheck() }; }

export default { qs, qsa, create, remove, empty, show, hide, toggle, healthCheck, info, VERSION, MODULE_ID };
