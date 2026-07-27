const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-16/utils/helpers";
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
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
  return keys.reduce((acc, key) => {
    if (key in obj) acc[key] = obj[key];
    return acc;
  }, {});
}
function omit(obj, keys) {
  if (!obj) return {};
  return Object.keys(obj).reduce((acc, key) => {
    if (!keys.includes(key)) acc[key] = obj[key];
    return acc;
  }, {});
}
function groupBy(arr, key) {
  if (!arr || !Array.isArray(arr)) return {};
  return arr.reduce((acc, item) => {
    const k = typeof key === "function" ? key(item) : item[key];
    (acc[k] = acc[k] || []).push(item);
    return acc;
  }, {});
}
function sortBy(arr, key, order = "asc") {
  if (!arr || !Array.isArray(arr)) return [];
  return [...arr].sort((a, b) => {
    const aVal = typeof key === "function" ? key(a) : a[key];
    const bVal = typeof key === "function" ? key(b) : b[key];
    if (aVal < bVal) return order === "asc" ? -1 : 1;
    if (aVal > bVal) return order === "asc" ? 1 : -1;
    return 0;
  });
}
function filterBy(arr, filters) {
  if (!arr || !Array.isArray(arr)) return [];
  return arr.filter((item) => Object.entries(filters).every(([key, value]) => {
    if (value === null || value === void 0 || value === "") return true;
    const itemVal = String(item[key] || "").toLowerCase();
    return itemVal.includes(String(value).toLowerCase());
  }));
}
function paginate(arr, page = 1, limit = 30) {
  if (!arr || !Array.isArray(arr)) return { data: [], total: 0, page, limit, pages: 0 };
  const total = arr.length;
  const pages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const data = arr.slice(start, start + limit);
  return { data, total, page, limit, pages };
}
function calcularRisco(fornecedor) {
  let score = 100;
  if (!fornecedor.cnpj) score -= 20;
  if (!fornecedor.email) score -= 10;
  if (!fornecedor.telefone) score -= 10;
  if (fornecedor.pendencias > 0) score -= fornecedor.pendencias * 5;
  if (fornecedor.dias_sem_pedido > 90) score -= 15;
  if (fornecedor.dias_sem_pedido > 180) score -= 15;
  score = clamp(score, 0, 100);
  let nivel = "baixo";
  if (score < 40) nivel = "critico";
  else if (score < 60) nivel = "alto";
  else if (score < 80) nivel = "medio";
  return { score, nivel };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var helpers_default = { generateId, sleep, clamp, deepClone, isEmpty, pick, omit, groupBy, sortBy, filterBy, paginate, calcularRisco };
export {
  MODULE_ID,
  VERSION,
  calcularRisco,
  clamp,
  deepClone,
  helpers_default as default,
  filterBy,
  generateId,
  groupBy,
  healthCheck,
  info,
  isEmpty,
  omit,
  paginate,
  pick,
  sleep,
  sortBy
};
