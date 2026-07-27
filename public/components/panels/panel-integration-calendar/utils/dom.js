const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels/panel-integration-calendar/utils/dom";
const qs = (selector, context = document) => context.querySelector(selector);
const qsa = (selector, context = document) => Array.from(context.querySelectorAll(selector));
const create = (tag, attrs = {}, children = []) => {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === "className") el.className = v;
    else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
    else if (k.startsWith("on")) el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v);
  });
  children.forEach((child) => {
    if (typeof child === "string") el.appendChild(document.createTextNode(child));
    else if (child) el.appendChild(child);
  });
  return el;
};
const remove = (el) => el?.parentNode?.removeChild(el);
const empty = (el) => {
  if (el) el.innerHTML = "";
};
const show = (el) => {
  if (el) el.style.display = "";
};
const hide = (el) => {
  if (el) el.style.display = "none";
};
const toggle = (el, visible) => {
  if (el) el.style.display = visible ? "" : "none";
};
const healthCheck = () => ({ status: "healthy", version: VERSION, moduleId: MODULE_ID });
const info = () => ({ version: VERSION, moduleId: MODULE_ID, healthCheck: healthCheck() });
var dom_default = { qs, qsa, create, remove, empty, show, hide, toggle, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  create,
  dom_default as default,
  empty,
  healthCheck,
  hide,
  info,
  qs,
  qsa,
  remove,
  show,
  toggle
};
