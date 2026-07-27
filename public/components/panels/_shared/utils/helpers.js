const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels/_shared/utils/helpers";
function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}
function throttle(fn, ms = 300) {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= ms) {
      lastCall = now;
      return fn.apply(this, args);
    }
  };
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function retry(fn, maxRetries = 3, delay = 1e3, backoff = 2) {
  return async (...args) => {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error;
        if (i < maxRetries - 1) await sleep(delay * Math.pow(backoff, i));
      }
    }
    throw lastError;
  };
}
function timeout(promise, ms, message = "Timeout") {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms))
  ]);
}
function generateId(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
function deepClone(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(deepClone);
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, deepClone(v)]));
}
function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}
function isEmpty(value) {
  if (value === null || value === void 0) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}
function formatDate(date, format = "YYYY-MM-DD") {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return format.replace("YYYY", d.getFullYear()).replace("MM", pad(d.getMonth() + 1)).replace("DD", pad(d.getDate())).replace("HH", pad(d.getHours())).replace("mm", pad(d.getMinutes())).replace("ss", pad(d.getSeconds()));
}
function formatNumber(num, decimals = 2) {
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(num);
}
function formatCurrency(value, currency = "BRL") {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(value);
}
var helpers_default = { debounce, throttle, sleep, retry, timeout, generateId, deepClone, deepMerge, isEmpty, formatDate, formatNumber, formatCurrency, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  debounce,
  deepClone,
  deepMerge,
  helpers_default as default,
  formatCurrency,
  formatDate,
  formatNumber,
  generateId,
  isEmpty,
  retry,
  sleep,
  throttle,
  timeout
};
