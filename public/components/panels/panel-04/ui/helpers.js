const MODULE_ID = "panel-04-ui-helpers";
const VERSION = "9.3.0-P2-ENTERPRISE";
function $(selector, context = document) {
  return context.querySelector(selector);
}
function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}
function createElement(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const key in attrs) {
    if (Object.prototype.hasOwnProperty.call(attrs, key)) {
      if (key === "className") el.className = attrs[key];
      else if (key === "innerHTML") el.innerHTML = attrs[key];
      else if (key === "textContent") el.textContent = attrs[key];
      else if (key.startsWith("data-")) el.setAttribute(key, attrs[key]);
      else if (key.startsWith("on") && typeof attrs[key] === "function") {
        el.addEventListener(key.substring(2).toLowerCase(), attrs[key]);
      } else el.setAttribute(key, attrs[key]);
    }
  }
  for (const child of children) {
    if (typeof child === "string") el.appendChild(document.createTextNode(child));
    else if (child instanceof Node) el.appendChild(child);
  }
  return el;
}
function removeElement(el) {
  if (el?.parentNode) el.parentNode.removeChild(el);
}
function clearElement(el) {
  if (el) el.innerHTML = "";
}
function toggleClass(el, className, force) {
  if (!el) return;
  if (typeof force === "boolean") el.classList.toggle(className, force);
  else el.classList.toggle(className);
}
function hasClass(el, className) {
  return el?.classList?.contains(className) || false;
}
function addClass(el, ...classNames) {
  if (el?.classList) el.classList.add(...classNames);
}
function removeClass(el, ...classNames) {
  if (el?.classList) el.classList.remove(...classNames);
}
function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
function truncate(str, maxLen = 50, suffix = "...") {
  if (!str || str.length <= maxLen) return str || "";
  return str.substring(0, maxLen - suffix.length) + suffix;
}
function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
function camelToKebab(str) {
  if (!str) return "";
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}
function kebabToCamel(str) {
  if (!str) return "";
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}
function slugify(str) {
  if (!str) return "";
  return str.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
function formatNumber(num, locale = "pt-BR") {
  if (typeof num !== "number" || isNaN(num)) return "0";
  return num.toLocaleString(locale);
}
function formatCurrency(num, currency = "BRL", locale = "pt-BR") {
  if (typeof num !== "number" || isNaN(num)) return "R$ 0,00";
  return num.toLocaleString(locale, { style: "currency", currency });
}
function formatPercent(num, decimals = 1) {
  if (typeof num !== "number" || isNaN(num)) return "0%";
  return `${num.toFixed(decimals)}%`;
}
function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max);
}
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function formatDate(date, locale = "pt-BR") {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(locale);
}
function formatDateTime(date, locale = "pt-BR") {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString(locale);
}
function formatTime(date, locale = "pt-BR") {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
}
function timeAgo(date, locale = "pt-BR") {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  const now = /* @__PURE__ */ new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1e3);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  if (diffSec < 60) return "agora";
  if (diffMin < 60) return `${diffMin}min atr\xE1s`;
  if (diffHour < 24) return `${diffHour}h atr\xE1s`;
  if (diffDay < 7) return `${diffDay}d atr\xE1s`;
  return formatDate(d, locale);
}
function deepClone(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map((item) => deepClone(item));
  const clone = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clone[key] = deepClone(obj[key]);
    }
  }
  return clone;
}
function deepMerge(target, source) {
  if (!source) return target;
  const output = { ...target };
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
        output[key] = deepMerge(output[key] || {}, source[key]);
      } else {
        output[key] = source[key];
      }
    }
  }
  return output;
}
function pick(obj, keys) {
  if (!obj) return {};
  const result = {};
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = obj[key];
    }
  }
  return result;
}
function omit(obj, keys) {
  if (!obj) return {};
  const keysSet = new Set(keys);
  const result = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && !keysSet.has(key)) {
      result[key] = obj[key];
    }
  }
  return result;
}
function debounce(fn, delay = 300) {
  let timeoutId = null;
  return (...args) => {
    clearTimeout(timeoutId ?? void 0);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
function throttle(fn, limit = 300) {
  let inThrottle = false;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
let _idCounter = 0;
function uniqueId(prefix = "p04") {
  _idCounter += 1;
  return `${prefix}_${Date.now()}_${_idCounter}`;
}
function isEmpty(val) {
  if (val === null || val === void 0) return true;
  if (typeof val === "string") return val.trim() === "";
  if (Array.isArray(val)) return val.length === 0;
  if (typeof val === "object") return Object.keys(val).length === 0;
  return false;
}
function isNumeric(val) {
  return !isNaN(parseFloat(val)) && isFinite(val);
}
function isValidEmail(email) {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, idCounter: _idCounter };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { domReady: typeof document !== "undefined" } };
}
const truncateText = truncate;
function getAlertConfig(type) {
  const ALERT_TYPES = {
    "alert-critical": { label: "Cr\xEDtico", color: "#dc2626", bg: "rgba(220,38,38,0.15)", icon: '<svg width="12" height="12" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#dc2626"/></svg>', order: 0 },
    "alert-high": { label: "Alto", color: "#ef4444", bg: "rgba(239,68,68,0.15)", icon: '<svg width="12" height="12" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#ef4444"/></svg>', order: 1 },
    "alert-medium": { label: "M\xE9dio", color: "#f59e0b", bg: "rgba(245,158,11,0.15)", icon: '<svg width="12" height="12" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#f59e0b"/></svg>', order: 2 },
    "alert-low": { label: "Baixo", color: "#22c55e", bg: "rgba(34,197,94,0.15)", icon: '<svg width="12" height="12" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#22c55e"/></svg>', order: 3 }
  };
  return ALERT_TYPES[type] || { label: type || "Info", color: "#6366f1", bg: "rgba(99,102,241,0.15)", icon: '<svg width="12" height="12" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#6366f1"/></svg>', order: 99 };
}
function isRecent(date, minutes = 5) {
  if (!date) return false;
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return false;
  return Date.now() - d.getTime() < minutes * 60 * 1e3;
}
function downloadFile(content, filename, mimeType = "text/plain") {
  try {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}
function hashData(data) {
  try {
    const str = JSON.stringify(data);
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(31, h) + str.charCodeAt(i) | 0;
    }
    return String(h >>> 0);
  } catch {
    return String(Date.now());
  }
}
var helpers_default = {
  MODULE_ID,
  VERSION,
  $,
  $$,
  createElement,
  removeElement,
  clearElement,
  toggleClass,
  hasClass,
  addClass,
  removeClass,
  escapeHtml,
  truncate,
  capitalize,
  camelToKebab,
  kebabToCamel,
  slugify,
  formatNumber,
  formatCurrency,
  formatPercent,
  clamp,
  randomInt,
  formatDate,
  formatDateTime,
  formatTime,
  timeAgo,
  deepClone,
  deepMerge,
  pick,
  omit,
  debounce,
  throttle,
  uniqueId,
  isEmpty,
  isNumeric,
  isValidEmail,
  info,
  healthCheck
};
export {
  $,
  $$,
  MODULE_ID,
  VERSION,
  addClass,
  camelToKebab,
  capitalize,
  clamp,
  clearElement,
  createElement,
  debounce,
  deepClone,
  deepMerge,
  helpers_default as default,
  downloadFile,
  escapeHtml,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercent,
  formatTime,
  getAlertConfig,
  hasClass,
  hashData,
  healthCheck,
  info,
  isEmpty,
  isNumeric,
  isRecent,
  isValidEmail,
  kebabToCamel,
  omit,
  pick,
  randomInt,
  removeClass,
  removeElement,
  slugify,
  throttle,
  timeAgo,
  toggleClass,
  truncate,
  truncateText,
  uniqueId
};
