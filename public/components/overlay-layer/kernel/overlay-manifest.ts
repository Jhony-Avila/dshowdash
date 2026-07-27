
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ELEVATION)
// ═══════════════════════════════════════════════════════════════
// MODULE: overlay-kernel:manifest
// PURPOSE: Overlay Manifest - Declarative Overlay Types Definition
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   OVERLAY_PRIORITY — exported value
//   ALLOWED_MODES — exported value
//   PERMISSION_TRIGGERS — exported value
//   OVERLAY_MANIFEST — exported value
//   getTypeById() — exported function
//   getTypesByCategory() — exported function
//   getCriticalTypes() — exported function
//   getTypesForMode() — exported function
//   isTypeAllowedInMode() — exported function
//   requiresAuth() — exported function
//   getPermissionTrigger() — exported function
//   getPriority() — exported function
//   isBlocking() — exported function
//   getTotalHealthWeight() — exported function
//   getAllTypeIds() — exported function
//   getGlobalConfig() — exported function
//   validateManifest() — exported function
//   healthCheck() — exported function
//   info() — exported function
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.0.0-ELEVATION';
export const MODULE_ID = 'overlay-kernel:manifest';

// Prioridades de overlay (maior = mais prioritário)
export const OVERLAY_PRIORITY = Object.freeze({
  CRITICAL: 100,    // Login modal, error boundaries
  HIGH: 75,         // Confirmações críticas, alerts
  NORMAL: 50,       // Modais padrão, drawers
  LOW: 25,          // Toasts, tooltips
  BACKGROUND: 10    // Preloaders, loading states
});

// Modos de operação permitidos por tipo
export const ALLOWED_MODES = Object.freeze({
  ALL: ['NORMAL', 'DEGRADED', 'MAINTENANCE', 'RECOVERY'],
  NORMAL_ONLY: ['NORMAL'],
  NORMAL_DEGRADED: ['NORMAL', 'DEGRADED'],
  CRITICAL_ALWAYS: ['NORMAL', 'DEGRADED', 'MAINTENANCE', 'RECOVERY', 'FAILED']
});

// Triggers de permissão UARPS
export const PERMISSION_TRIGGERS = Object.freeze({
  NONE: 'none',                      // Sem verificação (público)
  AUTH_REQUIRED: 'auth:required',    // Requer autenticação
  ROLE_ADMIN: 'role:admin',          // Requer role admin
  ROLE_USER: 'role:user',            // Requer role user
  CAPABILITY: 'capability:check',    // Verifica capability específica
  CUSTOM: 'custom:gate'              // Gate customizado
});

// Manifest declarativo de overlays
export const OVERLAY_MANIFEST = Object.freeze({
  version: VERSION,
  manifestVersion: '1.0.0',
  
  // Configurações globais
  global: {
    defaultPriority: OVERLAY_PRIORITY.NORMAL,
    defaultBlocking: false,
    defaultPersist: false,
    maxStackDepth: 10,
    autoCloseOnNavigation: true,
    respectReducedMotion: true
  },
  
  // Definição declarativa dos tipos de overlay
  types: [
    {
      id: 'login-modal',
      type: 'modal',
      priority: OVERLAY_PRIORITY.CRITICAL,
      blocking: true,
      persist: true,
      requiresAuth: false,
      permissionTrigger: PERMISSION_TRIGGERS.NONE,
      allowedModes: ALLOWED_MODES.CRITICAL_ALWAYS,
      healthWeight: 10,
      closeOnEscape: false,
      closeOnBackdrop: false,
      description: 'Modal de autenticação - sempre permitido'
    },
    {
      id: 'error-modal',
      type: 'modal',
      priority: OVERLAY_PRIORITY.CRITICAL,
      blocking: true,
      persist: true,
      requiresAuth: false,
      permissionTrigger: PERMISSION_TRIGGERS.NONE,
      allowedModes: ALLOWED_MODES.CRITICAL_ALWAYS,
      healthWeight: 10,
      closeOnEscape: true,
      closeOnBackdrop: false,
      description: 'Modal de erro crítico'
    },
    {
      id: 'confirmation-modal',
      type: 'modal',
      priority: OVERLAY_PRIORITY.HIGH,
      blocking: true,
      persist: false,
      requiresAuth: true,
      permissionTrigger: PERMISSION_TRIGGERS.AUTH_REQUIRED,
      allowedModes: ALLOWED_MODES.NORMAL_DEGRADED,
      healthWeight: 5,
      closeOnEscape: true,
      closeOnBackdrop: false,
      description: 'Modal de confirmação de ações'
    },
    {
      id: 'standard-modal',
      type: 'modal',
      priority: OVERLAY_PRIORITY.NORMAL,
      blocking: true,
      persist: false,
      requiresAuth: true,
      permissionTrigger: PERMISSION_TRIGGERS.AUTH_REQUIRED,
      allowedModes: ALLOWED_MODES.NORMAL_DEGRADED,
      healthWeight: 3,
      closeOnEscape: true,
      closeOnBackdrop: true,
      description: 'Modal padrão da aplicação'
    },
    {
      id: 'drawer',
      type: 'drawer',
      priority: OVERLAY_PRIORITY.NORMAL,
      blocking: false,
      persist: false,
      requiresAuth: true,
      permissionTrigger: PERMISSION_TRIGGERS.AUTH_REQUIRED,
      allowedModes: ALLOWED_MODES.NORMAL_ONLY,
      healthWeight: 2,
      closeOnEscape: true,
      closeOnBackdrop: true,
      description: 'Drawer lateral'
    },
    {
      id: 'admin-drawer',
      type: 'drawer',
      priority: OVERLAY_PRIORITY.NORMAL,
      blocking: false,
      persist: false,
      requiresAuth: true,
      permissionTrigger: PERMISSION_TRIGGERS.ROLE_ADMIN,
      allowedModes: ALLOWED_MODES.NORMAL_ONLY,
      healthWeight: 2,
      description: 'Drawer administrativo'
    },
    {
      id: 'toast',
      type: 'toast',
      priority: OVERLAY_PRIORITY.LOW,
      blocking: false,
      persist: false,
      requiresAuth: false,
      permissionTrigger: PERMISSION_TRIGGERS.NONE,
      allowedModes: ALLOWED_MODES.ALL,
      healthWeight: 1,
      autoClose: true,
      autoCloseDelay: 5000,
      description: 'Notificação toast'
    },
    {
      id: 'loading',
      type: 'loading',
      priority: OVERLAY_PRIORITY.BACKGROUND,
      blocking: true,
      persist: false,
      requiresAuth: false,
      permissionTrigger: PERMISSION_TRIGGERS.NONE,
      allowedModes: ALLOWED_MODES.ALL,
      healthWeight: 1,
      description: 'Overlay de carregamento'
    },
    {
      id: 'preloader',
      type: 'loading',
      priority: OVERLAY_PRIORITY.BACKGROUND,
      blocking: true,
      persist: false,
      requiresAuth: false,
      permissionTrigger: PERMISSION_TRIGGERS.NONE,
      allowedModes: ALLOWED_MODES.CRITICAL_ALWAYS,
      healthWeight: 1,
      description: 'Preloader inicial da aplicação'
    }
  ]
});

// ============================================================================
// QUERIES
// ============================================================================

export function getTypeById(typeId: string) {
  const types = OVERLAY_MANIFEST.types;
  for (let i = 0; i < types.length; i++) {
    if (types[i].id === typeId) return types[i];
  }
  return null;
}

export function getTypesByCategory(type: DynObj) {
  const types = OVERLAY_MANIFEST.types;
  const result = [];
  for (let i = 0; i < types.length; i++) {
    if (types[i].type === type) result.push(types[i]);
  }
  return result;
}

export function getCriticalTypes() {
  const types = OVERLAY_MANIFEST.types;
  const result = [];
  for (let i = 0; i < types.length; i++) {
    if (types[i].priority >= OVERLAY_PRIORITY.CRITICAL) result.push(types[i]);
  }
  return result;
}

export function getTypesForMode(mode: DynObj) {
  const types = OVERLAY_MANIFEST.types;
  const result = [];
  for (let i = 0; i < types.length; i++) {
    if (types[i].allowedModes && types[i].allowedModes.indexOf(mode) !== -1) {
      result.push(types[i]);
    }
  }
  return result;
}

export function isTypeAllowedInMode(typeId: string, mode: DynObj) {
  const typeDef = getTypeById(typeId);
  if (!typeDef) return false;
  if (!typeDef.allowedModes) return true;
  return typeDef.allowedModes.indexOf(mode) !== -1;
}

export function requiresAuth(typeId: string) {
  const typeDef = getTypeById(typeId);
  return typeDef ? typeDef.requiresAuth === true : true;
}

export function getPermissionTrigger(typeId: string) {
  const typeDef = getTypeById(typeId);
  return typeDef ? typeDef.permissionTrigger : PERMISSION_TRIGGERS.AUTH_REQUIRED;
}

export function getPriority(typeId: string) {
  const typeDef = getTypeById(typeId);
  return typeDef ? typeDef.priority : OVERLAY_MANIFEST.global.defaultPriority;
}

export function isBlocking(typeId: string) {
  const typeDef = getTypeById(typeId);
  return typeDef ? typeDef.blocking : OVERLAY_MANIFEST.global.defaultBlocking;
}

export function getTotalHealthWeight() {
  const types = OVERLAY_MANIFEST.types;
  let total = 0;
  for (let i = 0; i < types.length; i++) {
    total += types[i].healthWeight || 0;
  }
  return total;
}

export function getAllTypeIds() {
  const types = OVERLAY_MANIFEST.types;
  const result = [];
  for (let i = 0; i < types.length; i++) {
    result.push(types[i].id);
  }
  return result;
}

export function getGlobalConfig() {
  return Object.assign({}, OVERLAY_MANIFEST.global);
}

// ============================================================================
// VALIDATION
// ============================================================================

export function validateManifest() {
  const errors = [];
  const types = OVERLAY_MANIFEST.types as readonly any[];
  const ids = {};

  for (let i = 0; i < types.length; i++) {
    const t = types[i];
    if (!t.id) errors.push(`Type at index ${i} missing id`);
    if ((ids as DynObj)[t.id]) errors.push(`Duplicate type id: ${t.id}`);
    (ids as DynObj)[t.id] = true;
    if (!t.type) errors.push(`Type ${t.id} missing type`);
    if (typeof t.priority !== 'number') errors.push(`Type ${t.id} missing priority`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    typeCount: types.length,
    criticalCount: getCriticalTypes().length,
    totalHealthWeight: getTotalHealthWeight()
  };
}

// ============================================================================
// ENTERPRISE API
// ============================================================================

export function healthCheck() {
  const validation = validateManifest();
  const checks = {
    manifestValid: validation.valid,
    hasTypes: OVERLAY_MANIFEST.types.length > 0,
    hasCriticalTypes: getCriticalTypes().length > 0,
    globalConfigValid: !!OVERLAY_MANIFEST.global
  };
  
  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if ((checks as DynObj)[keys[i]]) passed++;
  }
  
  return {
    status: passed === keys.length ? 'HEALTHY' : 'DEGRADED',
    score: passed,
    maxScore: keys.length,
    scoreDisplay: `${passed}/${keys.length}`,
    checks,
    validation,
    moduleId: MODULE_ID,
    version: VERSION,
    timestamp: Date.now()
  };
}

export function info() {
  const validation = validateManifest();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    manifestVersion: OVERLAY_MANIFEST.manifestVersion,
    typeCount: validation.typeCount,
    criticalCount: validation.criticalCount,
    totalHealthWeight: validation.totalHealthWeight,
    typeIds: getAllTypeIds(),
    valid: validation.valid,
    globalConfig: getGlobalConfig(),
    timestamp: Date.now()
  };
}

export default {
  VERSION,
  MODULE_ID,
  OVERLAY_PRIORITY,
  ALLOWED_MODES,
  PERMISSION_TRIGGERS,
  OVERLAY_MANIFEST,
  getTypeById,
  getTypesByCategory,
  getCriticalTypes,
  getTypesForMode,
  isTypeAllowedInMode,
  requiresAuth,
  getPermissionTrigger,
  getPriority,
  isBlocking,
  getTotalHealthWeight,
  getAllTypeIds,
  getGlobalConfig,
  validateManifest,
  healthCheck,
  info
};
