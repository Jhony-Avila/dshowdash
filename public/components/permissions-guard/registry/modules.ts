// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (4.0.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: permissions-modules-registry
// PURPOSE: Permissions Guard - Modules Registry v4.0.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   modulePolicies — exported value
//   getModulePolicy() — exported function
//   getModuleActionPolicy() — exported function
//   isPublicModule() — exported function
//   getAllModules() — exported function
//   getModulesByLevel() — exported function
//   getEnterprisePanels() — exported function
//   registerModule() — exported function
//   validateModulePolicies() — exported function
//   getVersion() — exported function
//   info() — exported function
//   healthCheck() — exported function
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

export const VERSION = '4.0.0-ENTERPRISE';
export const MODULE_ID = 'permissions-modules-registry';

const modulePolicies: Record<string, Record<string, unknown>> = {
    'header': { roles: ['viewer', 'editor', 'manager', 'admin', 'super_admin'], minLevel: 20 },
    'sidebar': { roles: ['viewer', 'editor', 'manager', 'admin', 'super_admin'], minLevel: 20 },
    'footer': { roles: ['viewer', 'editor', 'manager', 'admin', 'super_admin'], minLevel: 20 },
    'login-modal': { roles: [] as string[], minLevel: 0, public: true },
    'preloader': { roles: [] as string[], minLevel: 0, public: true },
    'app-shell': { roles: [] as string[], minLevel: 0, public: true },
    'main': { roles: ['viewer', 'editor', 'manager', 'admin', 'super_admin'], minLevel: 20 },
    'router': { roles: [] as string[], minLevel: 0, public: true },
    'panel-cards': { roles: ['viewer', 'editor', 'manager', 'admin', 'super_admin'], minLevel: 20, actions: { view: { roles: ['viewer', 'editor', 'manager', 'admin', 'super_admin'], minLevel: 20 }, refresh: { roles: ['editor', 'manager', 'admin', 'super_admin'], minLevel: 40 }, configure: { roles: ['admin', 'super_admin'], minLevel: 80 } } },
    'panel-02': { roles: ['viewer', 'editor', 'manager', 'admin', 'super_admin'], minLevel: 20, actions: { view: { minLevel: 20 }, edit: { minLevel: 40 } } },
    'panel-03': { roles: ['viewer', 'editor', 'manager', 'admin', 'super_admin'], minLevel: 20, actions: { view: { minLevel: 20 }, edit: { minLevel: 40 } } },
    'panel-04': { roles: ['viewer', 'editor', 'manager', 'admin', 'super_admin'], minLevel: 20, actions: { view: { minLevel: 20 }, edit: { minLevel: 40 } } },
    'panel-05': { roles: ['viewer', 'editor', 'manager', 'admin', 'super_admin'], minLevel: 20, actions: { view: { minLevel: 20 }, edit: { minLevel: 40 } } },
    'panel-06': { roles: ['viewer', 'editor', 'manager', 'admin', 'super_admin'], minLevel: 20, actions: { view: { minLevel: 20 }, edit: { minLevel: 40 } } },
    'panel-07': { roles: ['viewer', 'editor', 'manager', 'admin', 'super_admin'], minLevel: 20, actions: { view: { minLevel: 20 }, edit: { minLevel: 40 } } },
    'panel-08': { roles: ['viewer', 'editor', 'manager', 'admin', 'super_admin'], minLevel: 20, actions: { view: { minLevel: 20 }, edit: { minLevel: 40 } } },
    'panel-09': { roles: ['viewer', 'editor', 'manager', 'admin', 'super_admin'], minLevel: 20, actions: { view: { minLevel: 20 }, edit: { minLevel: 40 } } },
    'panel-10': { roles: ['viewer', 'editor', 'manager', 'admin', 'super_admin'], minLevel: 20, actions: { view: { minLevel: 20 }, edit: { minLevel: 40 } } },
    'panel-11': { roles: ['viewer', 'editor', 'manager', 'admin', 'super_admin'], minLevel: 20, actions: { view: { minLevel: 20 }, edit: { minLevel: 40 } } },
    'panel-12': { roles: ['viewer', 'editor', 'manager', 'admin', 'super_admin'], minLevel: 20, actions: { view: { minLevel: 20 }, edit: { minLevel: 40 }, manage: { minLevel: 60 } } },
    'panel-13': { roles: ['viewer', 'editor', 'manager', 'admin', 'super_admin'], minLevel: 20, actions: { view: { minLevel: 20 }, edit: { minLevel: 40 } } },
    'panel-14': { roles: ['viewer', 'editor', 'manager', 'admin', 'super_admin'], minLevel: 20, actions: { view: { minLevel: 20 }, edit: { minLevel: 40 } } },
    'panel-15': { roles: ['manager', 'admin', 'super_admin'], minLevel: 60, actions: { view: { minLevel: 60 }, manage: { minLevel: 80 } } },
    'panel-16': { roles: ['manager', 'admin', 'super_admin'], minLevel: 60, actions: { view: { minLevel: 60 }, manage: { minLevel: 80 } } },
    'panel-17': { roles: ['admin', 'super_admin'], minLevel: 80, actions: { view: { minLevel: 80 }, configure: { minLevel: 100 } } },
    'panel-18': { roles: ['admin', 'super_admin'], minLevel: 80, actions: { view: { minLevel: 80 }, configure: { minLevel: 100 } } },
    'panel-19': { roles: ['super_admin'], minLevel: 100, actions: { view: { minLevel: 100 }, manage: { minLevel: 100 } } },
    'panel-user-management': { roles: ['admin', 'super_admin'], minLevel: 80, actions: { view: { roles: ['admin', 'super_admin'], minLevel: 80 }, edit: { roles: ['admin', 'super_admin'], minLevel: 80 }, 'reset-password': { roles: ['super_admin'], minLevel: 100 }, create: { roles: ['super_admin'], minLevel: 100 }, delete: { roles: ['super_admin'], minLevel: 100 } } },
    'panel-permissions-admin': { roles: ['super_admin'], minLevel: 100, actions: { view: { roles: ['admin', 'super_admin'], minLevel: 80 }, 'assign-role': { roles: ['super_admin'], minLevel: 100 }, 'revoke-role': { roles: ['super_admin'], minLevel: 100 }, 'create-role': { roles: ['super_admin'], minLevel: 100 }, 'edit-role': { roles: ['super_admin'], minLevel: 100 }, 'grant-permission': { roles: ['super_admin'], minLevel: 100 }, 'revoke-permission': { roles: ['super_admin'], minLevel: 100 } } },
    'panel-session-admin': { roles: ['manager', 'admin', 'super_admin'], minLevel: 60, actions: { view: { roles: ['viewer', 'editor', 'manager', 'admin', 'super_admin'], minLevel: 20 }, 'view-all': { roles: ['admin', 'super_admin'], minLevel: 80 }, terminate: { roles: ['manager', 'admin', 'super_admin'], minLevel: 60 }, 'terminate-others': { roles: ['manager', 'admin', 'super_admin'], minLevel: 60 }, 'terminate-user': { roles: ['admin', 'super_admin'], minLevel: 80 } } },
    'panel-audit-trail': { roles: ['manager', 'admin', 'super_admin'], minLevel: 60, actions: { view: { roles: ['manager', 'admin', 'super_admin'], minLevel: 60 }, 'view-all': { roles: ['admin', 'super_admin'], minLevel: 80 }, export: { roles: ['admin', 'super_admin'], minLevel: 80 }, filter: { roles: ['manager', 'admin', 'super_admin'], minLevel: 60 } } },
    'panel-feature-flags-admin': { roles: ['admin', 'super_admin'], minLevel: 80, actions: { view: { roles: ['admin', 'super_admin'], minLevel: 80 }, toggle: { roles: ['admin', 'super_admin'], minLevel: 80 }, create: { roles: ['super_admin'], minLevel: 100 }, delete: { roles: ['super_admin'], minLevel: 100 } } },
    'panel-user-preferences': { roles: ['viewer', 'editor', 'manager', 'admin', 'super_admin'], minLevel: 20, actions: { view: { roles: ['viewer', 'editor', 'manager', 'admin', 'super_admin'], minLevel: 20 }, edit: { roles: ['viewer', 'editor', 'manager', 'admin', 'super_admin'], minLevel: 20 }, 'save-layout': { roles: ['viewer', 'editor', 'manager', 'admin', 'super_admin'], minLevel: 20 }, 'delete-layout': { roles: ['viewer', 'editor', 'manager', 'admin', 'super_admin'], minLevel: 20 }, export: { roles: ['viewer', 'editor', 'manager', 'admin', 'super_admin'], minLevel: 20 }, import: { roles: ['viewer', 'editor', 'manager', 'admin', 'super_admin'], minLevel: 20 } } },
    'device-manager': { roles: ['viewer', 'editor', 'manager', 'admin', 'super_admin'], minLevel: 20, actions: { view: { minLevel: 20 }, register: { minLevel: 20 }, rename: { minLevel: 20 }, 'set-trust': { minLevel: 60 }, remove: { minLevel: 40 } } },
    'security-events': { roles: ['manager', 'admin', 'super_admin'], minLevel: 60, actions: { view: { minLevel: 60 }, log: { minLevel: 20 }, stats: { minLevel: 60 } } },
    'notification-rules': { roles: ['admin', 'super_admin'], minLevel: 80, actions: { view: { minLevel: 60 }, create: { minLevel: 80 }, edit: { minLevel: 80 }, toggle: { minLevel: 80 }, delete: { minLevel: 100 } } },
    'saved-views': { roles: ['viewer', 'editor', 'manager', 'admin', 'super_admin'], minLevel: 20, actions: { view: { minLevel: 20 }, create: { minLevel: 20 }, edit: { minLevel: 20 }, delete: { minLevel: 20 }, share: { minLevel: 40 } } },
    'permission-audit': { roles: ['manager', 'admin', 'super_admin'], minLevel: 60, actions: { view: { minLevel: 60 }, 'view-all': { minLevel: 80 }, log: { minLevel: 20 }, stats: { minLevel: 60 } } }
};

const _metrics = { lookups: 0, actionLookups: 0, hits: 0, misses: 0, registrations: 0, validations: 0 };

function getModulePolicy(moduleId: string) { _metrics.lookups++; if (!moduleId) { _metrics.misses++; return null; } const normalized = moduleId.toLowerCase().replace(/^module[:\-_]?/, '').replace(/^painel[:\-_]?/, 'panel-').replace(/^panel[:\-_]?/, 'panel-'); if (modulePolicies[normalized]) { _metrics.hits++; return modulePolicies[normalized]; } _metrics.misses++; return null; }
function getModuleActionPolicy(moduleId: string, action: string) { _metrics.actionLookups++; const policy = getModulePolicy(moduleId) as Record<string, unknown> | null; if (!policy) return null; if (policy.actions && (policy.actions as Record<string, Record<string, unknown>>)[action]) { const actionPolicy = (policy.actions as Record<string, Record<string, unknown>>)[action]; return { roles: actionPolicy.roles || policy.roles, minLevel: actionPolicy.minLevel || policy.minLevel }; } return { roles: policy.roles, minLevel: policy.minLevel }; }
function isPublicModule(moduleId: string) { const policy = getModulePolicy(moduleId); return policy?.public === true || policy?.minLevel === 0; }
function getAllModules() { return Object.entries(modulePolicies).map(([moduleId, policy]) => ({ moduleId, ...policy })); }
function getModulesByLevel(minLevel: number) { return Object.entries(modulePolicies).filter(([_, policy]) => ((policy.minLevel as number) || 0) >= minLevel).map(([moduleId, policy]) => ({ moduleId, ...policy })); }
function getEnterprisePanels() { const enterpriseIds = ['panel-user-management', 'panel-permissions-admin', 'panel-session-admin', 'panel-audit-trail', 'panel-feature-flags-admin', 'panel-user-preferences']; return enterpriseIds.map(id => ({ moduleId: id, ...(modulePolicies[id] || {}) })).filter(p => (p as Record<string, unknown>).roles); }
function registerModule(moduleId: string, policy: Record<string, unknown>) { _metrics.registrations++; if (!moduleId || !policy) return false; modulePolicies[moduleId.toLowerCase()] = policy; return true; }
function validateModulePolicies(knownModules: string[] = []) { _metrics.validations++; const missing = knownModules.filter(moduleId => !getModulePolicy(moduleId)); return { valid: missing.length === 0, missing, checked: knownModules.length }; }
function getVersion() { return VERSION; }


function info() { const publicCount = Object.values(modulePolicies).filter(p => p.public || p.minLevel === 0).length; const panelCount = Object.keys(modulePolicies).filter(k => k.startsWith('panel-')).length; const enterpriseCount = ['panel-user-management', 'panel-permissions-admin', 'panel-session-admin', 'panel-audit-trail', 'panel-feature-flags-admin'].length; return { moduleId: MODULE_ID, version: VERSION, totalModules: Object.keys(modulePolicies).length, publicModules: publicCount, panelModules: panelCount, enterprisePanels: enterpriseCount, metrics: { ..._metrics }, hitRate: _metrics.lookups > 0 ? `${((_metrics.hits / _metrics.lookups) * 100).toFixed(1)}%` : 'N/A', timestamp: Date.now() }; }


// @ts-expect-error TS migration - TS2339
function healthCheck() { const checks = { policiesDefined: Object.keys(modulePolicies).length > 0, hasPublicModules: Object.values(modulePolicies).some(p => p.public || p.minLevel === 0), hasProtectedModules: Object.values(modulePolicies).some(p => !p.public && p.minLevel > 0), structuralModulesExist: ['header', 'sidebar', 'footer', 'app-shell'].every(m => modulePolicies[m]), enterprisePanelsExist: ['panel-user-management', 'panel-permissions-admin'].every(m => modulePolicies[m]), goodHitRate: _metrics.lookups === 0 || (_metrics.hits / _metrics.lookups) > 0.5 }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : (passed >= 4 ? 'DEGRADED' : 'UNHEALTHY'), score: `${passed}/${total}`, healthy: passed >= 5, checks, totalModules: Object.keys(modulePolicies).length, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }

export { modulePolicies, getModulePolicy, getModuleActionPolicy, isPublicModule, getAllModules, getModulesByLevel, getEnterprisePanels, registerModule, validateModulePolicies, getVersion, info, healthCheck };
export default { modulePolicies, getModulePolicy, getModuleActionPolicy, isPublicModule, getAllModules, getModulesByLevel, getEnterprisePanels, registerModule, validateModulePolicies, getVersion, info, healthCheck };
