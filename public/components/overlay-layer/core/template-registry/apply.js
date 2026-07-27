import { templates, state } from "./state.js";
import { deepMerge } from "./utils.js";
import { get } from "./crud.js";
import { register } from "./crud.js";
const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.core.template-registry.apply";
function apply(templateId, overrides = {}) {
  const template = templates[templateId];
  if (!template) {
    return { ok: false, error: "template-not-found", templateId };
  }
  const { _builtin, _custom, ...baseTemplate } = template;
  const merged = deepMerge(baseTemplate, overrides);
  merged.meta = {
    ...merged.meta,
    appliedTemplate: templateId,
    appliedAt: Date.now()
  };
  state.totalApplied++;
  return {
    ok: true,
    descriptor: merged,
    templateId,
    templateType: template.type
  };
}
function create(templateId, content, overrides = {}) {
  const result = apply(templateId, { content, ...overrides });
  if (!result.ok) return result;
  return result.descriptor;
}
function clone(sourceId, newId, modifications = {}) {
  const source = get(sourceId);
  if (!source) {
    return { ok: false, error: "source-not-found", sourceId };
  }
  const cloned = deepMerge(source, modifications);
  cloned.meta = {
    ...cloned.meta,
    clonedFrom: sourceId,
    clonedAt: Date.now()
  };
  return register(newId, cloned);
}
export {
  MODULE_ID,
  VERSION,
  apply,
  clone,
  create
};
