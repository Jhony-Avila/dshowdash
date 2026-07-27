// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels/_shared/utils/dom
// PURPOSE: Panels Shared - DOM Utils
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createElement() — exported function
//   removeElement() — exported function
//   clearElement() — exported function
//   addClass() — exported function
//   removeClass() — exported function
//   toggleClass() — exported function
//   hasClass() — exported function
//   setAttributes() — exported function
//   getData() — exported function
//   setData() — exported function
//   isVisible() — exported function
//   waitForElement() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.getComputedStyle
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panels/_shared/utils/dom';

export function $(selector: string, context: Document | Element = document) {
  return context.querySelector(selector);
}

export function $$(selector: string, context: Document | Element = document) {
  return Array.from(context.querySelectorAll(selector));
}

export function createElement(tag: string, attrs: Record<string, unknown> = {}, children: Array<string | Node> = []) {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'className') el.className = value as string;
    else if (key === 'dataset') Object.assign(el.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value as EventListener);
    }
    else el.setAttribute(key, value as string);
  });
  children.forEach(child => {
    if (typeof child === 'string') el.appendChild(document.createTextNode(child));
    else if (child instanceof Node) el.appendChild(child);
  });
  return el;
}

export function removeElement(el: Element | null | undefined) {
  if (el && el.parentNode) el.parentNode.removeChild(el);
}

export function clearElement(el: Element | null | undefined) {
  if (el) el.innerHTML = '';
}

export function addClass(el: Element | null | undefined, ...classes: string[]) {
  if (el) el.classList.add(...classes);
}

export function removeClass(el: Element | null | undefined, ...classes: string[]) {
  if (el) el.classList.remove(...classes);
}

export function toggleClass(el: Element | null | undefined, className: string, force?: boolean) {
  if (el) return el.classList.toggle(className, force);
  return false;
}

export function hasClass(el: Element | null | undefined, className: string) {
  return el?.classList?.contains(className) || false;
}

export function setAttributes(el: Element | null | undefined, attrs: Record<string, string | null | undefined>) {
  if (!el) return;
  Object.entries(attrs).forEach(([key, value]) => {
    if (value === null || value === undefined) el.removeAttribute(key);
    else el.setAttribute(key, value);
  });
}

export function getData(el: HTMLElement | null | undefined, key: string) {
  return el?.dataset?.[key];
}

export function setData(el: HTMLElement | null | undefined, key: string, value: string) {
  if (el?.dataset) el.dataset[key] = value;
}

export function isVisible(el: Element | null | undefined) {
  if (!el) return false;
  const style = window.getComputedStyle(el);
  return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
}

export function waitForElement(selector: string, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const el = document.querySelector(selector);
    if (el) return resolve(el);
    
    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) { observer.disconnect(); resolve(el); }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => { observer.disconnect(); reject(new Error(`Element ${selector} not found`)); }, timeout);
  });
}

export default { $, $$, createElement, removeElement, clearElement, addClass, removeClass, toggleClass, hasClass, setAttributes, getData, setData, isVisible, waitForElement, VERSION, MODULE_ID };

