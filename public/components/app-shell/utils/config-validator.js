const VERSION = "1.0.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell-config-validator";
const _metrics = { validations: 0, passed: 0, failed: 0, warnings: 0 };
let _lastValidation = null;
const INIT_OPTIONS_SCHEMA = {
  force: { type: "boolean", default: false },
  adapters: {
    type: "object",
    properties: {
      globalState: { type: "boolean", default: true },
      auth: { type: "boolean", default: true },
      layout: { type: "boolean", default: true },
      theme: { type: "boolean", default: true },
      notification: { type: "boolean", default: true },
      router: { type: "boolean", default: true },
      ticker: { type: "boolean", default: true },
      responsive: { type: "boolean", default: true }
    }
  },
  logger: {
    type: "object",
    properties: {
      level: { type: "string", enum: ["debug", "info", "warn", "error", "silent"], default: "info" },
      colorize: { type: "boolean", default: true }
    }
  },
  healthCheck: {
    type: "object",
    properties: {
      autoEnabled: { type: "boolean", default: true },
      interval: { type: "number", min: 1e3, max: 3e5, default: 3e4 }
    }
  },
  responsive: {
    type: "object",
    properties: {
      enabled: { type: "boolean", default: true },
      autoApply: { type: "boolean", default: true }
    }
  },
  keyboard: {
    type: "object",
    properties: {
      enabled: { type: "boolean", default: true }
    }
  },
  theme: {
    type: "object",
    properties: {
      initial: { type: "string", enum: ["light", "dark", "system"], default: "system" }
    }
  },
  debug: { type: "boolean", default: false }
};
function _validateValue(value, schema, path) {
  const errors = [], warnings = [];
  if (value === void 0) {
    if (schema.required) errors.push({ path, message: "Required field missing", code: "REQUIRED" });
    return { valid: errors.length === 0, errors, warnings };
  }
  const actualType = Array.isArray(value) ? "array" : typeof value;
  if (schema.type && actualType !== schema.type) {
    errors.push({ path, message: `Expected ${schema.type}, got ${actualType}`, code: "TYPE_MISMATCH" });
    return { valid: false, errors, warnings };
  }
  if (schema.enum && schema.enum.indexOf(value) < 0) {
    errors.push({ path, message: `Value must be one of: ${schema.enum.join(", ")}`, code: "INVALID_ENUM" });
  }
  if (schema.min !== void 0 && value < schema.min) {
    errors.push({ path, message: `Value must be >= ${schema.min}`, code: "MIN_VALUE" });
  }
  if (schema.max !== void 0 && value > schema.max) {
    errors.push({ path, message: `Value must be <= ${schema.max}`, code: "MAX_VALUE" });
  }
  if (schema.type === "object" && schema.properties) {
    const propNames = Object.keys(schema.properties);
    for (let i = 0; i < propNames.length; i++) {
      const propName = propNames[i];
      const propResult = _validateValue(value[propName], schema.properties[propName], `${path}.${propName}`);
      errors.push.apply(errors, propResult.errors);
      warnings.push.apply(warnings, propResult.warnings);
    }
    const valueKeys = Object.keys(value);
    for (let j = 0; j < valueKeys.length; j++) {
      if (!schema.properties[valueKeys[j]]) {
        warnings.push({ path: `${path}.${valueKeys[j]}`, message: "Unknown property", code: "UNKNOWN_PROP" });
      }
    }
  }
  return { valid: errors.length === 0, errors, warnings };
}
function validate(options, schema) {
  _metrics.validations++;
  const result = _validateValue(options, { type: "object", properties: schema }, "options");
  if (result.valid) _metrics.passed++;
  else _metrics.failed++;
  _metrics.warnings += result.warnings.length;
  _lastValidation = { options, schema, result, timestamp: Date.now() };
  return result;
}
function validateAndNormalize(options, schema) {
  options = options || {};
  const result = validate(options, schema);
  if (!result.valid) return { valid: false, errors: result.errors, warnings: result.warnings, normalized: null };
  const normalized = _applyDefaults(options, schema);
  return { valid: true, errors: [], warnings: result.warnings, normalized };
}
function _applyDefaults(options, schema) {
  const result = {};
  const propNames = Object.keys(schema);
  for (let i = 0; i < propNames.length; i++) {
    const propName = propNames[i];
    const propSchema = schema[propName];
    if (options[propName] !== void 0) {
      if (propSchema.type === "object" && propSchema.properties) {
        result[propName] = _applyDefaults(options[propName], propSchema.properties);
      } else {
        result[propName] = options[propName];
      }
    } else if (propSchema.default !== void 0) {
      result[propName] = propSchema.default;
    } else if (propSchema.type === "object" && propSchema.properties) {
      result[propName] = _applyDefaults({}, propSchema.properties);
    }
  }
  return result;
}
function validateInitOptions(options) {
  return validateAndNormalize(options, INIT_OPTIONS_SCHEMA);
}
function createSchema(properties) {
  return Object.freeze(Object.assign({}, properties));
}
function getLastValidation() {
  return _lastValidation ? Object.assign({}, _lastValidation) : null;
}
function getInitSchema() {
  return Object.assign({}, INIT_OPTIONS_SCHEMA);
}
function formatErrors(errors) {
  return errors.map((e) => `[${e.code}] ${e.path}: ${e.message}`).join("\n");
}
function getMetrics() {
  return Object.assign({}, _metrics, { successRate: _metrics.validations > 0 ? Math.round(_metrics.passed / _metrics.validations * 100) : 100 });
}
function healthCheck() {
  const checks = { operational: true, lowFailureRate: _metrics.validations === 0 || _metrics.failed / _metrics.validations < 0.5, fewWarnings: _metrics.warnings < 100 };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 3 ? "HEALTHY" : "DEGRADED", score: `${passed}/3`, checks, metrics: getMetrics(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, schemaProperties: Object.keys(INIT_OPTIONS_SCHEMA), metrics: getMetrics(), timestamp: Date.now() };
}
var config_validator_default = { VERSION, MODULE_ID, validate, validateAndNormalize, validateInitOptions, INIT_OPTIONS_SCHEMA, createSchema, getLastValidation, getInitSchema, formatErrors, getMetrics, healthCheck, info };
export {
  INIT_OPTIONS_SCHEMA,
  MODULE_ID,
  VERSION,
  createSchema,
  config_validator_default as default,
  formatErrors,
  getInitSchema,
  getLastValidation,
  getMetrics,
  healthCheck,
  info,
  validate,
  validateAndNormalize,
  validateInitOptions
};
