// Deep Clone Utility
// @version 2.6.0-MODULAR
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.6.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained)
// PROVIDES: deepClone(obj)
// BROWSER-APIS: None
'use strict';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.module.utils.deep-clone';

export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(function(item: T) { return deepClone(item); }) as T;
  }
  const clone: Record<string, unknown> = {};
  for (const key in obj) {
    if ((obj as Record<string, unknown>).hasOwnProperty(key)) {
      clone[key] = deepClone((obj as Record<string, unknown>)[key]);
    }
  }
  return clone as T;
}

export default { deepClone };
