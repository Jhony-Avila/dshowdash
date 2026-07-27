// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: validation
// PURPOSE: Main module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SCHEMAS, STORAGE_KEYS from ./constants.js
//   metrics from ./state.js
//
// PROVIDES:
//   validateSchema() — exported function
//   getSchemaForKey() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
/**
 * Persistence Sync - Validation
 * @module persistence-sync/validation
 */
'use strict';

import { SCHEMAS, STORAGE_KEYS } from './constants.js';
import { metrics } from './state.js';

export const VERSION = '1.1.0-ENTERPRISE';
export const MODULE_ID = 'main.domain.features.persistence-sync.validation';

function checkType(value: unknown, expectedType: unknown) {
  if (expectedType === 'null') return value === null;
  if (expectedType === 'array') return Array.isArray(value);
  return typeof value === expectedType;
}

export function validateSchema(data: Record<string, unknown>, schemaName: string) {
  const schema = (SCHEMAS as Record<string, { required: string[]; types: Record<string, unknown> }>)[schemaName];
  if (!schema) return { valid: true };
  
  const errors = [];
  
  if (schema.required) {
    for (let i = 0; i < schema.required.length; i++) {
      const field = schema.required[i];
      if (data[field] === undefined) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }
  
  if (schema.types && data) {
    for (const fieldName in schema.types) {
      if (schema.types.hasOwnProperty(fieldName) && data[fieldName] !== undefined) {
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

export function getSchemaForKey(key: string) {
  if (key === STORAGE_KEYS.NAVIGATION_STATE) return 'navigation';
  if (key === STORAGE_KEYS.CONTAINER_STATE) return 'containers';
  if (key === STORAGE_KEYS.USER_PREFERENCES) return 'preferences';
  return null;
}
