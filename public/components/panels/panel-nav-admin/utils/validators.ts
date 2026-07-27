// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.4.0-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin:validators
// PURPOSE: Panel Nav Admin - Validators
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   validateItemKey() — exported function
//   validateLabel() — exported function
//   validateIconName() — exported function
//   validateOrder() — exported function
//   validateUarpsTrigger() — exported function
//   validateItemForm() — exported function
//   validateItem() — exported function
//   validateSectionData() — exported function
//
// @changelog
//   9.4.0-P18EC - Add validateItem() and validateSectionData() consumed by crud.js
//   8.8.0-ENTERPRISE-AAA - Previous version
// ═══════════════════════════════════════════════════════════════

'use strict';

export const MODULE_ID = 'panel-nav-admin:validators';
const VERSION = '9.4.0-P18EC-ENTERPRISE';

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

export function validateItemKey(key: string) {
  var errors: string[] = [];
  if (!key) {
    errors.push('ID/Key é obrigatório');
    return errors;
  }
  if (key.length < VALIDATION_RULES.itemKey.minLength) {
    errors.push('ID/Key deve ter pelo menos ' + VALIDATION_RULES.itemKey.minLength + ' caracteres');
  }
  if (key.length > VALIDATION_RULES.itemKey.maxLength) {
    errors.push('ID/Key deve ter no máximo ' + VALIDATION_RULES.itemKey.maxLength + ' caracteres');
  }
  if (!VALIDATION_RULES.itemKey.pattern.test(key)) {
    errors.push('ID/Key deve conter apenas letras, números, hífen e underscore');
  }
  return errors;
}

export function validateLabel(label: string) {
  var errors: string[] = [];
  if (!label) {
    errors.push('Label é obrigatório');
    return errors;
  }
  if (label.length < VALIDATION_RULES.label.minLength) {
    errors.push('Label deve ter pelo menos ' + VALIDATION_RULES.label.minLength + ' caractere');
  }
  if (label.length > VALIDATION_RULES.label.maxLength) {
    errors.push('Label deve ter no máximo ' + VALIDATION_RULES.label.maxLength + ' caracteres');
  }
  return errors;
}

export function validateIconName(icon: string) {
  var errors: string[] = [];
  if (!icon) return errors;
  if (icon.length > VALIDATION_RULES.iconName.maxLength) {
    errors.push('Ícone deve ter no máximo ' + VALIDATION_RULES.iconName.maxLength + ' caracteres');
  }
  if (!VALIDATION_RULES.iconName.pattern.test(icon)) {
    errors.push('Ícone deve conter apenas letras, números, hífen e underscore');
  }
  return errors;
}

export function validateOrder(order: unknown) {
  var errors: string[] = [];
  var num = parseInt(String(order)) || 0;
  if (num < VALIDATION_RULES.order.min) {
    errors.push('Ordem deve ser pelo menos ' + VALIDATION_RULES.order.min);
  }
  if (num > VALIDATION_RULES.order.max) {
    errors.push('Ordem deve ser no máximo ' + VALIDATION_RULES.order.max);
  }
  return errors;
}

export function validateUarpsTrigger(triggerId: string) {
  var errors: string[] = [];
  if (!triggerId) return errors;
  if (triggerId.length > 100) {
    errors.push('Trigger ID deve ter no máximo 100 caracteres');
  }
  if (!/^[a-z0-9:\-_]+$/i.test(triggerId)) {
    errors.push('Trigger ID deve conter apenas letras, números, dois-pontos, hífen e underscore');
  }
  return errors;
}

export function validateItemForm(formData: Record<string, unknown>) {
  var errors: string[] = [];
  errors = errors.concat(validateItemKey(formData.item_key as string));
  errors = errors.concat(validateLabel(formData.label as string));
  errors = errors.concat(validateIconName(formData.icon_name as string));
  errors = errors.concat(validateOrder(formData.order_index));
  errors = errors.concat(validateUarpsTrigger(formData.uarps_trigger_id as string));
  return {
    valid: errors.length === 0,
    errors: errors
  };
}

// v9.4.0-P18EC: validateItem - Validates a navigation item object, consumed by crud.js
// Accepts item object with fields: id, label, icon, href, section, order, uarps_trigger_id, etc.
// @param {Object} item - Item data object
// @returns {Object} { valid: boolean, errors: string[] }
export function validateItem(item: Record<string, unknown>) {
  if (!item || typeof item !== 'object') {
    return { valid: false, errors: ['Item inválido ou vazio'] };
  }
  var errors: string[] = [];
  var key = (item.item_key || item.id || item.key || '') as string;
  var label = (item.label || item.title || '') as string;
  errors = errors.concat(validateItemKey(key));
  errors = errors.concat(validateLabel(label));
  if (item.icon_name || item.icon) errors = errors.concat(validateIconName((item.icon_name || item.icon) as string));
  if (item.order_index !== undefined || item.order !== undefined) errors = errors.concat(validateOrder(item.order_index !== undefined ? item.order_index : item.order));
  if (item.uarps_trigger_id) errors = errors.concat(validateUarpsTrigger(item.uarps_trigger_id as string));
  if (item.route_path || item.href) {
    var path = (item.route_path || item.href) as string;
    if (path.length > VALIDATION_RULES.routePath.maxLength) {
      errors.push('Rota deve ter no máximo ' + VALIDATION_RULES.routePath.maxLength + ' caracteres');
    }
  }
  if (item.panel_id) {
    if (!VALIDATION_RULES.panelId.pattern.test(item.panel_id as string)) {
      errors.push('Panel ID deve conter apenas letras, números, hífen e underscore');
    }
    if ((item.panel_id as string).length > VALIDATION_RULES.panelId.maxLength) {
      errors.push('Panel ID deve ter no máximo ' + VALIDATION_RULES.panelId.maxLength + ' caracteres');
    }
  }
  return { valid: errors.length === 0, errors: errors };
}

// v9.4.0-P18EC: validateSectionData - Validates a section/group object, consumed by crud.js
// @param {Object} section - Section data object with section_key, label, etc.
// @returns {Object} { valid: boolean, errors: string[] }
export function validateSectionData(section: Record<string, unknown>) {
  if (!section || typeof section !== 'object') {
    return { valid: false, errors: ['Dados de seção inválidos ou vazios'] };
  }
  var errors: string[] = [];
  var key = String(section.section_key || section.id || section.key || '');
  if (!key) {
    errors.push('Section key é obrigatória');
  } else {
    if (key.length < VALIDATION_RULES.sectionKey.minLength) {
      errors.push('Section key deve ter pelo menos ' + VALIDATION_RULES.sectionKey.minLength + ' caracteres');
    }
    if (key.length > VALIDATION_RULES.sectionKey.maxLength) {
      errors.push('Section key deve ter no máximo ' + VALIDATION_RULES.sectionKey.maxLength + ' caracteres');
    }
    if (!VALIDATION_RULES.sectionKey.pattern.test(key)) {
      errors.push('Section key deve conter apenas letras, números, hífen e underscore');
    }
  }
  var label = String(section.label || section.name || section.title || '');
  if (!label) {
    errors.push('Label da seção é obrigatório');
  } else {
    if (label.length > VALIDATION_RULES.sectionLabel.maxLength) {
      errors.push('Label da seção deve ter no máximo ' + VALIDATION_RULES.sectionLabel.maxLength + ' caracteres');
    }
  }
  if (section.order_index !== undefined) {
    errors = errors.concat(validateOrder(section.order_index));
  }
  return { valid: errors.length === 0, errors: errors };
}

export { VERSION };
