import { DEFAULT_CONFIG } from "./constants.js";
import { BUILTIN_TEMPLATES } from "./builtin.js";
const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.core.template-registry.state";
const templates = {};
const config = { ...DEFAULT_CONFIG };
const state = {
  totalRegistered: 0,
  totalApplied: 0,
  totalRemoved: 0
};
const refs = {
  schemaValidator: null
};
function inject(dependencies) {
  if (dependencies.schemaValidator) refs.schemaValidator = dependencies.schemaValidator;
}
function initBuiltinTemplates() {
  for (const [id, template] of Object.entries(BUILTIN_TEMPLATES)) {
    if (!templates[id]) {
      templates[id] = { ...template, _builtin: true };
    }
  }
}
initBuiltinTemplates();
export {
  MODULE_ID,
  VERSION,
  config,
  initBuiltinTemplates,
  inject,
  refs,
  state,
  templates
};
