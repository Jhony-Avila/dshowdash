import { loaders } from "../state.js";
const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.core.lazy-loader.loaders.registry";
function registerLoader(typeOrPattern, loader) {
  if (!typeOrPattern) {
    return { ok: false, error: "invalid-type" };
  }
  if (typeof loader !== "function") {
    return { ok: false, error: "loader-must-be-function" };
  }
  loaders.set(typeOrPattern, {
    loader,
    pattern: typeOrPattern instanceof RegExp ? typeOrPattern : null
  });
  return { ok: true, type: typeOrPattern.toString() };
}
function unregisterLoader(typeOrPattern) {
  const deleted = loaders.delete(typeOrPattern);
  return { ok: deleted };
}
function findLoader(type) {
  if (loaders.has(type)) {
    return loaders.get(type).loader;
  }
  for (const [key, value] of loaders) {
    if (value.pattern && value.pattern.test(type)) {
      return value.loader;
    }
  }
  return null;
}
function getRegisteredLoaders() {
  const result = [];
  for (const [key, value] of loaders) {
    result.push({
      type: key.toString(),
      isPattern: !!value.pattern
    });
  }
  return result;
}
export {
  MODULE_ID,
  VERSION,
  findLoader,
  getRegisteredLoaders,
  registerLoader,
  unregisterLoader
};
