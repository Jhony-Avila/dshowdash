const VERSION = "6.2.0-ENTERPRISE";
const MODULE_ID = "footer-utils-dom";
const _metrics = { queries: 0, creates: 0 };
function $(selector, context) {
  context = context || document;
  _metrics.queries++;
  return context.querySelector(selector);
}
function $$(selector, context) {
  context = context || document;
  _metrics.queries++;
  return Array.from(context.querySelectorAll(selector));
}
function createElement(tag, attrs, children) {
  attrs = attrs || {};
  children = children || [];
  _metrics.creates++;
  const el = document.createElement(tag);
  Object.keys(attrs).forEach((key) => {
    const value = attrs[key];
    if (key === "className") {
      el.className = value;
    } else if (key === "dataset") {
      Object.keys(value).forEach((dataKey) => {
        el.dataset[dataKey] = value[dataKey];
      });
    } else if (key.indexOf("on") === 0 && typeof value === "function") {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      el.setAttribute(key, value);
    }
  });
  children.forEach((child) => {
    if (typeof child === "string") {
      el.appendChild(document.createTextNode(child));
    } else if (child instanceof HTMLElement) {
      el.appendChild(child);
    }
  });
  return el;
}
function addClass(el) {
  if (el) el.classList.add(...Array.prototype.slice.call(arguments, 1));
}
function removeClass(el) {
  if (el) el.classList.remove(...Array.prototype.slice.call(arguments, 1));
}
function toggleClass(el, className, force) {
  if (el) el.classList.toggle(className, force);
}
function hasClass(el, className) {
  return el ? el.classList.contains(className) : false;
}
function setAttr(el, name, value) {
  if (el) el.setAttribute(name, value);
}
function getAttr(el, name) {
  return el ? el.getAttribute(name) : null;
}
function removeElement(el) {
  if (el) el.remove();
}
function getMetrics() {
  return { queries: _metrics.queries, creates: _metrics.creates };
}
function getVersion() {
  return VERSION;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics() };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { domReady: typeof document !== "undefined" }, metrics: getMetrics() };
}
var dom_default = { $, $$, createElement, addClass, removeClass, toggleClass, hasClass, setAttr, getAttr, removeElement, getMetrics, getVersion, info, healthCheck, VERSION, MODULE_ID };
export {
  $,
  $$,
  MODULE_ID,
  VERSION,
  addClass,
  createElement,
  dom_default as default,
  getAttr,
  getMetrics,
  getVersion,
  hasClass,
  healthCheck,
  info,
  removeClass,
  removeElement,
  setAttr,
  toggleClass
};
