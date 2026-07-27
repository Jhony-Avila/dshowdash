const VERSION = "9.3.0-P2-ENTERPRISE";
const PANEL_ID = "panel-nav-admin";
const MODULE_ID = "panel-nav-admin.core.contracts";
const LOCAL_EVENTS = { INIT_START: "nav-admin:init:start", INIT_COMPLETE: "nav-admin:init:complete", INIT_ERROR: "nav-admin:init:error", MOUNTED: "nav-admin:mounted", UNMOUNTED: "nav-admin:unmounted", LOAD_START: "nav-admin:load:start", LOAD_SUCCESS: "nav-admin:load:success", LOAD_ERROR: "nav-admin:load:error", ITEM_CREATED: "nav-admin:item:created", ITEM_UPDATED: "nav-admin:item:updated", ITEM_DELETED: "nav-admin:item:deleted", ITEM_REORDERED: "nav-admin:item:reordered", SECTION_CREATED: "nav-admin:section:created", SECTION_UPDATED: "nav-admin:section:updated", SECTION_DELETED: "nav-admin:section:deleted", SCAFFOLD_STARTED: "nav-admin:scaffold:started", SCAFFOLD_COMPLETED: "nav-admin:scaffold:completed", SCAFFOLD_ERROR: "nav-admin:scaffold:error", SIDEBAR_REFRESH: "sidebar:nav:refresh" };
const SIDEBAR_EVENTS = { NAV_DATA_CHANGED: "sidebar:nav:data-changed", NAV_RELOAD: "sidebar:nav:reload", NAV_ITEM_ADDED: "sidebar:nav:item-added", NAV_ITEM_REMOVED: "sidebar:nav:item-removed" };
const PERMISSION_ACTIONS = { VIEW: "view", CREATE: "create", EDIT: "edit", DELETE: "delete", REORDER: "reorder", SECTIONS: "sections", SCAFFOLD: "scaffold" };
const PHASES = { IDLE: "idle", LOADING: "loading", READY: "ready", SAVING: "saving", ERROR: "error" };
const STATE_SHAPE = { phase: "idle", items: [], sections: {}, selectedItem: null, selectedSection: null, filters: { section: "sidebar", search: "", group: "" }, icons: [], error: null, lastLoadAt: null, lastSaveAt: null };
const DEFAULT_SECTIONS = { main: { label: null, order: 1, icon: null }, operacional: { label: null, order: 2, icon: null }, admin: { label: "Administra\xE7\xE3o", order: 3, icon: "admin" } };
const NAV_ITEM_SHAPE = { id: "", label: "", href: "", icon: "default", section: "operacional", minLevel: 0, isDivider: false, isActive: true, order: 0, roles: [], createdAt: null, updatedAt: null };
const NAV_SECTION_SHAPE = { key: "", label: null, order: 1, icon: null };
const VALIDATION_RULES = { id: { required: true, pattern: /^[a-z0-9-]+$/, minLength: 2, maxLength: 50 }, label: { required: true, minLength: 2, maxLength: 50 }, href: { pattern: /^(#\/[a-z0-9/-]*|null)?$/i }, minLevel: { min: 0, max: 999 }, section: { required: true } };
const PERMISSION_LEVELS = [{ value: 0, label: "P\xFAblico", description: "Vis\xEDvel para todos" }, { value: 20, label: "Usu\xE1rio", description: "Usu\xE1rios autenticados" }, { value: 40, label: "Avan\xE7ado", description: "Usu\xE1rios com acesso avan\xE7ado" }, { value: 60, label: "Supervisor", description: "Supervisores e gestores" }, { value: 80, label: "Admin", description: "Administradores" }, { value: 100, label: "Super Admin", description: "Super administradores" }];
const AVAILABLE_ICONS = ["default", "dashboard", "automation", "box", "users", "team", "chart", "cart", "document", "money", "supplier", "grid", "ads", "drive", "globe", "instagram", "cog", "calculator", "pipeline", "package", "people", "server", "users-cog", "shield", "key", "clipboard", "settings", "admin", "divider"];
const info = () => ({ moduleId: MODULE_ID, version: VERSION, panelId: PANEL_ID });
const healthCheck = () => ({ status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { eventsCount: Object.keys(LOCAL_EVENTS).length, phasesCount: Object.keys(PHASES).length } });
var contracts_default = { VERSION, PANEL_ID, MODULE_ID, LOCAL_EVENTS, SIDEBAR_EVENTS, PERMISSION_ACTIONS, PHASES, STATE_SHAPE, DEFAULT_SECTIONS, NAV_ITEM_SHAPE, NAV_SECTION_SHAPE, VALIDATION_RULES, PERMISSION_LEVELS, AVAILABLE_ICONS, info, healthCheck };
export {
  AVAILABLE_ICONS,
  DEFAULT_SECTIONS,
  LOCAL_EVENTS,
  MODULE_ID,
  NAV_ITEM_SHAPE,
  NAV_SECTION_SHAPE,
  PANEL_ID,
  PERMISSION_ACTIONS,
  PERMISSION_LEVELS,
  PHASES,
  SIDEBAR_EVENTS,
  STATE_SHAPE,
  VALIDATION_RULES,
  VERSION,
  contracts_default as default,
  healthCheck,
  info
};
