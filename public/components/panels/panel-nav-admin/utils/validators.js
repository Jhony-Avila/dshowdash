const MODULE_ID = "panel-nav-admin:validators";
const VERSION = "9.4.0-P18EC-ENTERPRISE";
const VALIDATION_RULES = {
  itemKey: { minLength: 2, maxLength: 50, pattern: /^[a-z0-9\-_]+$/i },
  label: { minLength: 1, maxLength: 100 },
  iconName: { maxLength: 50, pattern: /^[a-z0-9\-_]*$/i },
  routePath: { maxLength: 200 },
  panelId: { maxLength: 50, pattern: /^[a-z0-9\-_]*$/i },
  order: { min: 0, max: 9999 },
  sectionKey: { minLength: 2, maxLength: 50, pattern: /^[a-z0-9\-_]+$/i },
  sectionLabel: { minLength: 1, maxLength: 100 }
};
function validateItemKey(key) {
  var errors = [];
  if (!key) {
    errors.push("ID/Key \xE9 obrigat\xF3rio");
    return errors;
  }
  if (key.length < VALIDATION_RULES.itemKey.minLength) {
    errors.push("ID/Key deve ter pelo menos " + VALIDATION_RULES.itemKey.minLength + " caracteres");
  }
  if (key.length > VALIDATION_RULES.itemKey.maxLength) {
    errors.push("ID/Key deve ter no m\xE1ximo " + VALIDATION_RULES.itemKey.maxLength + " caracteres");
  }
  if (!VALIDATION_RULES.itemKey.pattern.test(key)) {
    errors.push("ID/Key deve conter apenas letras, n\xFAmeros, h\xEDfen e underscore");
  }
  return errors;
}
function validateLabel(label) {
  var errors = [];
  if (!label) {
    errors.push("Label \xE9 obrigat\xF3rio");
    return errors;
  }
  if (label.length < VALIDATION_RULES.label.minLength) {
    errors.push("Label deve ter pelo menos " + VALIDATION_RULES.label.minLength + " caractere");
  }
  if (label.length > VALIDATION_RULES.label.maxLength) {
    errors.push("Label deve ter no m\xE1ximo " + VALIDATION_RULES.label.maxLength + " caracteres");
  }
  return errors;
}
function validateIconName(icon) {
  var errors = [];
  if (!icon) return errors;
  if (icon.length > VALIDATION_RULES.iconName.maxLength) {
    errors.push("\xCDcone deve ter no m\xE1ximo " + VALIDATION_RULES.iconName.maxLength + " caracteres");
  }
  if (!VALIDATION_RULES.iconName.pattern.test(icon)) {
    errors.push("\xCDcone deve conter apenas letras, n\xFAmeros, h\xEDfen e underscore");
  }
  return errors;
}
function validateOrder(order) {
  var errors = [];
  var num = parseInt(String(order)) || 0;
  if (num < VALIDATION_RULES.order.min) {
    errors.push("Ordem deve ser pelo menos " + VALIDATION_RULES.order.min);
  }
  if (num > VALIDATION_RULES.order.max) {
    errors.push("Ordem deve ser no m\xE1ximo " + VALIDATION_RULES.order.max);
  }
  return errors;
}
function validateUarpsTrigger(triggerId) {
  var errors = [];
  if (!triggerId) return errors;
  if (triggerId.length > 100) {
    errors.push("Trigger ID deve ter no m\xE1ximo 100 caracteres");
  }
  if (!/^[a-z0-9:\-_]+$/i.test(triggerId)) {
    errors.push("Trigger ID deve conter apenas letras, n\xFAmeros, dois-pontos, h\xEDfen e underscore");
  }
  return errors;
}
function validateItemForm(formData) {
  var errors = [];
  errors = errors.concat(validateItemKey(formData.item_key));
  errors = errors.concat(validateLabel(formData.label));
  errors = errors.concat(validateIconName(formData.icon_name));
  errors = errors.concat(validateOrder(formData.order_index));
  errors = errors.concat(validateUarpsTrigger(formData.uarps_trigger_id));
  return {
    valid: errors.length === 0,
    errors
  };
}
function validateItem(item) {
  if (!item || typeof item !== "object") {
    return { valid: false, errors: ["Item inv\xE1lido ou vazio"] };
  }
  var errors = [];
  var key = item.item_key || item.id || item.key || "";
  var label = item.label || item.title || "";
  errors = errors.concat(validateItemKey(key));
  errors = errors.concat(validateLabel(label));
  if (item.icon_name || item.icon) errors = errors.concat(validateIconName(item.icon_name || item.icon));
  if (item.order_index !== void 0 || item.order !== void 0) errors = errors.concat(validateOrder(item.order_index !== void 0 ? item.order_index : item.order));
  if (item.uarps_trigger_id) errors = errors.concat(validateUarpsTrigger(item.uarps_trigger_id));
  if (item.route_path || item.href) {
    var path = item.route_path || item.href;
    if (path.length > VALIDATION_RULES.routePath.maxLength) {
      errors.push("Rota deve ter no m\xE1ximo " + VALIDATION_RULES.routePath.maxLength + " caracteres");
    }
  }
  if (item.panel_id) {
    if (!VALIDATION_RULES.panelId.pattern.test(item.panel_id)) {
      errors.push("Panel ID deve conter apenas letras, n\xFAmeros, h\xEDfen e underscore");
    }
    if (item.panel_id.length > VALIDATION_RULES.panelId.maxLength) {
      errors.push("Panel ID deve ter no m\xE1ximo " + VALIDATION_RULES.panelId.maxLength + " caracteres");
    }
  }
  return { valid: errors.length === 0, errors };
}
function validateSectionData(section) {
  if (!section || typeof section !== "object") {
    return { valid: false, errors: ["Dados de se\xE7\xE3o inv\xE1lidos ou vazios"] };
  }
  var errors = [];
  var key = String(section.section_key || section.id || section.key || "");
  if (!key) {
    errors.push("Section key \xE9 obrigat\xF3ria");
  } else {
    if (key.length < VALIDATION_RULES.sectionKey.minLength) {
      errors.push("Section key deve ter pelo menos " + VALIDATION_RULES.sectionKey.minLength + " caracteres");
    }
    if (key.length > VALIDATION_RULES.sectionKey.maxLength) {
      errors.push("Section key deve ter no m\xE1ximo " + VALIDATION_RULES.sectionKey.maxLength + " caracteres");
    }
    if (!VALIDATION_RULES.sectionKey.pattern.test(key)) {
      errors.push("Section key deve conter apenas letras, n\xFAmeros, h\xEDfen e underscore");
    }
  }
  var label = String(section.label || section.name || section.title || "");
  if (!label) {
    errors.push("Label da se\xE7\xE3o \xE9 obrigat\xF3rio");
  } else {
    if (label.length > VALIDATION_RULES.sectionLabel.maxLength) {
      errors.push("Label da se\xE7\xE3o deve ter no m\xE1ximo " + VALIDATION_RULES.sectionLabel.maxLength + " caracteres");
    }
  }
  if (section.order_index !== void 0) {
    errors = errors.concat(validateOrder(section.order_index));
  }
  return { valid: errors.length === 0, errors };
}
export {
  MODULE_ID,
  VERSION,
  validateIconName,
  validateItem,
  validateItemForm,
  validateItemKey,
  validateLabel,
  validateOrder,
  validateSectionData,
  validateUarpsTrigger
};
