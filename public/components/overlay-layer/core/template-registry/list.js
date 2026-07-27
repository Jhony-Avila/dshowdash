import { templates } from "./state.js";
const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.core.template-registry.list";
function list() {
  return Object.keys(templates).map((id) => ({
    id,
    type: templates[id].type,
    builtin: !!templates[id]._builtin,
    custom: !!templates[id]._custom
  }));
}
function listCustom() {
  return list().filter((t) => t.custom);
}
function listBuiltin() {
  return list().filter((t) => t.builtin);
}
export {
  MODULE_ID,
  VERSION,
  list,
  listBuiltin,
  listCustom
};
