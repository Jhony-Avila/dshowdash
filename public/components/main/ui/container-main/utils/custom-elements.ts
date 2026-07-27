// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-LOGGER-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-custom-elements
// PURPOSE: Container-Main Custom Elements Helper
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ./logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   define() — exported function
//   create() — exported function
//   functional() — exported function
//   whenDefined() — exported function
//   isDefined() — exported function
//   getRegistered() — exported function
//   upgrade() — exported function
//   info() — exported function
//   healthCheck() — exported function
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

import { createLogger } from './logger.js';

export const VERSION = '1.1.0-LOGGER-INTEGRATED';
export const MODULE_ID = 'container-custom-elements';

const logger = createLogger(MODULE_ID);
const _registeredElements = new Map();

// Base class for container custom elements
export class ContainerElement extends HTMLElement {
  [key: string]: any;
  static get observedAttributes(): string[] { return []; }
  
  constructor() {
    super();
    this._initialized = false;
    this._props = {};
    this._listeners = [];
  }
  
  connectedCallback() {
    if (!this._initialized) {
      this._initialized = true;
      this.render();
      this.onMount?.();
    }
  }
  
  disconnectedCallback() {
    this._cleanup();
    this.onUnmount?.();
  }
  
  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue !== newValue) {
      this._props[name] = newValue;
      this.onAttributeChange?.(name, oldValue, newValue);
      if (this._initialized) this.render();
    }
  }
  
  // Override in subclass
  render() {}
  onMount() {}
  onUnmount() {}
  onAttributeChange(name: string, oldValue: string, newValue: string) {}
  
  // Helper methods
  $(selector: string) { return this.querySelector(selector); }
  $$(selector: string) { return this.querySelectorAll(selector); }
  
  emit(eventName: string, detail: Record<string, unknown> = {}) {
    this.dispatchEvent(new CustomEvent(eventName, { bubbles: true, composed: true, detail }));
  }
  
  on(eventName: string, handler: (...args: unknown[]) => void, options: Record<string, unknown> = {}) {
    this.addEventListener(eventName, handler, options);
    this._listeners.push({ eventName, handler, options });
    return () => this.off(eventName, handler);
  }
  
  off(eventName: string, handler: (...args: unknown[]) => void) {
    this.removeEventListener(eventName, handler);
    // @ts-expect-error TS migration - TS2339
    this._listeners = this._listeners.filter((l: unknown) => !((l as Record<string, unknown>).eventName === eventName && l.handler === handler));
  }
  
  _cleanup() {
    this._listeners.forEach(({ eventName, handler }: Record<string, unknown>) => {
      // @ts-expect-error TS migration - TS2769
      this.removeEventListener(eventName, handler);
    });
    this._listeners = [];
  }
  
  // Props management
  get props() { return { ...this._props }; }
  
  setProp(name: string, value: unknown) {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      this.setAttribute(name, String(value));
    } else {
      this._props[name] = value;
      if (this._initialized) this.render();
    }
  }
  
  getProp(name: string, defaultValue: string | null = null) {
    return this.getAttribute(name) ?? this._props[name] ?? defaultValue;
  }
}

// Shadow DOM version
export class ContainerShadowElement extends ContainerElement {
  [key: string]: any;
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  
  // @ts-expect-error strict migration — TS2531
  $(selector: string) { return this.shadowRoot.querySelector(selector); }
  // @ts-expect-error strict migration — TS2531
  $$(selector: string) { return this.shadowRoot.querySelectorAll(selector); }
  
  setStyles(css: string) {
    const style = document.createElement('style');
    style.textContent = css;
    // @ts-expect-error strict migration — TS2531
    this.shadowRoot.appendChild(style);
  }
  
  setTemplate(html: string) {
    const template = document.createElement('template');
    template.innerHTML = html;
    // @ts-expect-error strict migration — TS2531
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }
}

// Define and register a custom element
export function define(tagName: string, elementClass: unknown, options: Record<string, unknown> = {}) {
  if (!tagName.includes('-')) {
    throw new Error(`Custom element name must contain a hyphen: ${tagName}`);
  }
  
  if (customElements.get(tagName)) {
    logger.warn('Element already defined', { tagName });
    return false;
  }
  
  // @ts-expect-error TS migration - TS2345
  customElements.define(tagName, elementClass, options);
  _registeredElements.set(tagName, elementClass);
  return true;
}

// Create element from tag
// @ts-expect-error TS migration - TS2322
export function create(tagName: string, props: Record<string, unknown> = {}, children: Record<string, unknown> = []) {
  const element = document.createElement(tagName);
  
  Object.entries(props).forEach(([key, value]) => {
    if (key.startsWith('on') && typeof value === 'function') {
      // @ts-expect-error TS migration - TS2769
      element.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'class' || key === 'className') {
      element.className = (value) as string;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      element.setAttribute(key, String(value));
    // @ts-expect-error TS migration - TS2339
    } else if (element.setProp) {
      // @ts-expect-error TS migration - TS2339
      element.setProp(key, value);
    }
  });
  
  (children.forEach as (...args: unknown[]) => unknown)((child: unknown) => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      element.appendChild(child);
    }
  });
  
  return element;
}

// Create functional component wrapper
export function functional(tagName: string, renderFn: unknown, options: Record<string, unknown> = {}) {
  const { observedAttributes = [] as string[], styles = '' } = options as { observedAttributes?: string[]; styles?: string; shadow?: boolean };
  
  class FunctionalElement extends (options.shadow ? ContainerShadowElement : ContainerElement) {
    static get observedAttributes() { return observedAttributes; }
    
    render() {
      const root = options.shadow ? this.shadowRoot : this;
      const html = (renderFn as (...args: unknown[]) => unknown)(this.props, this);
      
      if (options.shadow && styles && !this._stylesApplied) {
        this.setStyles(styles);
        this._stylesApplied = true;
      }
      
      if (typeof html === 'string') {
        let content = root!.querySelector('.fc-content');
        if (!content) {
          content = document.createElement('div');
          content.className = 'fc-content';
          root!.appendChild(content);
        }
        content.innerHTML = html;
      }
    }
  }
  
  define(tagName, FunctionalElement);
  return FunctionalElement;
}

// Wait for element to be defined
export function whenDefined(tagName: string) {
  return customElements.whenDefined(tagName);
}

// Check if element is defined
export function isDefined(tagName: string) {
  return customElements.get(tagName) !== undefined;
}

// Get all registered elements
export function getRegistered() {
  return [..._registeredElements.keys()];
}

// Upgrade element
export function upgrade(element: HTMLElement) {
  customElements.upgrade(element);
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, registeredElements: _registeredElements.size, elements: getRegistered() };
}

export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, registeredElements: _registeredElements.size };
}

export default {
  ContainerElement, ContainerShadowElement,
  define, create, functional, whenDefined, isDefined, getRegistered, upgrade,
  info, healthCheck, VERSION, MODULE_ID
};
