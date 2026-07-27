const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.core.template-registry.utils";
function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      if (target[key] && typeof target[key] === "object") {
        result[key] = deepMerge(target[key], source[key]);
      } else {
        result[key] = { ...source[key] };
      }
    } else if (source[key] !== void 0) {
      result[key] = source[key];
    }
  }
  return result;
}
export {
  MODULE_ID,
  VERSION,
  deepMerge
};
