import { createLogger } from "./logger.js";
const VERSION = "1.1.0-LOGGER-INTEGRATED";
const MODULE_ID = "container-custom-elements";
const logger = createLogger(MODULE_ID);
const _registeredElements = /* @__PURE__ */ new Map();
class ContainerElement extends HTMLElement {
  static get observedAttributes() {
    return [];
  }
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
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this._props[name] = newValue;
      this.onAttributeChange?.(name, oldValue, newValue);
      if (this._initialized) this.render();
    }
  }
  // Override in subclass
  render() {
  }
  onMount() {
  }
  onUnmount() {
  }
  onAttributeChange(name, oldValue, newValue) {
  }
  // Helper methods
  $(selector) {
    return this.querySelector(selector);
  }
  $$(selector) {
    return this.querySelectorAll(selector);
  }
  emit(eventName, detail = {}) {
    this.dispatchEvent(new CustomEvent(eventName, { bubbles: true, composed: true, detail }));
  }
  on(eventName, handler, options = {}) {
    this.addEventListener(eventName, handler, options);
    this._listeners.push({ eventName, handler, options });
    return () => this.off(eventName, handler);
  }
  off(eventName, handler) {
    this.removeEventListener(eventName, handler);
    this._listeners = this._listeners.filter((l) => !(l.eventName === eventName && l.handler === handler));
  }
  _cleanup() {
    this._listeners.forEach(({ eventName, handler }) => {
      this.removeEventListener(eventName, handler);
    });
    this._listeners = [];
  }
  // Props management
  get props() {
    return { ...this._props };
  }
  setProp(name, value) {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      this.setAttribute(name, String(value));
    } else {
      this._props[name] = value;
      if (this._initialized) this.render();
    }
  }
  getProp(name, defaultValue = null) {
    return this.getAttribute(name) ?? this._props[name] ?? defaultValue;
  }
}
class ContainerShadowElement extends ContainerElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }
  // @ts-expect-error strict migration — TS2531
  $(selector) {
    return this.shadowRoot.querySelector(selector);
  }
  // @ts-expect-error strict migration — TS2531
  $$(selector) {
    return this.shadowRoot.querySelectorAll(selector);
  }
  setStyles(css) {
    const style = document.createElement("style");
    style.textContent = css;
    this.shadowRoot.appendChild(style);
  }
  setTemplate(html) {
    const template = document.createElement("template");
    template.innerHTML = html;
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }
}
function define(tagName, elementClass, options = {}) {
  if (!tagName.includes("-")) {
    throw new Error(`Custom element name must contain a hyphen: ${tagName}`);
  }
  if (customElements.get(tagName)) {
    logger.warn("Element already defined", { tagName });
    return false;
  }
  customElements.define(tagName, elementClass, options);
  _registeredElements.set(tagName, elementClass);
  return true;
}
function create(tagName, props = {}, children = []) {
  const element = document.createElement(tagName);
  Object.entries(props).forEach(([key, value]) => {
    if (key.startsWith("on") && typeof value === "function") {
      element.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === "class" || key === "className") {
      element.className = value;
    } else if (key === "style" && typeof value === "object") {
      Object.assign(element.style, value);
    } else if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      element.setAttribute(key, String(value));
    } else if (element.setProp) {
      element.setProp(key, value);
    }
  });
  children.forEach((child) => {
    if (typeof child === "string") {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      element.appendChild(child);
    }
  });
  return element;
}
function functional(tagName, renderFn, options = {}) {
  const { observedAttributes = [], styles = "" } = options;
  class FunctionalElement extends (options.shadow ? ContainerShadowElement : ContainerElement) {
    static get observedAttributes() {
      return observedAttributes;
    }
    render() {
      const root = options.shadow ? this.shadowRoot : this;
      const html = renderFn(this.props, this);
      if (options.shadow && styles && !this._stylesApplied) {
        this.setStyles(styles);
        this._stylesApplied = true;
      }
      if (typeof html === "string") {
        let content = root.querySelector(".fc-content");
        if (!content) {
          content = document.createElement("div");
          content.className = "fc-content";
          root.appendChild(content);
        }
        content.innerHTML = html;
      }
    }
  }
  define(tagName, FunctionalElement);
  return FunctionalElement;
}
function whenDefined(tagName) {
  return customElements.whenDefined(tagName);
}
function isDefined(tagName) {
  return customElements.get(tagName) !== void 0;
}
function getRegistered() {
  return [..._registeredElements.keys()];
}
function upgrade(element) {
  customElements.upgrade(element);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, registeredElements: _registeredElements.size, elements: getRegistered() };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, registeredElements: _registeredElements.size };
}
var custom_elements_default = {
  ContainerElement,
  ContainerShadowElement,
  define,
  create,
  functional,
  whenDefined,
  isDefined,
  getRegistered,
  upgrade,
  info,
  healthCheck,
  VERSION,
  MODULE_ID
};
export {
  ContainerElement,
  ContainerShadowElement,
  MODULE_ID,
  VERSION,
  create,
  custom_elements_default as default,
  define,
  functional,
  getRegistered,
  healthCheck,
  info,
  isDefined,
  upgrade,
  whenDefined
};
