// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Lazy Loader - Loaders Registry
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   loaders from ../state.js
//
// PROVIDES:
//   registerLoader() — exported function
//   unregisterLoader() — exported function
//   findLoader() — exported function
//   getRegisteredLoaders() — exported function
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

import { loaders } from '../state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '4.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'overlay-layer.core.lazy-loader.loaders.registry';

export function registerLoader(typeOrPattern: DynObj, loader: DynObj) {
  if (!typeOrPattern) {
    return { ok: false, error: 'invalid-type' };
  }
  
  if (typeof loader !== 'function') {
    return { ok: false, error: 'loader-must-be-function' };
  }
  
  loaders.set(typeOrPattern, {
    loader,
    pattern: typeOrPattern instanceof RegExp ? typeOrPattern : null
  });
  
  return { ok: true, type: typeOrPattern.toString() };
}

export function unregisterLoader(typeOrPattern: DynObj) {
  const deleted = loaders.delete(typeOrPattern);
  return { ok: deleted };
}

export function findLoader(type: DynObj) {
  if (loaders.has(type)) {
    return loaders.get(type).loader;
  }
  
  for (const [key, value] of loaders) {
    if (value.pattern && value.pattern.test(type)) {
      return value.loader;
    }
  }
  
  return null;
}

export function getRegisteredLoaders() {
  const result = [];
  
  for (const [key, value] of loaders) {
    result.push({
      type: key.toString(),
      isPattern: !!value.pattern
    });
  }
  
  return result;
}
