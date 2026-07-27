// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: orchestrator-layout-mapper
// PURPOSE: Layout Mapper
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   LAYOUT_MODES, getPresetById from ../core/presets.js
//   normalizePanelList from ./normalization.js
//   logger from ./logger.js
//
// PROVIDES:
//   info() — exported function
//   healthCheck() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//   getVersion() — exported function
//   mapPresetToFinalPanels() — exported function
//   adjustPanelsForBreakpoint() — exported function
//   getLayoutModeForPanelCount() — exported function
//   calculatePanelDimensions() — exported function
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

import { LAYOUT_MODES, getPresetById } from '../core/presets.js';
import { normalizePanelList } from './normalization.js';
import logger from './logger.js';

const VERSION = '9.3.0-P2-ENTERPRISE';
const MODULE_ID = 'orchestrator-layout-mapper';

function getVersion() { return VERSION; }

function mapPresetToFinalPanels(presetId: string, context: Record<string, unknown> = {}) {
  const preset = getPresetById(presetId);
  if (!preset) {
    logger.error(`Preset não encontrado: ${presetId}`);
    return { panels: [] as string[], layoutMode: LAYOUT_MODES.GRID_2, error: 'Preset not found' };
  }
  let panels = preset.panels.slice();
  if (context.permissions && preset.permissions.length > 0) {
    const hasPermission = preset.permissions.some((p: string) => (context.permissions as string[]).indexOf(p) !== -1);
    if (!hasPermission) {
      logger.warn(`Sem permissão para preset: ${presetId}`);
      return { panels: [], layoutMode: preset.layoutMode, error: 'Permission denied' };
    }
  }
  if (context.featureFlags && preset.featureFlags.length > 0) {
    const hasFlags = preset.featureFlags.every((f: string) => (context.featureFlags as string[]).indexOf(f) !== -1);
    if (!hasFlags) logger.warn(`Feature flags não disponíveis para preset: ${presetId}`);
  }
  if (context.breakpoint) panels = adjustPanelsForBreakpoint(panels, context.breakpoint as string, preset.maxPanels);
  const maxPanels = (context.maxPanels as number) || preset.maxPanels || 6;
  panels = panels.slice(0, maxPanels) as string[];
  const normalizedPanels = normalizePanelList(panels);
  const finalPanels = normalizedPanels.map(panel => Object.assign({}, panel, { presetId, layoutMode: preset.layoutMode }));
  logger.debug(`Preset ${presetId} mapeado: ${finalPanels.length} painéis`);
  return { panels: finalPanels, layoutMode: preset.layoutMode, presetId, maxPanels, error: null as string | null };
}

function adjustPanelsForBreakpoint(panels: unknown[], breakpoint: string, maxPanels: number = 6): string[] {
  const breakpointLimits: Record<string, number> = { xs: 1, sm: 2, md: 4, lg: 6, xl: 6 };
  const limit = breakpointLimits[breakpoint] || maxPanels;
  return panels.slice(0, Math.min(limit, maxPanels)) as string[];
}

function getLayoutModeForPanelCount(count: number) {
  if (count <= 1) return LAYOUT_MODES.SINGLE_FULL;
  if (count <= 2) return LAYOUT_MODES.GRID_1;
  if (count <= 4) return LAYOUT_MODES.GRID_2;
  return LAYOUT_MODES.GRID_3;
}

function calculatePanelDimensions(panelIndex: number, totalPanels: number, layoutMode: string, containerWidth: number, containerHeight: number) {
  const gap = 16;
  let cols, rows;
  switch (layoutMode) {
    case LAYOUT_MODES.SINGLE_FULL: cols = 1; rows = 1; break;
    case LAYOUT_MODES.GRID_1: cols = 1; rows = totalPanels; break;
    case LAYOUT_MODES.GRID_2: cols = 2; rows = Math.ceil(totalPanels / 2); break;
    case LAYOUT_MODES.GRID_3: cols = 3; rows = Math.ceil(totalPanels / 3); break;
    default: cols = 2; rows = Math.ceil(totalPanels / 2);
  }
  const width = (containerWidth - (cols - 1) * gap) / cols;
  const height = (containerHeight - (rows - 1) * gap) / rows;
  const col = panelIndex % cols;
  const row = Math.floor(panelIndex / cols);
  const x = col * (width + gap);
  const y = row * (height + gap);
  return { width, height, x, y, col, row };
}

export { VERSION, MODULE_ID, getVersion, mapPresetToFinalPanels, adjustPanelsForBreakpoint, getLayoutModeForPanelCount, calculatePanelDimensions };

export default { VERSION, MODULE_ID, getVersion, mapPresetToFinalPanels, adjustPanelsForBreakpoint, getLayoutModeForPanelCount, calculatePanelDimensions };

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { layoutMapperReady: true } }; }
