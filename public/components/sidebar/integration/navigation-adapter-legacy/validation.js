const VERSION = "7.4.0-P2-ENTERPRISE";
const MODULE_ID = "sidebar.integration.navigation-adapter-legacy.validation";
function validateAdaptedModel(model) {
  const errors = [];
  const warnings = [];
  if (!model) {
    return { valid: false, errors: ["Model is null"], warnings: [] };
  }
  if (!model.schema_id) {
    errors.push("Missing schema_id");
  }
  if (!model.sections || !Array.isArray(model.sections)) {
    errors.push("Missing or invalid sections array");
  } else {
    model.sections.forEach((section, idx) => {
      if (!section.id) {
        errors.push(`Section ${idx} missing id`);
      }
      if (!section.label) {
        warnings.push(`Section ${section.id} missing label`);
      }
      if (!section.uarps?.trigger_id) {
        warnings.push(`Section ${section.id} missing uarps.trigger_id`);
      }
      (section.items || []).forEach((item, itemIdx) => {
        if (!item.id) {
          errors.push(`Item ${itemIdx} in section ${section.id} missing id`);
        }
        if (!item.uarps?.trigger_id) {
          warnings.push(`Item ${item.id} missing uarps.trigger_id`);
        }
      });
    });
  }
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
var validation_default = { validateAdaptedModel };
export {
  MODULE_ID,
  VERSION,
  validation_default as default,
  validateAdaptedModel
};
