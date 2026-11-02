// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: config-loader-deepmerge
// PURPOSE: Config Loader - Deep Merge Utility v2.1.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getVersion() — exported function
//   isPlainObject() — exported function
//   cloneValue() — exported function
//   deepMerge() — exported function
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

export const VERSION = '2.1.0-ENTERPRISE';
export const MODULE_ID = 'config-loader-deepmerge';

export function getVersion() {
  return VERSION;
}

// Verifica se é objeto puro (não array, não null)
export function isPlainObject(obj: unknown): obj is Record<string, unknown> {
  return obj !== null && typeof obj === 'object' && !Array.isArray(obj) && obj.constructor === Object;
}

// Clona valor de forma segura
export function cloneValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(item => cloneValue(item));
  }
  if (isPlainObject(value)) {
    const cloned: Record<string, unknown> = {};
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        cloned[key] = cloneValue((value as Record<string, unknown>)[key]);
      }
    }
    return cloned;
  }
  return value;
}

// Merge profundo de dois objetos
function deepMergeTwo(target: unknown, source: unknown): Record<string, unknown> {
  if (!isPlainObject(target) || !isPlainObject(source)) {
    return cloneValue(source !== undefined ? source : target) as Record<string, unknown>;
  }

  const result = cloneValue(target) as Record<string, unknown>;

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = result[key];

      if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
        result[key] = deepMergeTwo(targetValue, sourceValue);
      } else if (sourceValue !== undefined) {
        result[key] = cloneValue(sourceValue);
      }
    }
  }

  return result;
}

// Merge múltiplos objetos em ordem (último tem prioridade)
export function deepMerge(...objects: unknown[]): Record<string, unknown> {
  if (objects.length === 0) {
    return {};
  }
  if (objects.length === 1) {
    return (cloneValue(objects[0]) as Record<string, unknown>) || {};
  }

  let result = {};
  for (const obj of objects) {
    if (obj && isPlainObject(obj)) {
      result = deepMergeTwo(result, obj);
    }
  }
  return result;
}
