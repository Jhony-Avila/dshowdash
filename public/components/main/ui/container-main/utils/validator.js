const VERSION = "1.0.0-PHASE3";
const MODULE_ID = "container-main:validator";
const TYPES = Object.freeze({
  STRING: "string",
  NUMBER: "number",
  BOOLEAN: "boolean",
  ARRAY: "array",
  OBJECT: "object",
  FUNCTION: "function",
  ENUM: "enum",
  REGEX: "regex",
  EMAIL: "email",
  URL: "url",
  DATE: "date",
  UUID: "uuid",
  ANY: "any"
});
const PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^https?:\/\/.+/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  moduleId: /^[a-z][a-z0-9-]*(?::[a-z][a-z0-9-]*)*$/
};
const DEFAULT_MESSAGES = {
  required: "Field is required",
  type: "Invalid type, expected {expected}",
  min: "Value must be at least {min}",
  max: "Value must be at most {max}",
  minLength: "Length must be at least {minLength}",
  maxLength: "Length must be at most {maxLength}",
  pattern: "Value does not match pattern",
  enum: "Value must be one of: {values}",
  custom: "Validation failed"
};
function _validateType(value, type) {
  switch (type) {
    case TYPES.STRING:
      return typeof value === "string";
    case TYPES.NUMBER:
      return typeof value === "number" && !isNaN(value);
    case TYPES.BOOLEAN:
      return typeof value === "boolean";
    case TYPES.ARRAY:
      return Array.isArray(value);
    case TYPES.OBJECT:
      return typeof value === "object" && value !== null && !Array.isArray(value);
    case TYPES.FUNCTION:
      return typeof value === "function";
    case TYPES.DATE:
      return value instanceof Date && !isNaN(value);
    case TYPES.ANY:
      return true;
    default:
      return true;
  }
}
function validate(value, schema, options = {}) {
  const { abortEarly = false, stripUnknown = false } = options;
  const errors = [];
  if (schema.required && (value === void 0 || value === null || value === "")) {
    errors.push({ field: schema.field || "value", message: schema.messages?.required || DEFAULT_MESSAGES.required, rule: "required" });
    if (abortEarly) return { valid: false, errors, value };
  }
  if (!schema.required && (value === void 0 || value === null)) {
    return { valid: true, errors: [], value: schema.default };
  }
  if (schema.type && schema.type !== TYPES.ANY) {
    if (!_validateType(value, schema.type)) {
      errors.push({
        field: schema.field || "value",
        // @ts-expect-error TS migration - TS2339
        message: (schema.messages?.type || DEFAULT_MESSAGES.type).replace("{expected}", schema.type),
        rule: "type",
        expected: schema.type,
        received: typeof value
      });
      if (abortEarly) return { valid: false, errors, value };
    }
  }
  if (schema.enum && Array.isArray(schema.enum)) {
    if (!schema.enum.includes(value)) {
      errors.push({
        field: schema.field || "value",
        // @ts-expect-error TS migration - TS2339
        message: (schema.messages?.enum || DEFAULT_MESSAGES.enum).replace("{values}", schema.enum.join(", ")),
        rule: "enum",
        allowed: schema.enum
      });
      if (abortEarly) return { valid: false, errors, value };
    }
  }
  if (schema.type === TYPES.NUMBER && typeof value === "number") {
    if (schema.min !== void 0 && value < schema.min) {
      errors.push({ field: schema.field || "value", message: (schema.messages?.min || DEFAULT_MESSAGES.min).replace("{min}", schema.min), rule: "min" });
    }
    if (schema.max !== void 0 && value > schema.max) {
      errors.push({ field: schema.field || "value", message: (schema.messages?.max || DEFAULT_MESSAGES.max).replace("{max}", schema.max), rule: "max" });
    }
    if (schema.integer && !Number.isInteger(value)) {
      errors.push({ field: schema.field || "value", message: "Value must be an integer", rule: "integer" });
    }
    if (schema.positive && value <= 0) {
      errors.push({ field: schema.field || "value", message: "Value must be positive", rule: "positive" });
    }
  }
  if (schema.type === TYPES.STRING && typeof value === "string") {
    if (schema.minLength !== void 0 && value.length < schema.minLength) {
      errors.push({ field: schema.field || "value", message: (schema.messages?.minLength || DEFAULT_MESSAGES.minLength).replace("{minLength}", schema.minLength), rule: "minLength" });
    }
    if (schema.maxLength !== void 0 && value.length > schema.maxLength) {
      errors.push({ field: schema.field || "value", message: (schema.messages?.maxLength || DEFAULT_MESSAGES.maxLength).replace("{maxLength}", schema.maxLength), rule: "maxLength" });
    }
    if (schema.pattern) {
      const pattern = typeof schema.pattern === "string" ? PATTERNS[schema.pattern] || new RegExp(schema.pattern) : schema.pattern;
      if ((!pattern.test)(value)) {
        errors.push({ field: schema.field || "value", message: schema.messages?.pattern || DEFAULT_MESSAGES.pattern, rule: "pattern" });
      }
    }
    if (schema.trim) {
      value = value.trim();
    }
  }
  if (schema.type === TYPES.ARRAY && Array.isArray(value)) {
    if (schema.minItems !== void 0 && value.length < schema.minItems) {
      errors.push({ field: schema.field || "value", message: `Array must have at least ${schema.minItems} items`, rule: "minItems" });
    }
    if (schema.maxItems !== void 0 && value.length > schema.maxItems) {
      errors.push({ field: schema.field || "value", message: `Array must have at most ${schema.maxItems} items`, rule: "maxItems" });
    }
    if (schema.items) {
      value.forEach((item, index) => {
        const itemResult = validate(item, { ...schema.items, field: `${schema.field || "value"}[${index}]` });
        if (!itemResult.valid) errors.push(...itemResult.errors);
      });
    }
  }
  if (schema.validate && typeof schema.validate === "function") {
    try {
      const customResult = schema.validate(value);
      if (customResult === false) {
        errors.push({ field: schema.field || "value", message: schema.messages?.custom || DEFAULT_MESSAGES.custom, rule: "custom" });
      } else if (typeof customResult === "string") {
        errors.push({ field: schema.field || "value", message: customResult, rule: "custom" });
      }
    } catch (e) {
      errors.push({ field: schema.field || "value", message: e.message, rule: "custom" });
    }
  }
  return { valid: errors.length === 0, errors, value };
}
function validateObject(obj, schema, options = {}) {
  const { abortEarly = false, stripUnknown = false, allowUnknown = true } = options;
  const errors = [];
  const normalized = {};
  const schemaFields = Object.keys(schema);
  const objFields = Object.keys(obj || {});
  for (const field of schemaFields) {
    const fieldSchema = { ...schema[field], field };
    const result = validate(obj?.[field], fieldSchema, { abortEarly });
    if (!result.valid) {
      errors.push(...result.errors);
      if (abortEarly) break;
    }
    normalized[field] = result.value !== void 0 ? result.value : schema[field].default;
  }
  if (!allowUnknown) {
    const unknownFields = objFields.filter((f) => !schemaFields.includes(f));
    if (unknownFields.length > 0) {
      errors.push({ field: "object", message: `Unknown fields: ${unknownFields.join(", ")}`, rule: "unknown" });
    }
  } else if (!stripUnknown) {
    for (const field of objFields) {
      if (!schemaFields.includes(field)) {
        normalized[field] = obj[field];
      }
    }
  }
  return { valid: errors.length === 0, errors, value: normalized };
}
function createValidator(schema) {
  return {
    validate: (value, options) => validate(value, schema, options),
    isValid: (value) => validate(value, schema).valid,
    getErrors: (value) => validate(value, schema).errors
  };
}
function createObjectValidator(schema) {
  return {
    validate: (obj, options) => validateObject(obj, schema, options),
    isValid: (obj) => validateObject(obj, schema).valid,
    getErrors: (obj) => validateObject(obj, schema).errors,
    getSchema: () => ({ ...schema })
  };
}
const SCHEMAS = Object.freeze({
  panelId: { type: TYPES.STRING, required: true, minLength: 1, maxLength: 100, pattern: "slug" },
  moduleId: { type: TYPES.STRING, required: true, pattern: "moduleId" },
  version: { type: TYPES.STRING, required: true, pattern: /^\d+\.\d+\.\d+/ },
  timeout: { type: TYPES.NUMBER, min: 0, max: 3e5, default: 3e4 },
  priority: { type: TYPES.NUMBER, min: 0, max: 100, default: 50, integer: true },
  callback: { type: TYPES.FUNCTION, required: false },
  options: { type: TYPES.OBJECT, required: false, default: {} },
  enabled: { type: TYPES.BOOLEAN, default: true }
});
const is = {
  string: (v) => typeof v === "string",
  number: (v) => typeof v === "number" && !isNaN(v),
  boolean: (v) => typeof v === "boolean",
  array: (v) => Array.isArray(v),
  object: (v) => typeof v === "object" && v !== null && !Array.isArray(v),
  function: (v) => typeof v === "function",
  null: (v) => v === null,
  undefined: (v) => v === void 0,
  empty: (v) => v === null || v === void 0 || v === "" || Array.isArray(v) && v.length === 0,
  email: (v) => typeof v === "string" && PATTERNS.email.test(v),
  url: (v) => typeof v === "string" && PATTERNS.url.test(v),
  uuid: (v) => typeof v === "string" && PATTERNS.uuid.test(v)
};
function assert(condition, message = "Assertion failed") {
  if (!condition) {
    throw new Error(message);
  }
}
function assertType(value, type, name = "value") {
  if (!_validateType(value, type)) {
    throw new TypeError(`${name} must be of type ${type}, got ${typeof value}`);
  }
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    types: Object.keys(TYPES),
    patterns: Object.keys(PATTERNS),
    schemas: Object.keys(SCHEMAS)
  };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID
  };
}
var validator_default = {
  VERSION,
  MODULE_ID,
  TYPES,
  SCHEMAS,
  validate,
  validateObject,
  createValidator,
  createObjectValidator,
  is,
  assert,
  assertType,
  info,
  healthCheck
};
export {
  MODULE_ID,
  SCHEMAS,
  TYPES,
  VERSION,
  assert,
  assertType,
  createObjectValidator,
  createValidator,
  validator_default as default,
  healthCheck,
  info,
  is,
  validate,
  validateObject
};
