const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-cards/utils/helpers";
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
function deepClone(obj) {
  if (!obj) return obj;
  return JSON.parse(JSON.stringify(obj));
}
function isEmpty(obj) {
  if (!obj) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === "object") return Object.keys(obj).length === 0;
  return false;
}
function pick(obj, keys) {
  if (!obj) return {};
  return keys.reduce((a, k) => {
    if (k in obj) a[k] = obj[k];
    return a;
  }, {});
}
function omit(obj, keys) {
  if (!obj) return {};
  return Object.keys(obj).reduce((a, k) => {
    if (!keys.includes(k)) a[k] = obj[k];
    return a;
  }, {});
}
function groupBy(arr, key) {
  if (!arr) return {};
  return arr.reduce((a, i) => {
    const k = typeof key === "function" ? key(i) : String(i[key]);
    (a[k] = a[k] || []).push(i);
    return a;
  }, {});
}
function sortBy(arr, key, order = "asc") {
  if (!arr) return [];
  return [...arr].sort((a, b) => {
    const av = typeof key === "function" ? key(a) : a[key];
    const bv = typeof key === "function" ? key(b) : b[key];
    return order === "asc" ? av < bv ? -1 : 1 : av > bv ? -1 : 1;
  });
}
function getCardById(cards, id) {
  return cards.find((c) => c.id === id) || null;
}
function filterActiveCards(cards) {
  return cards.filter((c) => c.active !== false);
}
function sortCardsByOrder(cards) {
  return sortBy(cards, "order", "asc");
}
function getCardsByType(cards, type) {
  return cards.filter((c) => c.type === type);
}
function calculateGridLayout(count, maxColumns = 4) {
  if (count <= 2) return { columns: count, rows: 1 };
  if (count <= 4) return { columns: 2, rows: Math.ceil(count / 2) };
  if (count <= 9) return { columns: 3, rows: Math.ceil(count / 3) };
  return { columns: maxColumns, rows: Math.ceil(count / maxColumns) };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var helpers_default = { generateId, sleep, deepClone, isEmpty, pick, omit, groupBy, sortBy, getCardById, filterActiveCards, sortCardsByOrder, getCardsByType, calculateGridLayout };
export {
  MODULE_ID,
  VERSION,
  calculateGridLayout,
  deepClone,
  helpers_default as default,
  filterActiveCards,
  generateId,
  getCardById,
  getCardsByType,
  groupBy,
  healthCheck,
  info,
  isEmpty,
  omit,
  pick,
  sleep,
  sortBy,
  sortCardsByOrder
};
