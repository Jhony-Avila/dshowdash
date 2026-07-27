import { BaseError } from "./BaseError.js";
const MODULE_ID = "header.core.errors.ConfigError";
const VERSION = "1.1.0-ES6";
function ConfigError(message, field, expectedType, actualValue, context) {
  BaseError.call(this, message, "CONFIG_ERROR", Object.assign({ field, expectedType, actualValue }, context));
  this.name = "ConfigError";
  this.field = field || "unknown";
  this.expectedType = expectedType || null;
  this.actualValue = actualValue;
}
ConfigError.prototype = Object.create(BaseError.prototype);
ConfigError.prototype.constructor = ConfigError;
ConfigError.missingField = (field) => new ConfigError(`Campo obrigat\xF3rio ausente: ${field}`, field, null, void 0, { reason: "MISSING_FIELD" });
ConfigError.invalidType = (field, expectedType, actualValue) => {
  const actualType = typeof actualValue;
  return new ConfigError(`Tipo inv\xE1lido para ${field}: esperado ${expectedType}, recebido ${actualType}`, field, expectedType, actualValue, { reason: "INVALID_TYPE", actualType });
};
ConfigError.outOfRange = (field, value, min, max) => new ConfigError(`Valor fora do range para ${field}: ${value} (min: ${min}, max: ${max})`, field, "number", value, { reason: "OUT_OF_RANGE", min, max });
ConfigError.invalidValue = (field, value, allowedValues) => new ConfigError(`Valor inv\xE1lido para ${field}: ${value}`, field, "enum", value, { reason: "INVALID_VALUE", allowedValues });
var ConfigError_default = ConfigError;
export {
  ConfigError,
  MODULE_ID,
  VERSION,
  ConfigError_default as default
};
