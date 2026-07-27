const VERSION = "1.0.0-ELEVATION";
const MODULE_ID = "overlay-kernel:manifest";
const OVERLAY_PRIORITY = Object.freeze({
  CRITICAL: 100,
  // Login modal, error boundaries
  HIGH: 75,
  // Confirmações críticas, alerts
  NORMAL: 50,
  // Modais padrão, drawers
  LOW: 25,
  // Toasts, tooltips
  BACKGROUND: 10
  // Preloaders, loading states
});
const ALLOWED_MODES = Object.freeze({
  ALL: ["NORMAL", "DEGRADED", "MAINTENANCE", "RECOVERY"],
  NORMAL_ONLY: ["NORMAL"],
  NORMAL_DEGRADED: ["NORMAL", "DEGRADED"],
  CRITICAL_ALWAYS: ["NORMAL", "DEGRADED", "MAINTENANCE", "RECOVERY", "FAILED"]
});
const PERMISSION_TRIGGERS = Object.freeze({
  NONE: "none",
  // Sem verificação (público)
  AUTH_REQUIRED: "auth:required",
  // Requer autenticação
  ROLE_ADMIN: "role:admin",
  // Requer role admin
  ROLE_USER: "role:user",
  // Requer role user
  CAPABILITY: "capability:check",
  // Verifica capability específica
  CUSTOM: "custom:gate"
  // Gate customizado
});
const OVERLAY_MANIFEST = Object.freeze({
  version: VERSION,
  manifestVersion: "1.0.0",
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
      id: "login-modal",
      type: "modal",
      priority: OVERLAY_PRIORITY.CRITICAL,
      blocking: true,
      persist: true,
      requiresAuth: false,
      permissionTrigger: PERMISSION_TRIGGERS.NONE,
      allowedModes: ALLOWED_MODES.CRITICAL_ALWAYS,
      healthWeight: 10,
      closeOnEscape: false,
      closeOnBackdrop: false,
      description: "Modal de autentica\xE7\xE3o - sempre permitido"
    },
    {
      id: "error-modal",
      type: "modal",
      priority: OVERLAY_PRIORITY.CRITICAL,
      blocking: true,
      persist: true,
      requiresAuth: false,
      permissionTrigger: PERMISSION_TRIGGERS.NONE,
      allowedModes: ALLOWED_MODES.CRITICAL_ALWAYS,
      healthWeight: 10,
      closeOnEscape: true,
      closeOnBackdrop: false,
      description: "Modal de erro cr\xEDtico"
    },
    {
      id: "confirmation-modal",
      type: "modal",
      priority: OVERLAY_PRIORITY.HIGH,
      blocking: true,
      persist: false,
      requiresAuth: true,
      permissionTrigger: PERMISSION_TRIGGERS.AUTH_REQUIRED,
      allowedModes: ALLOWED_MODES.NORMAL_DEGRADED,
      healthWeight: 5,
      closeOnEscape: true,
      closeOnBackdrop: false,
      description: "Modal de confirma\xE7\xE3o de a\xE7\xF5es"
    },
    {
      id: "standard-modal",
      type: "modal",
      priority: OVERLAY_PRIORITY.NORMAL,
      blocking: true,
      persist: false,
      requiresAuth: true,
      permissionTrigger: PERMISSION_TRIGGERS.AUTH_REQUIRED,
      allowedModes: ALLOWED_MODES.NORMAL_DEGRADED,
      healthWeight: 3,
      closeOnEscape: true,
      closeOnBackdrop: true,
      description: "Modal padr\xE3o da aplica\xE7\xE3o"
    },
    {
      id: "drawer",
      type: "drawer",
      priority: OVERLAY_PRIORITY.NORMAL,
      blocking: false,
      persist: false,
      requiresAuth: true,
      permissionTrigger: PERMISSION_TRIGGERS.AUTH_REQUIRED,
      allowedModes: ALLOWED_MODES.NORMAL_ONLY,
      healthWeight: 2,
      closeOnEscape: true,
      closeOnBackdrop: true,
      description: "Drawer lateral"
    },
    {
      id: "admin-drawer",
      type: "drawer",
      priority: OVERLAY_PRIORITY.NORMAL,
      blocking: false,
      persist: false,
      requiresAuth: true,
      permissionTrigger: PERMISSION_TRIGGERS.ROLE_ADMIN,
      allowedModes: ALLOWED_MODES.NORMAL_ONLY,
      healthWeight: 2,
      description: "Drawer administrativo"
    },
    {
      id: "toast",
      type: "toast",
      priority: OVERLAY_PRIORITY.LOW,
      blocking: false,
      persist: false,
      requiresAuth: false,
      permissionTrigger: PERMISSION_TRIGGERS.NONE,
      allowedModes: ALLOWED_MODES.ALL,
      healthWeight: 1,
      autoClose: true,
      autoCloseDelay: 5e3,
      description: "Notifica\xE7\xE3o toast"
    },
    {
      id: "loading",
      type: "loading",
      priority: OVERLAY_PRIORITY.BACKGROUND,
      blocking: true,
      persist: false,
      requiresAuth: false,
      permissionTrigger: PERMISSION_TRIGGERS.NONE,
      allowedModes: ALLOWED_MODES.ALL,
      healthWeight: 1,
      description: "Overlay de carregamento"
    },
    {
      id: "preloader",
      type: "loading",
      priority: OVERLAY_PRIORITY.BACKGROUND,
      blocking: true,
      persist: false,
      requiresAuth: false,
      permissionTrigger: PERMISSION_TRIGGERS.NONE,
      allowedModes: ALLOWED_MODES.CRITICAL_ALWAYS,
      healthWeight: 1,
      description: "Preloader inicial da aplica\xE7\xE3o"
    }
  ]
});
function getTypeById(typeId) {
  const types = OVERLAY_MANIFEST.types;
  for (let i = 0; i < types.length; i++) {
    if (types[i].id === typeId) return types[i];
  }
  return null;
}
function getTypesByCategory(type) {
  const types = OVERLAY_MANIFEST.types;
  const result = [];
  for (let i = 0; i < types.length; i++) {
    if (types[i].type === type) result.push(types[i]);
  }
  return result;
}
function getCriticalTypes() {
  const types = OVERLAY_MANIFEST.types;
  const result = [];
  for (let i = 0; i < types.length; i++) {
    if (types[i].priority >= OVERLAY_PRIORITY.CRITICAL) result.push(types[i]);
  }
  return result;
}
function getTypesForMode(mode) {
  const types = OVERLAY_MANIFEST.types;
  const result = [];
  for (let i = 0; i < types.length; i++) {
    if (types[i].allowedModes && types[i].allowedModes.indexOf(mode) !== -1) {
      result.push(types[i]);
    }
  }
  return result;
}
function isTypeAllowedInMode(typeId, mode) {
  const typeDef = getTypeById(typeId);
  if (!typeDef) return false;
  if (!typeDef.allowedModes) return true;
  return typeDef.allowedModes.indexOf(mode) !== -1;
}
function requiresAuth(typeId) {
  const typeDef = getTypeById(typeId);
  return typeDef ? typeDef.requiresAuth === true : true;
}
function getPermissionTrigger(typeId) {
  const typeDef = getTypeById(typeId);
  return typeDef ? typeDef.permissionTrigger : PERMISSION_TRIGGERS.AUTH_REQUIRED;
}
function getPriority(typeId) {
  const typeDef = getTypeById(typeId);
  return typeDef ? typeDef.priority : OVERLAY_MANIFEST.global.defaultPriority;
}
function isBlocking(typeId) {
  const typeDef = getTypeById(typeId);
  return typeDef ? typeDef.blocking : OVERLAY_MANIFEST.global.defaultBlocking;
}
function getTotalHealthWeight() {
  const types = OVERLAY_MANIFEST.types;
  let total = 0;
  for (let i = 0; i < types.length; i++) {
    total += types[i].healthWeight || 0;
  }
  return total;
}
function getAllTypeIds() {
  const types = OVERLAY_MANIFEST.types;
  const result = [];
  for (let i = 0; i < types.length; i++) {
    result.push(types[i].id);
  }
  return result;
}
function getGlobalConfig() {
  return Object.assign({}, OVERLAY_MANIFEST.global);
}
function validateManifest() {
  const errors = [];
  const types = OVERLAY_MANIFEST.types;
  const ids = {};
  for (let i = 0; i < types.length; i++) {
    const t = types[i];
    if (!t.id) errors.push(`Type at index ${i} missing id`);
    if (ids[t.id]) errors.push(`Duplicate type id: ${t.id}`);
    ids[t.id] = true;
    if (!t.type) errors.push(`Type ${t.id} missing type`);
    if (typeof t.priority !== "number") errors.push(`Type ${t.id} missing priority`);
  }
  return {
    valid: errors.length === 0,
    errors,
    typeCount: types.length,
    criticalCount: getCriticalTypes().length,
    totalHealthWeight: getTotalHealthWeight()
  };
}
function healthCheck() {
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
    if (checks[keys[i]]) passed++;
  }
  return {
    status: passed === keys.length ? "HEALTHY" : "DEGRADED",
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
function info() {
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
var overlay_manifest_default = {
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
export {
  ALLOWED_MODES,
  MODULE_ID,
  OVERLAY_MANIFEST,
  OVERLAY_PRIORITY,
  PERMISSION_TRIGGERS,
  VERSION,
  overlay_manifest_default as default,
  getAllTypeIds,
  getCriticalTypes,
  getGlobalConfig,
  getPermissionTrigger,
  getPriority,
  getTotalHealthWeight,
  getTypeById,
  getTypesByCategory,
  getTypesForMode,
  healthCheck,
  info,
  isBlocking,
  isTypeAllowedInMode,
  requiresAuth,
  validateManifest
};
