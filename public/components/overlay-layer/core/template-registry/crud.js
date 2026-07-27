import { BUILTIN_TEMPLATES } from "./builtin.js";
import { templates, config, state, refs } from "./state.js";
const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.core.template-registry.crud";
function register(templateId, baseConfig, options = {}) {
  if (!templateId || typeof templateId !== "string") {
    return { ok: false, error: "invalid-template-id" };
  }
  if (!baseConfig || typeof baseConfig !== "object") {
    return { ok: false, error: "invalid-base-config" };
  }
  if (templates[templateId] && !config.allowOverwrite && !options.force) {
    return { ok: false, error: "template-exists", templateId };
  }
  if (config.validateOnRegister && refs.schemaValidator?.validate) {
    const validation = refs.schemaValidator.validate(baseConfig);
    if (!validation.valid) {
      return {
        ok: false,
        error: "validation-failed",
        errors: validation.errors
      };
    }
  }
  const isOverwritingBuiltin = templates[templateId]?._builtin;
  templates[templateId] = {
    ...baseConfig,
    meta: {
      ...baseConfig.meta,
      templateId,
      registeredAt: Date.now(),
      overwrittenBuiltin: isOverwritingBuiltin
    },
    _builtin: false,
    _custom: true
  };
  state.totalRegistered++;
  return {
    ok: true,
    templateId,
    overwritten: isOverwritingBuiltin
  };
}
function unregister(templateId) {
  if (!templates[templateId]) {
    return { ok: false, error: "template-not-found" };
  }
  if (templates[templateId]._builtin) {
    return { ok: false, error: "cannot-remove-builtin" };
  }
  delete templates[templateId];
  state.totalRemoved++;
  if (BUILTIN_TEMPLATES[templateId]) {
    templates[templateId] = { ...BUILTIN_TEMPLATES[templateId], _builtin: true };
  }
  return { ok: true, templateId };
}
function get(templateId) {
  const template = templates[templateId];
  if (!template) return null;
  const { _builtin, _custom, ...rest } = template;
  return { ...rest };
}
function has(templateId) {
  return !!templates[templateId];
}
export {
  MODULE_ID,
  VERSION,
  get,
  has,
  register,
  unregister
};
