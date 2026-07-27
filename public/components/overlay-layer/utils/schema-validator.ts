
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0)
// ═══════════════════════════════════════════════════════════════
// MODULE: overlay-layer-schema-validator
// PURPOSE: Overlay Layer - Schema Validator v1.0.0
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   validate() — exported function
//   validateConfig() — exported function
//   isValidType() — exported function
//   isValidScope() — exported function
//   getValidTypes() — exported function
//   getValidScopes() — exported function
//   getSchema() — exported function
//   getConfigSchema() — exported function
//   getMetrics() — exported function
//   resetMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.0.0';
export const MODULE_ID = 'overlay-layer-schema-validator';

// Tipos válidos
const VALID_TYPES = ['modal', 'drawer', 'dialog', 'loading', 'toast', 'sheet'];
const VALID_SCOPES = ['global', 'page', 'component'];
const VALID_TRANSITIONS = ['fade', 'slide-up', 'slide-down', 'slide-left', 'slide-right', 'scale', 'none'];

// Schema de configuração
const CONFIG_SCHEMA = {
  blocking: { type: 'boolean', default: false },
  closable: { type: 'boolean', default: true },
  backdrop: { type: 'boolean', default: true },
  backdropClose: { type: 'boolean', default: true },
  escapeClose: { type: 'boolean', default: true },
  timeout: { type: 'number', min: 0, default: 0 },
  priority: { type: 'number', min: 0, max: 100, default: 50 },
  transition: { type: 'string', enum: VALID_TRANSITIONS, default: 'fade' },
  zIndex: { type: 'number', min: 0 },
  className: { type: 'string' },
  ariaLabel: { type: 'string' },
  ariaDescribedBy: { type: 'string' },
  focusFirst: { type: 'boolean', default: true },
  trapFocus: { type: 'boolean', default: true },
  restoreFocus: { type: 'boolean', default: true }
};

// Schema principal do descriptor
const DESCRIPTOR_SCHEMA = {
  id: { type: 'string', required: false, pattern: /^[a-zA-Z0-9_-]+$/ },
  type: { type: 'string', required: true, enum: VALID_TYPES },
  scope: { type: 'string', required: false, enum: VALID_SCOPES, default: 'global' },
  template: { type: 'string', required: false },
  content: { type: ['string', 'object', 'null'], required: false, default: null as DynObj },
  config: { type: 'object', required: false, schema: CONFIG_SCHEMA, default: {} },
  meta: { type: 'object', required: false, default: {} },
  data: { type: 'object', required: false, default: {} }
};

// Métricas
let _metrics = {
  validations: 0,
  passed: 0,
  failed: 0,
  errors: [] as DynObj
};

/**
 * Valida um valor contra um tipo esperado
 */
function validateType(value: DynObj, expectedType: DynObj, fieldName: string) {
  const errors = [];
  
  // Suporte a múltiplos tipos
  const types = Array.isArray(expectedType) ? expectedType : [expectedType];
  
  let isValid = false;
  for (const type of types) {
    if (type === 'null' && value === null) {
      isValid = true;
      break;
    }
    if (type === 'string' && typeof value === 'string') {
      isValid = true;
      break;
    }
    if (type === 'number' && typeof value === 'number' && !isNaN(value)) {
      isValid = true;
      break;
    }
    if (type === 'boolean' && typeof value === 'boolean') {
      isValid = true;
      break;
    }
    if (type === 'object' && typeof value === 'object' && value !== null && !Array.isArray(value)) {
      isValid = true;
      break;
    }
    if (type === 'array' && Array.isArray(value)) {
      isValid = true;
      break;
    }
    if (type === 'function' && typeof value === 'function') {
      isValid = true;
      break;
    }
  }
  
  if (!isValid) {
    errors.push(`${fieldName}: expected ${types.join(' | ')}, got ${typeof value}`);
  }
  
  return errors;
}

/**
 * Valida um campo contra sua definição de schema
 */
function validateField(value: DynObj, fieldDef: DynObj, fieldName: string): DynObj  {
  const errors = [];
  
  // Verificar required
  if (value === undefined || value === null) {
    if (fieldDef.required) {
      errors.push(`${fieldName}: field is required`);
    }
    return errors;
  }
  
  // Verificar tipo
  if (fieldDef.type) {
    const typeErrors = validateType(value, fieldDef.type, fieldName);
    errors.push(...typeErrors);
    if (typeErrors.length > 0) return errors;
  }
  
  // Verificar enum
  if (fieldDef.enum && !fieldDef.enum.includes(value)) {
    errors.push(`${fieldName}: must be one of [${fieldDef.enum.join(', ')}], got "${value}"`);
  }
  
  // Verificar pattern (regex)
  if (fieldDef.pattern && typeof value === 'string' && !fieldDef.pattern.test(value)) {
    errors.push(`${fieldName}: does not match required pattern`);
  }
  
  // Verificar min/max para números
  if (typeof value === 'number') {
    if (fieldDef.min !== undefined && value < fieldDef.min) {
      errors.push(`${fieldName}: must be >= ${fieldDef.min}, got ${value}`);
    }
    if (fieldDef.max !== undefined && value > fieldDef.max) {
      errors.push(`${fieldName}: must be <= ${fieldDef.max}, got ${value}`);
    }
  }
  
  // Verificar minLength/maxLength para strings
  if (typeof value === 'string') {
    if (fieldDef.minLength !== undefined && value.length < fieldDef.minLength) {
      errors.push(`${fieldName}: length must be >= ${fieldDef.minLength}`);
    }
    if (fieldDef.maxLength !== undefined && value.length > fieldDef.maxLength) {
      errors.push(`${fieldName}: length must be <= ${fieldDef.maxLength}`);
    }
  }
  
  // Validar sub-schema para objetos
  if (fieldDef.schema && typeof value === 'object' && value !== null) {
    for (const [subKey, subDef] of Object.entries(fieldDef.schema)) {
      const subErrors = validateField(value[subKey], subDef, `${fieldName}.${subKey}`);
      errors.push(...subErrors);
    }
  }
  
  return errors;
}

/**
 * Aplica valores default ao descriptor
 */
function applyDefaults(descriptor: DynObj, schema: DynObj) {
  const result = { ...descriptor };
  
  for (const [key, fieldDef] of Object.entries(schema) as any[]) {
    if (result[key] === undefined && fieldDef.default !== undefined) {
      result[key] = typeof fieldDef.default === 'object'
        ? { ...fieldDef.default }
        : fieldDef.default;
    }

    // Aplicar defaults em sub-schema
    if (fieldDef.schema && typeof result[key] === 'object' && result[key] !== null) {
      result[key] = applyDefaults(result[key], fieldDef.schema);
    }
  }
  
  return result;
}

/**
 * Valida um descriptor de overlay
 * @param {Object} descriptor - Descriptor a ser validado
 * @param {Object} options - Opções de validação
 * @returns {Object} Resultado da validação
 */
export function validate(descriptor: DynObj, options: { strict?: boolean; applyDefaults?: boolean } = {}) {
  _metrics.validations++;
  const startTime = performance.now();
  
  const errors = [];
  const warnings = [];
  
  // Verificar se descriptor existe
  if (!descriptor || typeof descriptor !== 'object') {
    _metrics.failed++;
    _metrics.errors.push('descriptor-invalid');
    return {
      valid: false,
      errors: ['descriptor must be a non-null object'],
      warnings: [],
      normalized: null,
      duration: performance.now() - startTime
    };
  }
  
  // Validar cada campo do schema
  for (const [key, fieldDef] of Object.entries(DESCRIPTOR_SCHEMA)) {
    const fieldErrors = validateField(descriptor[key], fieldDef, key);
    errors.push(...fieldErrors);
  }
  
  // Verificar campos desconhecidos (warning, não erro)
  if (options.strict) {
    const knownFields = Object.keys(DESCRIPTOR_SCHEMA);
    for (const key of Object.keys(descriptor)) {
      if (!knownFields.includes(key)) {
        warnings.push(`unknown field: ${key}`);
      }
    }
  }
  
  // Validações de negócio adicionais
  if (descriptor.config?.timeout && descriptor.config.timeout > 0) {
    if (descriptor.type === 'modal' && descriptor.config.blocking) {
      warnings.push('blocking modal with timeout may cause UX issues');
    }
  }
  
  if (descriptor.config?.priority > 90 && !descriptor.config?.blocking) {
    warnings.push('high priority overlay should typically be blocking');
  }
  
  // Gerar resultado
  const isValid = errors.length === 0;
  
  if (isValid) {
    _metrics.passed++;
  } else {
    _metrics.failed++;
    _metrics.errors.push(...errors.slice(0, 3)); // Guardar primeiros 3 erros
  }
  
  // Normalizar descriptor com defaults
  const normalized = isValid ? applyDefaults(descriptor, DESCRIPTOR_SCHEMA) : null;
  
  // Gerar ID se não fornecido
  if (normalized && !normalized.id) {
    normalized.id = `${normalized.type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
  
  return {
    valid: isValid,
    errors,
    warnings,
    normalized,
    duration: performance.now() - startTime
  };
}

/**
 * Valida apenas a configuração
 */
export function validateConfig(config: DynObj) {
  const errors = [];
  
  if (!config || typeof config !== 'object') {
    return { valid: true, errors: [], normalized: {} };
  }
  
  for (const [key, fieldDef] of Object.entries(CONFIG_SCHEMA)) {
    if (config[key] !== undefined) {
      const fieldErrors = validateField(config[key], fieldDef, `config.${key}`);
      errors.push(...fieldErrors);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    normalized: errors.length === 0 ? applyDefaults(config, CONFIG_SCHEMA) : null
  };
}

/**
 * Verifica se um tipo é válido
 */
export function isValidType(type: DynObj) {
  return VALID_TYPES.includes(type);
}

/**
 * Verifica se um scope é válido
 */
export function isValidScope(scope: DynObj) {
  return VALID_SCOPES.includes(scope);
}

/**
 * Retorna tipos válidos
 */
export function getValidTypes() {
  return [...VALID_TYPES];
}

/**
 * Retorna scopes válidos
 */
export function getValidScopes() {
  return [...VALID_SCOPES];
}

/**
 * Retorna schema do descriptor
 */
export function getSchema() {
  return JSON.parse(JSON.stringify(DESCRIPTOR_SCHEMA));
}

/**
 * Retorna schema da config
 */
export function getConfigSchema() {
  return JSON.parse(JSON.stringify(CONFIG_SCHEMA));
}

/**
 * Retorna métricas
 */
export function getMetrics() {
  return { ..._metrics, errorSample: _metrics.errors.slice(-10) };
}

/**
 * Reseta métricas
 */
export function resetMetrics() {
  _metrics = { validations: 0, passed: 0, failed: 0, errors: [] };
}

/**
 * Health check
 */
export function healthCheck() {
  const passRate = _metrics.validations > 0 
    ? (_metrics.passed / _metrics.validations) * 100 
    : 100;
  
  const checks = {
    schemaLoaded: Object.keys(DESCRIPTOR_SCHEMA).length > 0,
    configSchemaLoaded: Object.keys(CONFIG_SCHEMA).length > 0,
    validTypesLoaded: VALID_TYPES.length > 0,
    passRateHealthy: passRate >= 80
  };
  
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  
  return {
    status: passed === total ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY',
    score: `${passed}/${total}`,
    checks,
    metrics: {
      validations: _metrics.validations,
      passRate: `${passRate.toFixed(1)}%`
    },
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

/**
 * Info do módulo
 */
export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    validTypes: VALID_TYPES,
    validScopes: VALID_SCOPES,
    validTransitions: VALID_TRANSITIONS,
    schemaFields: Object.keys(DESCRIPTOR_SCHEMA),
    configFields: Object.keys(CONFIG_SCHEMA),
    metrics: getMetrics(),
    timestamp: Date.now()
  };
}

// Export default
export default {
  validate,
  validateConfig,
  isValidType,
  isValidScope,
  getValidTypes,
  getValidScopes,
  getSchema,
  getConfigSchema,
  getMetrics,
  resetMetrics,
  healthCheck,
  info,
  VERSION,
  MODULE_ID,
  VALID_TYPES,
  VALID_SCOPES
};
