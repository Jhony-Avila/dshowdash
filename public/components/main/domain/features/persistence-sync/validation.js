import { SCHEMAS, STORAGE_KEYS } from "./constants.js";
import { metrics } from "./state.js";
const VERSION = "1.1.0-ENTERPRISE";
const MODULE_ID = "main.domain.features.persistence-sync.validation";
function checkType(value, expectedType) {
  if (expectedType === "null") return value === null;
  if (expectedType === "array") return Array.isArray(value);
  return typeof value === expectedType;
}
function validateSchema(data, schemaName) {
  const schema = SCHEMAS[schemaName];
  if (!schema) return { valid: true };
  const errors = [];
  if (schema.required) {
    for (let i = 0; i < schema.required.length; i++) {
      const field = schema.required[i];
      if (data[field] === void 0) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }
  if (schema.types && data) {
    for (const fieldName in schema.types) {
      if (schema.types.hasOwnProperty(fieldName) && data[fieldName] !== void 0) {
        const expectedType = schema.types[fieldName];
        const actualValue = data[fieldName];
        let isValid = false;
        if (Array.isArray(expectedType)) {
          for (let j = 0; j < expectedType.length; j++) {
            if (checkType(actualValue, expectedType[j])) {
              isValid = true;
              break;
            }
          }
        } else {
          isValid = checkType(actualValue, expectedType);
        }
        if (!isValid) {
          errors.push(`Invalid type for ${fieldName}: expected ${expectedType}`);
        }
      }
    }
  }
  if (errors.length > 0) {
    metrics.validationErrors++;
  }
  return { valid: errors.length === 0, errors };
}
function getSchemaForKey(key) {
  if (key === STORAGE_KEYS.NAVIGATION_STATE) return "navigation";
  if (key === STORAGE_KEYS.CONTAINER_STATE) return "containers";
  if (key === STORAGE_KEYS.USER_PREFERENCES) return "preferences";
  return null;
}
export {
  MODULE_ID,
  VERSION,
  getSchemaForKey,
  validateSchema
};
