// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.0-BULLETPROOF-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-dom-utils
// PURPOSE: DOM Utils - Utilitários de DOM para Sidebar
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
//   setAttrs() — exported function
//   setStyles() — exported function
//   getData() — exported function
//   setData() — exported function
//   delegate() — exported function
//   debounce() — exported function
//   throttle() — exported function
//   rafThrottle() — exported function
//   waitForElement() — exported function
//   scrollIntoView() — exported function
//   isVisible() — exported function
//   isInViewport() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.innerHeight
//   window.innerWidth
// ═══════════════════════════════════════════════════════════════
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '5.5.0-ENTERPRISE-FULL';
export const MODULE_ID = 'sidebar-dom-utils';

let _metrics = { creates: 0, queries: 0, delegates: 0 };

export function createElement(tag: string, attrs = {}, children: DynObj[] = []) {
  _metrics.creates++;
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'className') el.className = value as DynObj;
    else if (key === 'style' && typeof value === 'object') Object.assign(el.style, value);
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2).toLowerCase(), value as DynObj);
    else if (key.startsWith('data')) el.dataset[key.slice(4).toLowerCase()] = value as DynObj;
    // @ts-expect-error strict migration — TS2769, TS2345
    else if (key === 'aria') Object.entries(value).forEach(([ariaKey, ariaVal]) => el.setAttribute(`aria-${ariaKey}`, ariaVal));
    else el.setAttribute(key, (value as DynObj));
  });
  children.forEach(child => {
    if (typeof child === 'string') el.appendChild(document.createTextNode(child));
    else if (child instanceof Node) el.appendChild(child);
  });
  return el;
}

export function $(selector: string, context = document) { _metrics.queries++; return context.querySelector(selector); }
export function $$(selector: string, context = document) { _metrics.queries++; return Array.from(context.querySelectorAll(selector)); }
export function addClass(el: HTMLElement, ...classes: DynObj[]) { el?.classList?.add(...classes.filter(Boolean)); }
export function removeClass(el: HTMLElement, ...classes: DynObj[]) { el?.classList?.remove(...classes.filter(Boolean)); }
export function toggleClass(el: HTMLElement, className: string, force: boolean) { return el?.classList?.toggle(className, force); }
export function hasClass(el: HTMLElement, className: string) { return el?.classList?.contains(className) ?? false; }
export function setAttrs(el: HTMLElement, attrs: DynObj) { if (!el) return; Object.entries(attrs).forEach(([key, value]) => { if (value === null || value === undefined) el.removeAttribute(key); else el.setAttribute(key, String(value)); }); }
export function setStyles(el: HTMLElement, styles: Record<string, string>) { if (!el) return; Object.assign(el.style, styles); }
export function getData(el: HTMLElement, key: string) { return el?.dataset?.[key]; }
export function setData(el: HTMLElement, key: string, value: string) { if (el?.dataset) el.dataset[key] = value; }

export function delegate(container: HTMLElement, selector: string, event: string, handler: DynObj) {
  _metrics.delegates++;
  const listener = (e: DynObj) => { const target = e.target.closest(selector); if (target && container.contains(target)) handler.call(target, e, target); };
  container.addEventListener(event, listener);
  return () => container.removeEventListener(event, listener);
}

export function debounce(fn: DynObj, delay = 150) { let timer: DynObj; return (...args: DynObj[]) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); }; }
export function throttle(fn: DynObj, limit = 150) { let inThrottle: DynObj; return (...args: DynObj[]) => { if (!inThrottle) { fn(...args); inThrottle = true; setTimeout(() => inThrottle = false, limit); } }; }
export function rafThrottle(fn: DynObj) { let ticking = false; return (...args: DynObj[]) => { if (!ticking) { requestAnimationFrame(() => { fn(...args); ticking = false; }); ticking = true; } }; }

export function waitForElement(selector: string, timeout = 5000, context = document) {
  return new Promise((resolve, reject) => {
    const el = context.querySelector(selector);
    if (el) return resolve(el);
    const observer = new MutationObserver((mutations, obs) => { const el = context.querySelector(selector); if (el) { obs.disconnect(); resolve(el); } });
    observer.observe(context, { childList: true, subtree: true });
    setTimeout(() => { observer.disconnect(); reject(new Error(`Element ${selector} not found within ${timeout}ms`)); }, timeout);
  });
}

export function scrollIntoView(el: HTMLElement, options = {}) { el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', ...options }); }
export function isVisible(el: HTMLElement) { if (!el) return false; const rect = el.getBoundingClientRect(); return rect.width > 0 && rect.height > 0; }
export function isInViewport(el: HTMLElement, threshold = 0) { if (!el) return false; const rect = el.getBoundingClientRect(); return rect.top >= -threshold && rect.left >= -threshold && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + threshold && rect.right <= (window.innerWidth || document.documentElement.clientWidth) + threshold; }

export function getMetrics() { return { ..._metrics }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics() }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { domAvailable: typeof document !== 'undefined' }, metrics: getMetrics() }; }

export default { createElement, $, $$, addClass, removeClass, toggleClass, hasClass, setAttrs, setStyles, getData, setData, delegate, debounce, throttle, rafThrottle, waitForElement, scrollIntoView, isVisible, isInViewport, healthCheck, info, getMetrics, VERSION, MODULE_ID };
