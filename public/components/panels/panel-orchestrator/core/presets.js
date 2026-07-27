const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "orchestrator-presets";
const getVersion = () => VERSION;
const LAYOUT_MODES = { GRID_1: "grid-1", GRID_2: "grid-2", GRID_3: "grid-3", SINGLE_FULL: "single-full", CANVAS: "canvas", DASHBOARD: "dashboard" };
const PRESETS = {
  default: { id: "default", name: "Dashboard Padr\xE3o", description: "Vis\xE3o geral com cards e pain\xE9is principais", icon: "barChart", layoutMode: LAYOUT_MODES.DASHBOARD, panels: ["panel-cards", "panel-02", "panel-03", "panel-12"], maxPanels: 6, permissions: [], featureFlags: [] },
  monitoring: { id: "monitoring", name: "Monitoramento", description: "Foco em sa\xFAde do servidor e infraestrutura", icon: "monitor", layoutMode: LAYOUT_MODES.GRID_2, panels: ["panel-12", "panel-02", "panel-03", "panel-04"], maxPanels: 4, permissions: ["admin", "monitor"], featureFlags: [] },
  serverHealth: { id: "serverHealth", name: "Sa\xFAde do Servidor", description: "Painel \xFAnico focado em infraestrutura", icon: "settings", layoutMode: LAYOUT_MODES.SINGLE_FULL, panels: ["panel-12"], maxPanels: 1, permissions: ["admin"], featureFlags: [] },
  pipedriveSales: { id: "pipedriveSales", name: "Vendas Pipedrive", description: "Pain\xE9is de CRM e vendas", icon: "dollarSign", layoutMode: LAYOUT_MODES.GRID_2, panels: ["panel-05", "panel-06", "panel-07", "panel-08"], maxPanels: 4, permissions: ["sales", "admin"], featureFlags: ["pipedrive_enabled"] },
  financial: { id: "financial", name: "Financeiro", description: "Vis\xE3o financeira e cont\xE1bil", icon: "wallet", layoutMode: LAYOUT_MODES.GRID_2, panels: ["panel-09", "panel-10", "panel-11"], maxPanels: 4, permissions: ["finance", "admin"], featureFlags: [] },
  compact: { id: "compact", name: "Modo Compacto", description: "Layout otimizado para telas menores", icon: "smartphone", layoutMode: LAYOUT_MODES.GRID_1, panels: ["panel-cards", "panel-12"], maxPanels: 2, permissions: [], featureFlags: [] },
  development: { id: "development", name: "Desenvolvimento", description: "Pain\xE9is de debug e desenvolvimento", icon: "tool", layoutMode: LAYOUT_MODES.GRID_3, panels: ["panel-12", "panel-02", "panel-03", "panel-04", "panel-05", "panel-06"], maxPanels: 6, permissions: ["admin", "dev"], featureFlags: ["dev_mode"] }
};
const getPresetById = (id) => PRESETS[id] || null;
const getAllPresets = () => Object.values(PRESETS);
const getPresetIds = () => Object.keys(PRESETS);
const getPresetsByPermission = (permission) => getAllPresets().filter((preset) => preset.permissions.length === 0 || preset.permissions.includes(permission));
const getPresetsInfo = () => ({ version: VERSION, moduleId: MODULE_ID, count: getAllPresets().length, ids: getPresetIds(), layoutModes: Object.values(LAYOUT_MODES) });
var presets_default = { VERSION, MODULE_ID, getVersion, LAYOUT_MODES, PRESETS, getPresetById, getAllPresets, getPresetIds, getPresetsByPermission, getPresetsInfo };
const info = () => ({ moduleId: MODULE_ID, version: VERSION });
const healthCheck = () => ({ status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { presetsReady: true } });
export {
  LAYOUT_MODES,
  MODULE_ID,
  PRESETS,
  VERSION,
  presets_default as default,
  getAllPresets,
  getPresetById,
  getPresetIds,
  getPresetsByPermission,
  getPresetsInfo,
  getVersion,
  healthCheck,
  info
};
