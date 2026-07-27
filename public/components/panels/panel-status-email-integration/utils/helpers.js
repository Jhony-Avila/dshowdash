const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels/panel-status-email-integration/utils/helpers";
const uuid = () => "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
  const r = Math.random() * 16 | 0;
  return (c === "x" ? r : r & 3 | 8).toString(16);
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
const pick = (obj, keys) => keys.reduce((r, k) => {
  if (k in obj) r[k] = obj[k];
  return r;
}, {});
const omit = (obj, keys) => Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));
const deepClone = (obj) => JSON.parse(JSON.stringify(obj));
const isEmpty = (obj) => obj == null || typeof obj === "object" && Object.keys(obj).length === 0;
const isEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const healthCheck = () => ({ status: "healthy", version: VERSION, moduleId: MODULE_ID });
const info = () => ({ version: VERSION, moduleId: MODULE_ID, healthCheck: healthCheck() });
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
