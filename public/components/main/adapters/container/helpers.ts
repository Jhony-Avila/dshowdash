// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.0.0-UNIFIED-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-helpers
// PURPOSE: Container Helpers - Funções Auxiliares
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   validateVariant() — exported function
//   validateTitle() — exported function
//   debounce() — exported function
//   throttle() — exported function
//   generateId() — exported function
//   deepClone() — exported function
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

export const VERSION = '8.0.0-UNIFIED';
export const MODULE_ID = 'container-helpers';

const VALID_VARIANTS = ['default', 'primary', 'secondary', 'tertiary', 'minimal', 'card', 'panel', 'modal', 'floating'];

export function validateVariant(variant: string) {
  if (!variant || typeof variant !== 'string') return 'default';
  const normalized = variant.toLowerCase().trim();
  return VALID_VARIANTS.includes(normalized) ? normalized : 'default';
}

export function validateTitle(title: string) {
  if (!title || typeof title !== 'string') return '';
  return title.replace(/[<>]/g, '').trim().slice(0, 100);
}

export function debounce(fn: (...args: unknown[]) => void, delay = 100) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: unknown[]) => {
    // @ts-expect-error strict migration — TS2769
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function throttle(fn: (...args: unknown[]) => void, limit = 100) {
  let inThrottle = false;
  return (...args: unknown[]) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export function generateId(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
}

export function deepClone(obj: Record<string, unknown>) {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return { ...obj };
  }
}

export function healthCheck() {
  return {
    status: 'HEALTHY',
    version: VERSION,
    moduleId: MODULE_ID,
    checks: { 
      functionsAvailable: ['validateVariant', 'validateTitle', 'debounce', 'throttle', 'generateId', 'deepClone'],
      validVariants: VALID_VARIANTS
    }
  };
}

export default { validateVariant, validateTitle, debounce, throttle, generateId, deepClone, healthCheck, VERSION, MODULE_ID };
