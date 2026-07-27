import { LAYOUT_MODES, getPresetById } from "../core/presets.js";
import { normalizePanelList } from "./normalization.js";
import logger from "./logger.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "orchestrator-layout-mapper";
function getVersion() {
  return VERSION;
}
function mapPresetToFinalPanels(presetId, context = {}) {
  const preset = getPresetById(presetId);
  if (!preset) {
    logger.error(`Preset n\xE3o encontrado: ${presetId}`);
    return { panels: [], layoutMode: LAYOUT_MODES.GRID_2, error: "Preset not found" };
  }
  let panels = preset.panels.slice();
  if (context.permissions && preset.permissions.length > 0) {
    const hasPermission = preset.permissions.some((p) => context.permissions.indexOf(p) !== -1);
    if (!hasPermission) {
      logger.warn(`Sem permiss\xE3o para preset: ${presetId}`);
      return { panels: [], layoutMode: preset.layoutMode, error: "Permission denied" };
    }
  }
  if (context.featureFlags && preset.featureFlags.length > 0) {
    const hasFlags = preset.featureFlags.every((f) => context.featureFlags.indexOf(f) !== -1);
    if (!hasFlags) logger.warn(`Feature flags n\xE3o dispon\xEDveis para preset: ${presetId}`);
  }
  if (context.breakpoint) panels = adjustPanelsForBreakpoint(panels, context.breakpoint, preset.maxPanels);
  const maxPanels = context.maxPanels || preset.maxPanels || 6;
  panels = panels.slice(0, maxPanels);
  const normalizedPanels = normalizePanelList(panels);
  const finalPanels = normalizedPanels.map((panel) => Object.assign({}, panel, { presetId, layoutMode: preset.layoutMode }));
  logger.debug(`Preset ${presetId} mapeado: ${finalPanels.length} pain\xE9is`);
  return { panels: finalPanels, layoutMode: preset.layoutMode, presetId, maxPanels, error: null };
}
function adjustPanelsForBreakpoint(panels, breakpoint, maxPanels = 6) {
  const breakpointLimits = { xs: 1, sm: 2, md: 4, lg: 6, xl: 6 };
  const limit = breakpointLimits[breakpoint] || maxPanels;
  return panels.slice(0, Math.min(limit, maxPanels));
}
function getLayoutModeForPanelCount(count) {
  if (count <= 1) return LAYOUT_MODES.SINGLE_FULL;
  if (count <= 2) return LAYOUT_MODES.GRID_1;
  if (count <= 4) return LAYOUT_MODES.GRID_2;
  return LAYOUT_MODES.GRID_3;
}
function calculatePanelDimensions(panelIndex, totalPanels, layoutMode, containerWidth, containerHeight) {
  const gap = 16;
  let cols, rows;
  switch (layoutMode) {
    case LAYOUT_MODES.SINGLE_FULL:
      cols = 1;
      rows = 1;
      break;
    case LAYOUT_MODES.GRID_1:
      cols = 1;
      rows = totalPanels;
      break;
    case LAYOUT_MODES.GRID_2:
      cols = 2;
      rows = Math.ceil(totalPanels / 2);
      break;
    case LAYOUT_MODES.GRID_3:
      cols = 3;
      rows = Math.ceil(totalPanels / 3);
      break;
    default:
      cols = 2;
      rows = Math.ceil(totalPanels / 2);
  }
  const width = (containerWidth - (cols - 1) * gap) / cols;
  const height = (containerHeight - (rows - 1) * gap) / rows;
  const col = panelIndex % cols;
  const row = Math.floor(panelIndex / cols);
  const x = col * (width + gap);
  const y = row * (height + gap);
  return { width, height, x, y, col, row };
}
var layout_mapper_default = { VERSION, MODULE_ID, getVersion, mapPresetToFinalPanels, adjustPanelsForBreakpoint, getLayoutModeForPanelCount, calculatePanelDimensions };
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { layoutMapperReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  adjustPanelsForBreakpoint,
  calculatePanelDimensions,
  layout_mapper_default as default,
  getLayoutModeForPanelCount,
  getVersion,
  healthCheck,
  info,
  mapPresetToFinalPanels
};
