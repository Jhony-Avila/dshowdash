// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels/panel-integration-mercado-livre/utils/dom
// PURPOSE: Integration Mercado Livre - DOM Utilities
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
export const MODULE_ID = 'panels/panel-integration-mercado-livre/utils/dom';
export const qs = (selector: string, context: Document | Element = document) => context.querySelector(selector);
export const qsa = (selector: string, context: Document | Element = document) => Array.from(context.querySelectorAll(selector));
export const create = (tag: string, attrs: Record<string, unknown> = {}, children: (HTMLElement | string)[] = []) => { const el = document.createElement(tag); Object.entries(attrs).forEach(([k, v]) => { if (k === 'className') el.className = v as string; else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v); else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v as EventListener); else el.setAttribute(k, v as string); }); children.forEach(child => { if (typeof child === 'string') el.appendChild(document.createTextNode(child)); else if (child) el.appendChild(child); }); return el; };
export const remove = (el: HTMLElement | null) => el?.parentNode?.removeChild(el);
export const empty = (el: HTMLElement | null) => { if (el) el.innerHTML = ''; };
export const show = (el: HTMLElement | null) => { if (el) el.style.display = ''; };
export const hide = (el: HTMLElement | null) => { if (el) el.style.display = 'none'; };
export const toggle = (el: HTMLElement | null, visible: boolean) => { if (el) el.style.display = visible ? '' : 'none'; };
export const healthCheck = () => ({ status: 'healthy', version: VERSION, moduleId: MODULE_ID });
export const info = () => ({ version: VERSION, moduleId: MODULE_ID, healthCheck: healthCheck() });
export default { qs, qsa, create, remove, empty, show, hide, toggle, healthCheck, info, VERSION, MODULE_ID };
