// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: orchestrator-presets
// PURPOSE: Orchestrator Presets
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   info() — exported function
//   healthCheck() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//   getVersion() — exported function
//   LAYOUT_MODES — exported value
//   PRESETS — exported value
//   getPresetById() — exported function
//   getAllPresets() — exported function
//   getPresetIds() — exported function
//   getPresetsByPermission() — exported function
//   getPresetsInfo() — exported function
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

const VERSION = '9.3.0-P2-ENTERPRISE';
const MODULE_ID = 'orchestrator-presets';

const getVersion = () => VERSION;

const LAYOUT_MODES = { GRID_1: 'grid-1', GRID_2: 'grid-2', GRID_3: 'grid-3', SINGLE_FULL: 'single-full', CANVAS: 'canvas', DASHBOARD: 'dashboard' };

const PRESETS: Record<string, { id: string; name: string; description: string; icon: string; layoutMode: string; panels: string[]; maxPanels: number; permissions: string[]; featureFlags: string[] }> = {
  default: { id: 'default', name: 'Dashboard Padrão', description: 'Visão geral com cards e painéis principais', icon: 'barChart', layoutMode: LAYOUT_MODES.DASHBOARD, panels: ['panel-cards', 'panel-02', 'panel-03', 'panel-12'], maxPanels: 6, permissions: [], featureFlags: [] },
  monitoring: { id: 'monitoring', name: 'Monitoramento', description: 'Foco em saúde do servidor e infraestrutura', icon: 'monitor', layoutMode: LAYOUT_MODES.GRID_2, panels: ['panel-12', 'panel-02', 'panel-03', 'panel-04'], maxPanels: 4, permissions: ['admin', 'monitor'], featureFlags: [] },
  serverHealth: { id: 'serverHealth', name: 'Saúde do Servidor', description: 'Painel único focado em infraestrutura', icon: 'settings', layoutMode: LAYOUT_MODES.SINGLE_FULL, panels: ['panel-12'], maxPanels: 1, permissions: ['admin'], featureFlags: [] },
  pipedriveSales: { id: 'pipedriveSales', name: 'Vendas Pipedrive', description: 'Painéis de CRM e vendas', icon: 'dollarSign', layoutMode: LAYOUT_MODES.GRID_2, panels: ['panel-05', 'panel-06', 'panel-07', 'panel-08'], maxPanels: 4, permissions: ['sales', 'admin'], featureFlags: ['pipedrive_enabled'] },
  financial: { id: 'financial', name: 'Financeiro', description: 'Visão financeira e contábil', icon: 'wallet', layoutMode: LAYOUT_MODES.GRID_2, panels: ['panel-09', 'panel-10', 'panel-11'], maxPanels: 4, permissions: ['finance', 'admin'], featureFlags: [] },
  compact: { id: 'compact', name: 'Modo Compacto', description: 'Layout otimizado para telas menores', icon: 'smartphone', layoutMode: LAYOUT_MODES.GRID_1, panels: ['panel-cards', 'panel-12'], maxPanels: 2, permissions: [], featureFlags: [] },
  development: { id: 'development', name: 'Desenvolvimento', description: 'Painéis de debug e desenvolvimento', icon: 'tool', layoutMode: LAYOUT_MODES.GRID_3, panels: ['panel-12', 'panel-02', 'panel-03', 'panel-04', 'panel-05', 'panel-06'], maxPanels: 6, permissions: ['admin', 'dev'], featureFlags: ['dev_mode'] }
};

const getPresetById = (id: string) => PRESETS[id] || null;
const getAllPresets = () => Object.values(PRESETS);
const getPresetIds = () => Object.keys(PRESETS);
const getPresetsByPermission = (permission: string) => getAllPresets().filter(preset => preset.permissions.length === 0 || preset.permissions.includes(permission));
const getPresetsInfo = () => ({ version: VERSION, moduleId: MODULE_ID, count: getAllPresets().length, ids: getPresetIds(), layoutModes: Object.values(LAYOUT_MODES) });

export { VERSION, MODULE_ID, getVersion, LAYOUT_MODES, PRESETS, getPresetById, getAllPresets, getPresetIds, getPresetsByPermission, getPresetsInfo };

export default { VERSION, MODULE_ID, getVersion, LAYOUT_MODES, PRESETS, getPresetById, getAllPresets, getPresetIds, getPresetsByPermission, getPresetsInfo };

export const info = () => ({ moduleId: MODULE_ID, version: VERSION });
export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { presetsReady: true } });
