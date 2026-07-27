import { templateConfigs } from "./templates.js";
import { customTemplates } from "./state.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.skeleton-loader.custom";
function listTemplates() {
  const result = Object.keys(templateConfigs).map((name) => ({
    name,
    isBuiltIn: true
  }));
  customTemplates.forEach((cfg, name) => {
    result.push({ name, isBuiltIn: false });
  });
  return result;
}
function registerTemplate(name, cfg) {
  if (templateConfigs[name]) {
    return { ok: false, error: "Cannot override built-in template" };
  }
  customTemplates.set(name, cfg);
  return { ok: true };
}
function unregisterTemplate(name) {
  return customTemplates.delete(name);
}
export {
  MODULE_ID,
  VERSION,
  listTemplates,
  registerTemplate,
  unregisterTemplate
};
