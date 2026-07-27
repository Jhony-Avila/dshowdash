function getVal(item, key) {
  if (typeof key === "function") return key(item);
  return item[key];
}
function groupBy(array, key) {
  if (!Array.isArray(array)) return {};
  return array.reduce((groups, item) => {
    const value = String(getVal(item, key));
    (groups[value] = groups[value] || []).push(item);
    return groups;
  }, {});
}
function sortBy(array, key, direction = "asc") {
  if (!Array.isArray(array)) return [];
  const sorted = [...array].sort((a, b) => {
    const aVal = getVal(a, key);
    const bVal = getVal(b, key);
    if (aVal < bVal) return -1;
    if (aVal > bVal) return 1;
    return 0;
  });
  return direction === "desc" ? sorted.reverse() : sorted;
}
function sumBy(array, key) {
  if (!Array.isArray(array)) return 0;
  return array.reduce((sum, item) => {
    const val = getVal(item, key);
    return sum + (Number(val) || 0);
  }, 0);
}
function avgBy(array, key) {
  if (!Array.isArray(array) || !array.length) return 0;
  return sumBy(array, key) / array.length;
}
function minBy(array, key) {
  if (!Array.isArray(array) || !array.length) return null;
  return array.reduce((min, item) => {
    const val = getVal(item, key);
    const minVal = getVal(min, key);
    return val < minVal ? item : min;
  });
}
function maxBy(array, key) {
  if (!Array.isArray(array) || !array.length) return null;
  return array.reduce((max, item) => {
    const val = getVal(item, key);
    const maxVal = getVal(max, key);
    return val > maxVal ? item : max;
  });
}
function unique(array, key = null) {
  if (!Array.isArray(array)) return [];
  if (!key) return [...new Set(array)];
  const seen = /* @__PURE__ */ new Set();
  return array.filter((item) => {
    const val = getVal(item, key);
    if (seen.has(val)) return false;
    seen.add(val);
    return true;
  });
}
var data_utils_default = { groupBy, sortBy, sumBy, avgBy, minBy, maxBy, unique };
const MODULE_ID = "panel-05:utils:data-utils";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { dataUtilsReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  avgBy,
  data_utils_default as default,
  groupBy,
  healthCheck,
  info,
  maxBy,
  minBy,
  sortBy,
  sumBy,
  unique
};
