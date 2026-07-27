import { BUILTIN_TEMPLATES } from "./builtin.js";
import { templates, initBuiltinTemplates } from "./state.js";
const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.core.template-registry.restore";
function restoreBuiltin(templateId) {
  if (!BUILTIN_TEMPLATES[templateId]) {
    return { ok: false, error: "not-a-builtin", templateId };
  }
  templates[templateId] = { ...BUILTIN_TEMPLATES[templateId], _builtin: true };
  return { ok: true, templateId, restored: true };
}
function restoreAllBuiltins() {
  const restored = [];
  for (const [id, template] of Object.entries(BUILTIN_TEMPLATES)) {
    templates[id] = { ...template, _builtin: true };
    restored.push(id);
  }
  return { ok: true, restored };
}
function clearCustom() {
  const removed = [];
  for (const [id, template] of Object.entries(templates)) {
    if (template._custom) {
      delete templates[id];
      removed.push(id);
    }
  }
  initBuiltinTemplates();
  return { ok: true, removed };
}
export {
  MODULE_ID,
  VERSION,
  clearCustom,
  restoreAllBuiltins,
  restoreBuiltin
};
