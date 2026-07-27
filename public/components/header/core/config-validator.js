import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { ConfigError } from "./errors/ConfigError.js";
const VERSION = "1.1.0-ES6";
const MODULE_ID = "header/core/config-validator";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _debugEnabled = () => {
  const cfg = _getPort("config");
  return cfg && cfg.app && cfg.app.debug ? true : false;
};
const _log = function(level, ...rest) {
  const args = Array.prototype.slice.call(arguments, 1);
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === "error") {
    if (logger.error) logger.error(prefix, args.join(" "));
    return;
  }
  if (level === "warn") {
    if (logger.warn) logger.warn(prefix, args.join(" "));
    return;
  }
  if (level === "info") {
    if (logger.info) logger.info(prefix, args.join(" "));
    return;
  }
  if (_debugEnabled() && logger.debug) logger.debug(prefix, args.join(" "));
};
const CONFIG_SCHEMA = {
  id: { type: "string", required: true },
  version: { type: "string", required: true },
  name: { type: "string", required: false, default: "Header System" },
  description: { type: "string", required: false, default: "" },
  features: {
    type: "object",
    required: false,
    default: {},
    properties: {
      routerIntegration: { type: "boolean", default: true },
      globalStateIntegration: { type: "boolean", default: true },
      eventBusIntegration: { type: "boolean", default: true },
      appShellIntegration: { type: "boolean", default: true },
      telemetryEnabled: { type: "boolean", default: true },
      circuitBreakerEnabled: { type: "boolean", default: true },
      pollingEnabled: { type: "boolean", default: true },
      accessibilityEnabled: { type: "boolean", default: true }
    }
  },
  api: {
    type: "object",
    required: false,
    default: {},
    properties: {
      healthEndpoint: { type: "string", default: "/api/health/status.php" },
      healthWithCredentials: { type: "boolean", default: false },
      alertsEndpoint: { type: "string", default: "/api/alerts/header-alerts.php" },
      timeout: { type: "number", default: 6e3, min: 1e3, max: 3e4 },
      retries: { type: "number", default: 1, min: 0, max: 5 }
    }
  },
  polling: {
    type: "object",
    required: false,
    default: {},
    properties: {
      healthInterval: { type: "number", default: 18e5, min: 5e3, max: 36e5 },
      alertsInterval: { type: "number", default: 2e6, min: 5e3, max: 36e5 },
      networkQualityInterval: { type: "number", default: 2e6, min: 5e3, max: 36e5 },
      syncDebounceInterval: { type: "number", default: 2e6, min: 100, max: 1e4 },
      backoffSequence: { type: "array", default: [5e3, 1e4, 2e4, 4e4, 6e4] }
    }
  },
  network: {
    type: "object",
    required: false,
    default: {},
    properties: {
      rttSamples: { type: "number", default: 3, min: 1, max: 20 },
      rttThresholds: {
        type: "object",
        default: { online: 120, degraded: 350 },
        properties: {
          online: { type: "number", default: 120, min: 10, max: 1e3 },
          degraded: { type: "number", default: 350, min: 50, max: 2e3 }
        }
      },
      debounce: { type: "number", default: 200, min: 50, max: 1e3 }
    }
  },
  fallback: {
    type: "object",
    required: false,
    default: {},
    properties: {
      debounce: { type: "number", default: 300, min: 100, max: 2e3 },
      autoHide: { type: "boolean", default: true },
      autoHideDuration: { type: "number", default: 8e3, min: 1e3, max: 3e4 }
    }
  },
  refresh: {
    type: "object",
    required: false,
    default: {},
    properties: {
      throttle: { type: "number", default: 5e3, min: 1e3, max: 3e4 },
      fallbackTimeout: { type: "number", default: 1200, min: 500, max: 1e4 }
    }
  },
  ui: {
    type: "object",
    required: false,
    default: {},
    properties: {
      tooltipDelayShow: { type: "number", default: 250, min: 0, max: 2e3 },
      tooltipDelayHide: { type: "number", default: 150, min: 0, max: 2e3 },
      scrollThreshold: { type: "number", default: 50, min: 0, max: 500 }
    }
  },
  accessibility: {
    type: "object",
    required: false,
    default: {},
    properties: {
      announceDebounce: { type: "number", default: 800, min: 100, max: 5e3 },
      announceExpire: { type: "number", default: 3e5, min: 1e4, max: 6e5 },
      rovingTabindexEnabled: { type: "boolean", default: true },
      keyboardShortcutsEnabled: { type: "boolean", default: true }
    }
  },
  telemetry: {
    type: "object",
    required: false,
    default: {},
    properties: {
      enabled: { type: "boolean", default: true },
      sampleRate: { type: "number", default: 0.1, min: 0, max: 1 }
    }
  },
  defaults: {
    type: "object",
    required: false,
    default: {},
    properties: {
      locale: { type: "string", default: "pt-BR" },
      environment: { type: "string", default: "production", enum: ["development", "staging", "production"] },
      debug: { type: "boolean", default: false },
      containerSelector: { type: "string", default: "#header-container" }
    }
  }
};
function validateType(value, expectedType) {
  if (expectedType === "array") return Array.isArray(value);
  return typeof value === expectedType;
}
function validateRange(value, min, max) {
  if (typeof value !== "number") return true;
  if (min !== void 0 && value < min) return false;
  if (max !== void 0 && value > max) return false;
  return true;
}
function validateEnum(value, allowedValues) {
  if (!allowedValues || !Array.isArray(allowedValues)) return true;
  return allowedValues.indexOf(value) !== -1;
}
function _validateField(value, schema, path) {
  let errors = [];
  let warnings = [];
  if (value === void 0 || value === null) {
    if (schema.required) errors.push(ConfigError.missingField(path));
    return { errors, warnings, value: schema.default };
  }
  if (!validateType(value, schema.type)) {
    errors.push(ConfigError.invalidType(path, schema.type, value));
    return { errors, warnings, value: schema.default };
  }
  if (schema.type === "number" && !validateRange(value, schema.min, schema.max)) {
    warnings.push({ field: path, message: "Valor fora do range recomendado", value, min: schema.min, max: schema.max });
  }
  if (schema.enum && !validateEnum(value, schema.enum)) {
    errors.push(ConfigError.invalidValue(path, value, schema.enum));
    return { errors, warnings, value: schema.default };
  }
  if (schema.type === "object" && schema.properties) {
    const validatedObject = {};
    Object.keys(schema.properties).forEach((key) => {
      const propSchema = schema.properties[key];
      const propValue = value[key];
      const propPath = `${path}.${key}`;
      const result = _validateField(propValue, propSchema, propPath);
      errors = errors.concat(result.errors);
      warnings = warnings.concat(result.warnings);
      validatedObject[key] = result.value !== void 0 ? result.value : propSchema.default;
    });
    return { errors, warnings, value: validatedObject };
  }
  return { errors, warnings, value };
}
function validate(config) {
  _initPorts();
  let errors = [];
  let warnings = [];
  const validatedConfig = {};
  if (!config || typeof config !== "object") {
    errors.push(ConfigError.invalidType("config", "object", config));
    return { valid: false, errors, warnings, config: _getDefaultConfig() };
  }
  Object.keys(CONFIG_SCHEMA).forEach((key) => {
    const schema = CONFIG_SCHEMA[key];
    const value = config[key];
    const result = _validateField(value, schema, key);
    errors = errors.concat(result.errors);
    warnings = warnings.concat(result.warnings);
    validatedConfig[key] = result.value !== void 0 ? result.value : schema.default;
  });
  Object.keys(config).forEach((key) => {
    if (!CONFIG_SCHEMA[key]) {
      validatedConfig[key] = config[key];
      warnings.push({ field: key, message: "Campo desconhecido no schema", value: typeof config[key] });
    }
  });
  const valid = errors.length === 0;
  if (errors.length > 0) {
    _log("error", "Config validation falhou:", errors.length, "erros");
    errors.forEach((e) => {
      _log("error", "-", e.message || e);
    });
  }
  if (warnings.length > 0) {
    _log("warn", "Config validation warnings:", warnings.length);
    warnings.forEach((w) => {
      _log("warn", "-", `${w.field}:`, w.message);
    });
  }
  return { valid, errors, warnings, config: validatedConfig };
}
function _getDefaultConfig() {
  const defaultConfig = {};
  Object.keys(CONFIG_SCHEMA).forEach((key) => {
    const schema = CONFIG_SCHEMA[key];
    if (schema.type === "object" && schema.properties) {
      defaultConfig[key] = {};
      Object.keys(schema.properties).forEach((propKey) => {
        defaultConfig[key][propKey] = schema.properties[propKey].default;
      });
    } else {
      defaultConfig[key] = schema.default;
    }
  });
  return defaultConfig;
}
function validateAndApply(config) {
  const result = validate(config);
  if (!result.valid) _log("warn", "Usando config com valores default para campos inv\xE1lidos");
  return result.config;
}
function getDefaultConfig() {
  return _getDefaultConfig();
}
function getSchema() {
  return JSON.parse(JSON.stringify(CONFIG_SCHEMA));
}
function validateFieldByPath(fieldPath, value) {
  const parts = fieldPath.split(".");
  let schema = CONFIG_SCHEMA;
  for (let i = 0; i < parts.length; i++) {
    if (schema[parts[i]]) {
      schema = schema[parts[i]];
      if (schema.properties && i < parts.length - 1) schema = schema.properties;
    } else {
      return { valid: false, error: `Campo n\xE3o encontrado no schema: ${fieldPath}` };
    }
  }
  const result = _validateField(value, schema, fieldPath);
  return { valid: result.errors.length === 0, errors: result.errors, warnings: result.warnings, value: result.value };
}
function healthCheck() {
  const checks = { schemaAvailable: Object.keys(CONFIG_SCHEMA).length > 0, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : "DEGRADED",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    schemaFields: Object.keys(CONFIG_SCHEMA).length,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    schemaFields: Object.keys(CONFIG_SCHEMA),
    portsInitialized: Ports.isInitialized(),
    healthCheck: healthCheck()
  };
}
var config_validator_default = {
  VERSION,
  MODULE_ID,
  validate,
  validateAndApply,
  validateFieldByPath,
  getDefaultConfig,
  getSchema,
  healthCheck,
  info
};
export {
  CONFIG_SCHEMA,
  MODULE_ID,
  VERSION,
  config_validator_default as default,
  getDefaultConfig,
  getPorts,
  getSchema,
  healthCheck,
  info,
  injectPorts,
  validate,
  validateAndApply,
  validateFieldByPath
};
