import { VERSION } from "/core/version.js";
const MODULE_ID = "header/components/panel-asaas/utils/dom";
function $(selector, context = document) {
  return context.querySelector(selector);
}
function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}
function createElement(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === "className") el.className = v;
    else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
    else el.setAttribute(k, v);
  });
  children.forEach((child) => {
    if (typeof child === "string") el.appendChild(document.createTextNode(child));
    else if (child) el.appendChild(child);
  });
  return el;
}
function removeElement(el) {
  if (el && el.parentNode) el.parentNode.removeChild(el);
}
function emptyElement(el) {
  if (el) while (el.firstChild) el.removeChild(el.firstChild);
}
function addClass(el, ...classes) {
  if (el) el.classList.add(...classes);
}
function removeClass(el, ...classes) {
  if (el) el.classList.remove(...classes);
}
function toggleClass(el, className, force) {
  if (el) return el.classList.toggle(className, force);
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
function removeAttr(el, name) {
  if (el) el.removeAttribute(name);
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { domReady: typeof document !== "undefined" } };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID };
}
var dom_default = { $, $$, createElement, removeElement, emptyElement, addClass, removeClass, toggleClass, hasClass, setAttr, getAttr, removeAttr };
export {
  $,
  $$,
  MODULE_ID,
  VERSION,
  addClass,
  createElement,
  dom_default as default,
  emptyElement,
  getAttr,
  hasClass,
  healthCheck,
  info,
  removeAttr,
  removeClass,
  removeElement,
  setAttr,
  toggleClass
};
