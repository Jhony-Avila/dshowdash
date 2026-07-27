import { HOOK_TYPES } from "./constants.js";
import { hooks, isValidHookType } from "./state.js";
const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.core.lifecycle-hooks.queries";
function hasHooks(type) {
  if (!isValidHookType(type)) return false;
  return hooks[type] && hooks[type].length > 0;
}
function countHooks(type) {
  if (type) {
    if (!isValidHookType(type)) return 0;
    return hooks[type]?.length || 0;
  }
  let total = 0;
  for (const t of HOOK_TYPES) {
    total += hooks[t]?.length || 0;
  }
  return total;
}
function listHooks(type) {
  if (type) {
    if (!isValidHookType(type)) return [];
    return hooks[type].map((h) => ({
      id: h.id,
      name: h.name,
      priority: h.priority,
      once: h.once
    }));
  }
  const result = {};
  for (const t of HOOK_TYPES) {
    result[t] = hooks[t].map((h) => ({
      id: h.id,
      name: h.name,
      priority: h.priority,
      once: h.once
    }));
  }
  return result;
}
function getHookTypes() {
  return [...HOOK_TYPES];
}
export {
  MODULE_ID,
  VERSION,
  countHooks,
  getHookTypes,
  hasHooks,
  listHooks
};
