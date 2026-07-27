// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin
// PURPOSE: Core Contracts - Panel Nav Admin
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   PANEL_ID — exported value
//   MODULE_ID — module constant
//   LOCAL_EVENTS — exported value
//   SIDEBAR_EVENTS — exported value
//   PERMISSION_ACTIONS — exported value
//   PHASES — exported value
//   STATE_SHAPE — exported value
//   DEFAULT_SECTIONS — exported value
//   NAV_ITEM_SHAPE — exported value
//   NAV_SECTION_SHAPE — exported value
//   VALIDATION_RULES — exported value
//   PERMISSION_LEVELS — exported value
//   AVAILABLE_ICONS — exported value
//   info() — exported function
//   ... and 1 more exports
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const PANEL_ID = 'panel-nav-admin';
export const MODULE_ID = 'panel-nav-admin.core.contracts';

export const LOCAL_EVENTS = { INIT_START: 'nav-admin:init:start', INIT_COMPLETE: 'nav-admin:init:complete', INIT_ERROR: 'nav-admin:init:error', MOUNTED: 'nav-admin:mounted', UNMOUNTED: 'nav-admin:unmounted', LOAD_START: 'nav-admin:load:start', LOAD_SUCCESS: 'nav-admin:load:success', LOAD_ERROR: 'nav-admin:load:error', ITEM_CREATED: 'nav-admin:item:created', ITEM_UPDATED: 'nav-admin:item:updated', ITEM_DELETED: 'nav-admin:item:deleted', ITEM_REORDERED: 'nav-admin:item:reordered', SECTION_CREATED: 'nav-admin:section:created', SECTION_UPDATED: 'nav-admin:section:updated', SECTION_DELETED: 'nav-admin:section:deleted', SCAFFOLD_STARTED: 'nav-admin:scaffold:started', SCAFFOLD_COMPLETED: 'nav-admin:scaffold:completed', SCAFFOLD_ERROR: 'nav-admin:scaffold:error', SIDEBAR_REFRESH: 'sidebar:nav:refresh' };

export const SIDEBAR_EVENTS = { NAV_DATA_CHANGED: 'sidebar:nav:data-changed', NAV_RELOAD: 'sidebar:nav:reload', NAV_ITEM_ADDED: 'sidebar:nav:item-added', NAV_ITEM_REMOVED: 'sidebar:nav:item-removed' };

export const PERMISSION_ACTIONS = { VIEW: 'view', CREATE: 'create', EDIT: 'edit', DELETE: 'delete', REORDER: 'reorder', SECTIONS: 'sections', SCAFFOLD: 'scaffold' };

export const PHASES = { IDLE: 'idle', LOADING: 'loading', READY: 'ready', SAVING: 'saving', ERROR: 'error' };

export const STATE_SHAPE: { phase: string; items: unknown[]; sections: Record<string, unknown>; selectedItem: unknown; selectedSection: unknown; filters: { section: string; search: string; group: string }; icons: unknown[]; error: unknown; lastLoadAt: unknown; lastSaveAt: unknown } = { phase: 'idle', items: [], sections: {}, selectedItem: null, selectedSection: null, filters: { section: 'sidebar', search: '', group: '' }, icons: [], error: null, lastLoadAt: null, lastSaveAt: null };

export const DEFAULT_SECTIONS: Record<string, { label: string | null; order: number; icon: string | null }> = { main: { label: null, order: 1, icon: null }, operacional: { label: null, order: 2, icon: null }, admin: { label: 'Administração', order: 3, icon: 'admin' } };

export const NAV_ITEM_SHAPE: { id: string; label: string; href: string; icon: string; section: string; minLevel: number; isDivider: boolean; isActive: boolean; order: number; roles: string[]; createdAt: string | null; updatedAt: string | null } = { id: '', label: '', href: '', icon: 'default', section: 'operacional', minLevel: 0, isDivider: false, isActive: true, order: 0, roles: [], createdAt: null, updatedAt: null };

export const NAV_SECTION_SHAPE: { key: string; label: string | null; order: number; icon: string | null } = { key: '', label: null, order: 1, icon: null };

export const VALIDATION_RULES = { id: { required: true, pattern: /^[a-z0-9-]+$/, minLength: 2, maxLength: 50 }, label: { required: true, minLength: 2, maxLength: 50 }, href: { pattern: /^(#\/[a-z0-9/-]*|null)?$/i }, minLevel: { min: 0, max: 999 }, section: { required: true } };

export const PERMISSION_LEVELS = [ { value: 0, label: 'Público', description: 'Visível para todos' }, { value: 20, label: 'Usuário', description: 'Usuários autenticados' }, { value: 40, label: 'Avançado', description: 'Usuários com acesso avançado' }, { value: 60, label: 'Supervisor', description: 'Supervisores e gestores' }, { value: 80, label: 'Admin', description: 'Administradores' }, { value: 100, label: 'Super Admin', description: 'Super administradores' } ];

export const AVAILABLE_ICONS = [ 'default', 'dashboard', 'automation', 'box', 'users', 'team', 'chart', 'cart', 'document', 'money', 'supplier', 'grid', 'ads', 'drive', 'globe', 'instagram', 'cog', 'calculator', 'pipeline', 'package', 'people', 'server', 'users-cog', 'shield', 'key', 'clipboard', 'settings', 'admin', 'divider' ];

export const info = () => ({ moduleId: MODULE_ID, version: VERSION, panelId: PANEL_ID });
export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { eventsCount: Object.keys(LOCAL_EVENTS).length, phasesCount: Object.keys(PHASES).length } });

export default { VERSION, PANEL_ID, MODULE_ID, LOCAL_EVENTS, SIDEBAR_EVENTS, PERMISSION_ACTIONS, PHASES, STATE_SHAPE, DEFAULT_SECTIONS, NAV_ITEM_SHAPE, NAV_SECTION_SHAPE, VALIDATION_RULES, PERMISSION_LEVELS, AVAILABLE_ICONS, info, healthCheck };
