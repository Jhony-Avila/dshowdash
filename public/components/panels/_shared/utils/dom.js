const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels/_shared/utils/dom";
function $(selector, context = document) {
  return context.querySelector(selector);
}
function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}
function createElement(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === "className") el.className = value;
    else if (key === "dataset") Object.assign(el.dataset, value);
    else if (key.startsWith("on") && typeof value === "function") {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else el.setAttribute(key, value);
  });
  children.forEach((child) => {
    if (typeof child === "string") el.appendChild(document.createTextNode(child));
    else if (child instanceof Node) el.appendChild(child);
  });
  return el;
}
function removeElement(el) {
  if (el && el.parentNode) el.parentNode.removeChild(el);
}
function clearElement(el) {
  if (el) el.innerHTML = "";
}
function addClass(el, ...classes) {
  if (el) el.classList.add(...classes);
}
function removeClass(el, ...classes) {
  if (el) el.classList.remove(...classes);
}
function toggleClass(el, className, force) {
  if (el) return el.classList.toggle(className, force);
  return false;
}
function hasClass(el, className) {
  return el?.classList?.contains(className) || false;
}
function setAttributes(el, attrs) {
  if (!el) return;
  Object.entries(attrs).forEach(([key, value]) => {
    if (value === null || value === void 0) el.removeAttribute(key);
    else el.setAttribute(key, value);
  });
}
function getData(el, key) {
  return el?.dataset?.[key];
}
function setData(el, key, value) {
  if (el?.dataset) el.dataset[key] = value;
}
function isVisible(el) {
  if (!el) return false;
  const style = window.getComputedStyle(el);
  return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
}
function waitForElement(selector, timeout = 5e3) {
  return new Promise((resolve, reject) => {
    const el = document.querySelector(selector);
    if (el) return resolve(el);
    const observer = new MutationObserver(() => {
      const el2 = document.querySelector(selector);
      if (el2) {
        observer.disconnect();
        resolve(el2);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found`));
    }, timeout);
  });
}
var dom_default = { $, $$, createElement, removeElement, clearElement, addClass, removeClass, toggleClass, hasClass, setAttributes, getData, setData, isVisible, waitForElement, VERSION, MODULE_ID };
export {
  $,
  $$,
  MODULE_ID,
  VERSION,
  addClass,
  clearElement,
  createElement,
  dom_default as default,
  getData,
  hasClass,
  isVisible,
  removeClass,
  removeElement,
  setAttributes,
  setData,
  toggleClass,
  waitForElement
};
