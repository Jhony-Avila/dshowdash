// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ADAPTIVE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-detector
// PURPOSE: Layout Integration - Panel Detector
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   detectPanelType() — exported function
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

export const VERSION = '3.3.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.resources.layout-integration.utils.panel-detector';

/**
 * Detecta tipo de painel baseado nos métodos disponíveis
 * @param {Object} panel - Instância do painel
 * @returns {'modern'|'legacy'|'unknown'} Tipo do painel
 */
export function detectPanelType(panel: Record<string, unknown>) {
  // Painel novo tem métodos do contrato
  if (panel.getLayoutState && panel.setLayoutState) {
    return 'modern';
  }
  // Painel legado usa eventos ou callbacks diretos
  if (panel.onResize || panel.handleResize || panel._resize) {
    return 'legacy';
  }
  return 'unknown';
}

export default { detectPanelType };
