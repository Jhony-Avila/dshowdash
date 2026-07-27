const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/utils/helpers";
function groupBy(array, key) {
  return array.reduce((groups, item) => {
    const value = typeof key === "function" ? key(item) : item[key];
    const groupKey = String(value);
    (groups[groupKey] = groups[groupKey] || []).push(item);
    return groups;
  }, {});
}
function sortBy(array, key, order = "ASC") {
  const sorted = [...array].sort((a, b) => {
    const aVal = typeof key === "function" ? key(a) : a[key];
    const bVal = typeof key === "function" ? key(b) : b[key];
    if (aVal === null || aVal === void 0) return 1;
    if (bVal === null || bVal === void 0) return -1;
    if (typeof aVal === "string") {
      return aVal.localeCompare(bVal, "pt-BR", { numeric: true });
    }
    return aVal - bVal;
  });
  return order === "DESC" ? sorted.reverse() : sorted;
}
function filterBy(array, filters) {
  return array.filter((item) => Object.entries(filters).every(([key, value]) => {
    if (!value) return true;
    const itemValue = item[key];
    if (typeof value === "string") {
      return String(itemValue).toLowerCase().includes(value.toLowerCase());
    }
    return itemValue === value;
  }));
}
function paginate(array, page, limit) {
  const start = (page - 1) * limit;
  const end = start + limit;
  return {
    data: array.slice(start, end),
    pagination: {
      page,
      limit,
      total: array.length,
      totalPages: Math.ceil(array.length / limit)
    }
  };
}
function uniqueBy(array, key) {
  const seen = /* @__PURE__ */ new Set();
  return array.filter((item) => {
    const value = typeof key === "function" ? key(item) : item[key];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}
function sum(array, key) {
  return array.reduce((total, item) => {
    const value = typeof key === "function" ? key(item) : key ? item[key] : item;
    return total + (parseFloat(String(value)) || 0);
  }, 0);
}
function average(array, key) {
  if (!array.length) return 0;
  return sum(array, key) / array.length;
}
function pick(obj, keys) {
  return keys.reduce((result, key) => {
    if (key in obj) result[key] = obj[key];
    return result;
  }, {});
}
function omit(obj, keys) {
  const keysSet = new Set(keys);
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !keysSet.has(key))
  );
}
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
function isEmpty(obj) {
  if (!obj) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === "object") return Object.keys(obj).length === 0;
  return false;
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function retry(fn, retries = 3, delay = 1e3) {
  return new Promise((resolve, reject) => {
    const attempt = async (remaining) => {
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        if (remaining <= 0) {
          reject(error);
        } else {
          await sleep(delay);
          attempt(remaining - 1);
        }
      }
    };
    attempt(retries);
  });
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var helpers_default = { groupBy, sortBy, filterBy, paginate, uniqueBy, sum, average, pick, omit, deepClone, isEmpty, sleep, retry };
export {
  MODULE_ID,
  VERSION,
  average,
  deepClone,
  helpers_default as default,
  filterBy,
  groupBy,
  healthCheck,
  info,
  isEmpty,
  omit,
  paginate,
  pick,
  retry,
  sleep,
  sortBy,
  sum,
  uniqueBy
};
