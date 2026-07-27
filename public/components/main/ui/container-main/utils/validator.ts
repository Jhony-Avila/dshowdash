
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-PHASE3-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:validator
// PURPOSE: Validator - Validação centralizada de inputs
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   TYPES — exported value
//   validate() — exported function
//   validateObject() — exported function
//   createValidator() — exported function
//   createObjectValidator() — exported function
//   SCHEMAS — exported value
//   is — exported value
//   assert() — exported function
//   assertType() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.0.0-PHASE3';
export const MODULE_ID = 'container-main:validator';

// Tipos de validação
export const TYPES = Object.freeze({
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  ARRAY: 'array',
  OBJECT: 'object',
  FUNCTION: 'function',
  ENUM: 'enum',
  REGEX: 'regex',
  EMAIL: 'email',
  URL: 'url',
  DATE: 'date',
  UUID: 'uuid',
  ANY: 'any'
});

// Padrões regex comuns
const PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^https?:\/\/.+/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  moduleId: /^[a-z][a-z0-9-]*(?::[a-z][a-z0-9-]*)*$/
};

// Mensagens de erro padrão
const DEFAULT_MESSAGES = {
  required: 'Field is required',
  type: 'Invalid type, expected {expected}',
  min: 'Value must be at least {min}',
  max: 'Value must be at most {max}',
  minLength: 'Length must be at least {minLength}',
  maxLength: 'Length must be at most {maxLength}',
  pattern: 'Value does not match pattern',
  enum: 'Value must be one of: {values}',
  custom: 'Validation failed'
};

// Valida tipo básico
function _validateType(value: unknown, type: string) {
  switch (type) {
    case TYPES.STRING: return typeof value === 'string';
    case TYPES.NUMBER: return typeof value === 'number' && !isNaN(value);
    case TYPES.BOOLEAN: return typeof value === 'boolean';
    case TYPES.ARRAY: return Array.isArray(value);
    case TYPES.OBJECT: return typeof value === 'object' && value !== null && !Array.isArray(value);
    case TYPES.FUNCTION: return typeof value === 'function';
    case TYPES.DATE: return value instanceof Date && !isNaN(value as any);
    case TYPES.ANY: return true;
    default: return true;
  }
}

// Valida um valor contra um schema
export function validate(value: unknown, schema: Record<string, unknown>, options: Record<string, unknown> = {}) {
  const { abortEarly = false, stripUnknown = false } = options;
  const errors = [];

  // Required check
  if (schema.required && (value === undefined || value === null || value === '')) {
    // @ts-expect-error TS migration - TS2339
    errors.push({ field: schema.field || 'value', message: schema.messages?.required || DEFAULT_MESSAGES.required, rule: 'required' });
    if (abortEarly) return { valid: false, errors, value };
  }

  // Skip validation if not required and empty
  if (!schema.required && (value === undefined || value === null)) {
    return { valid: true, errors: [], value: schema.default };
  }

  // Type check
  if (schema.type && schema.type !== TYPES.ANY) {
    if (!_validateType(value, (schema.type as string))) {
      errors.push({ 
        field: schema.field || 'value', 
        // @ts-expect-error TS migration - TS2339
        message: (schema.messages?.type || DEFAULT_MESSAGES.type).replace('{expected}', schema.type),
        rule: 'type',
        expected: schema.type,
        received: typeof value
      });
      if (abortEarly) return { valid: false, errors, value };
    }
  }

  // Enum check
  if (schema.enum && Array.isArray(schema.enum)) {
    if (!schema.enum.includes(value)) {
      errors.push({
        field: schema.field || 'value',
        // @ts-expect-error TS migration - TS2339
        message: (schema.messages?.enum || DEFAULT_MESSAGES.enum).replace('{values}', schema.enum.join(', ')),
        rule: 'enum',
        allowed: schema.enum
      });
      if (abortEarly) return { valid: false, errors, value };
    }
  }

  // Number validations
  if (schema.type === TYPES.NUMBER && typeof value === 'number') {
    // @ts-expect-error TS migration - TS2365
    if (schema.min !== undefined && (value as number) < schema.min) {
      // @ts-expect-error TS migration - TS2339
      errors.push({ field: schema.field || 'value', message: (schema.messages?.min || DEFAULT_MESSAGES.min).replace('{min}', schema.min), rule: 'min' });
    }
    // @ts-expect-error TS migration - TS2365
    if (schema.max !== undefined && (value as number) > schema.max) {
      // @ts-expect-error TS migration - TS2339
      errors.push({ field: schema.field || 'value', message: (schema.messages?.max || DEFAULT_MESSAGES.max).replace('{max}', schema.max), rule: 'max' });
    }
    if (schema.integer && !Number.isInteger(value)) {
      errors.push({ field: schema.field || 'value', message: 'Value must be an integer', rule: 'integer' });
    }
    if (schema.positive && value <= 0) {
      errors.push({ field: schema.field || 'value', message: 'Value must be positive', rule: 'positive' });
    }
  }

  // String validations
  if (schema.type === TYPES.STRING && typeof value === 'string') {
    // @ts-expect-error TS migration - TS2365
    if (schema.minLength !== undefined && (value.length as number) < schema.minLength) {
      // @ts-expect-error TS migration - TS2339
      errors.push({ field: schema.field || 'value', message: (schema.messages?.minLength || DEFAULT_MESSAGES.minLength).replace('{minLength}', schema.minLength), rule: 'minLength' });
    }
    // @ts-expect-error TS migration - TS2365
    if (schema.maxLength !== undefined && (value.length as number) > schema.maxLength) {
      // @ts-expect-error TS migration - TS2339
      errors.push({ field: schema.field || 'value', message: (schema.messages?.maxLength || DEFAULT_MESSAGES.maxLength).replace('{maxLength}', schema.maxLength), rule: 'maxLength' });
    }
    if (schema.pattern) {
      const pattern = typeof schema.pattern === 'string' ? (PATTERNS as Record<string, unknown>)[schema.pattern] || new RegExp(schema.pattern) : schema.pattern;
      // @ts-expect-error TS migration - TS2352
      if ((!(pattern as unknown as Record<string, unknown>).test as (...args: unknown[]) => unknown)(value)) {
        // @ts-expect-error TS migration - TS2339
        errors.push({ field: schema.field || 'value', message: schema.messages?.pattern || DEFAULT_MESSAGES.pattern, rule: 'pattern' });
      }
    }
    if (schema.trim) {
      value = value.trim();
    }
  }

  // Array validations
  if (schema.type === TYPES.ARRAY && Array.isArray(value)) {
    // @ts-expect-error TS migration - TS2365
    if (schema.minItems !== undefined && (value.length as number) < schema.minItems) {
      errors.push({ field: schema.field || 'value', message: `Array must have at least ${schema.minItems} items`, rule: 'minItems' });
    }
    // @ts-expect-error TS migration - TS2365
    if (schema.maxItems !== undefined && (value.length as number) > schema.maxItems) {
      errors.push({ field: schema.field || 'value', message: `Array must have at most ${schema.maxItems} items`, rule: 'maxItems' });
    }
    if (schema.items) {
      value.forEach((item, index) => {
        // @ts-expect-error TS migration - TS2698
        const itemResult = validate(item, { ...(schema as Record<string, unknown>).items, field: `${schema.field || 'value'}[${index}]` });
        if (!itemResult.valid) errors.push(...itemResult.errors);
      });
    }
  }

  // Custom validation
  if (schema.validate && typeof schema.validate === 'function') {
    try {
      const customResult = schema.validate(value);
      if (customResult === false) {
        // @ts-expect-error TS migration - TS2339
        errors.push({ field: schema.field || 'value', message: schema.messages?.custom || DEFAULT_MESSAGES.custom, rule: 'custom' });
      } else if (typeof customResult === 'string') {
        errors.push({ field: schema.field || 'value', message: customResult, rule: 'custom' });
      }
    } catch (e: any) {
      errors.push({ field: schema.field || 'value', message: e.message, rule: 'custom' });
    }
  }

  return { valid: errors.length === 0, errors, value };
}

// Valida objeto contra schema de objeto
export function validateObject(obj: Record<string, unknown>, schema: Record<string, unknown>, options: Record<string, unknown> = {}) {
  const { abortEarly = false, stripUnknown = false, allowUnknown = true } = options;
  const errors = [];
  const normalized = {};
  const schemaFields = Object.keys(schema);
  const objFields = Object.keys(obj || {});

  // Valida campos do schema
  for (const field of schemaFields) {
    // @ts-expect-error TS migration - TS2698
    const fieldSchema = { ...(schema as Record<string, unknown>)[field], field };
    const result = validate(obj?.[field], fieldSchema, { abortEarly });
    
    if (!result.valid) {
      errors.push(...result.errors);
      if (abortEarly) break;
    }
    
    // @ts-expect-error TS migration - TS2339
    (normalized as Record<string, unknown>)[field] = result.value !== undefined ? result.value : schema[field].default;
  }

  // Verifica campos desconhecidos
  if (!allowUnknown) {
    const unknownFields = objFields.filter(f => !schemaFields.includes(f));
    if (unknownFields.length > 0) {
      errors.push({ field: 'object', message: `Unknown fields: ${unknownFields.join(', ')}`, rule: 'unknown' });
    }
  } else if (!stripUnknown) {
    // Copia campos desconhecidos
    for (const field of objFields) {
      if (!schemaFields.includes(field)) {
        (normalized as Record<string, unknown>)[field] = obj[field];
      }
    }
  }

  return { valid: errors.length === 0, errors, value: normalized };
}

// Cria validador reutilizável
export function createValidator(schema: Record<string, unknown>) {
  return {
    validate: (value: unknown, options: Record<string, unknown>) => validate(value, schema, options),
    isValid: (value: unknown) => validate(value, schema).valid,
    getErrors: (value: unknown) => validate(value, schema).errors
  };
}

// Cria validador de objeto reutilizável
export function createObjectValidator(schema: Record<string, unknown>) {
  return {
    validate: (obj: Record<string, unknown>, options: Record<string, unknown>) => validateObject(obj, schema, options),
    isValid: (obj: Record<string, unknown>) => validateObject(obj, schema).valid,
    getErrors: (obj: Record<string, unknown>) => validateObject(obj, schema).errors,
    getSchema: () => ({ ...schema })
  };
}

// Schemas pré-definidos
export const SCHEMAS = Object.freeze({
  panelId: { type: TYPES.STRING, required: true, minLength: 1, maxLength: 100, pattern: 'slug' },
  moduleId: { type: TYPES.STRING, required: true, pattern: 'moduleId' },
  version: { type: TYPES.STRING, required: true, pattern: /^\d+\.\d+\.\d+/ },
  timeout: { type: TYPES.NUMBER, min: 0, max: 300000, default: 30000 },
  priority: { type: TYPES.NUMBER, min: 0, max: 100, default: 50, integer: true },
  callback: { type: TYPES.FUNCTION, required: false },
  options: { type: TYPES.OBJECT, required: false, default: {} },
  enabled: { type: TYPES.BOOLEAN, default: true }
});

// Helpers de validação rápida
export const is = {
  string: (v: string) => typeof v === 'string',
  number: (v: string) => typeof v === 'number' && !isNaN(v),
  boolean: (v: string) => typeof v === 'boolean',
  array: (v: string) => Array.isArray(v),
  object: (v: string) => typeof v === 'object' && v !== null && !Array.isArray(v),
  function: (v: string) => typeof v === 'function',
  null: (v: string) => v === null,
  undefined: (v: string) => v === undefined,
  empty: (v: string) => v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0),
  email: (v: string) => typeof v === 'string' && PATTERNS.email.test(v),
  url: (v: string) => typeof v === 'string' && PATTERNS.url.test(v),
  uuid: (v: string) => typeof v === 'string' && PATTERNS.uuid.test(v)
};

// Assert com erro
export function assert(condition: Record<string, unknown>, message = 'Assertion failed') {
  if (!condition) {
    throw new Error(message);
  }
}

// Assert tipo
export function assertType(value: unknown, type: string, name = 'value') {
  if (!_validateType(value, type)) {
    throw new TypeError(`${name} must be of type ${type}, got ${typeof value}`);
  }
}

// Info
export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    types: Object.keys(TYPES),
    patterns: Object.keys(PATTERNS),
    schemas: Object.keys(SCHEMAS)
  };
}

// Health check
export function healthCheck() {
  return {
    status: 'HEALTHY',
    version: VERSION,
    moduleId: MODULE_ID
  };
}

export default {
  VERSION, MODULE_ID, TYPES, SCHEMAS,
  validate, validateObject,
  createValidator, createObjectValidator,
  is, assert, assertType,
  info, healthCheck
};
