const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels/panel-integration-alfinete/utils/helpers";
function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === "x" ? r : r & 3 | 8).toString(16);
  });
}
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}
function pick(obj, keys) {
  return keys.reduce((r, k) => {
    if (k in obj) r[k] = obj[k];
    return r;
  }, {});
}
function omit(obj, keys) {
  return Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));
}
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
function isEmpty(obj) {
  return obj == null || typeof obj === "object" && Object.keys(obj).length === 0;
}
function isEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}
function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function healthCheck() {
  return { status: "healthy", version: VERSION, moduleId: MODULE_ID };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, healthCheck: healthCheck() };
}
var helpers_default = { uuid, sleep, clamp, pick, omit, deepClone, isEmpty, isEqual, capitalize, slugify, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  capitalize,
  clamp,
  deepClone,
  helpers_default as default,
  healthCheck,
  info,
  isEmpty,
  isEqual,
  omit,
  pick,
  sleep,
  slugify,
  uuid
};
