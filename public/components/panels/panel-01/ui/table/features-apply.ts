// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/table/features-apply
// PURPOSE: Panel-01 Table - Apply Extended Features
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   applyExtendedFeatures() — exported function
//   info() — exported function
//   healthCheck() — exported function
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
export const MODULE_ID = 'panel-01/ui/table/features-apply';

export const applyExtendedFeatures = (ctx: Record<string, unknown>, items: Record<string, unknown>[], callbacks: Record<string, (...args: unknown[]) => void>) => {
  const tbody = (ctx.container as HTMLElement).querySelector('tbody');

  // Apply highlighting rules
  if (ctx.highlightingRules && ctx.features && (ctx.features as Record<string, unknown>).highlightingRules && tbody) {
    const rows = tbody.querySelectorAll('.p01-row');
    rows.forEach((row: Element) => {
      const rowId = (row as HTMLElement).dataset.id;
      const rowData = items.find((i: Record<string, unknown>) => String(i.id || i.Id_Requisicao) === rowId);
      if (rowData) {
        const style = (ctx.highlightingRules as Record<string, (...args: unknown[]) => unknown>).applyToRow(rowData);
        if (style) (row as HTMLElement).style.backgroundColor = style as string;
      }
    });
  }

  // Detect anomalies
  if (ctx.anomalyDetector && (ctx.features as Record<string, unknown>).anomalyDetection) {
    (ctx.anomalyDetector as Record<string, (...args: unknown[]) => unknown>).setData(items);
    const anomalies = (ctx.anomalyDetector as Record<string, () => unknown>).getAnomalies();
    if (anomalies && (anomalies as unknown[]).length > 0) callbacks.onAnomalyDetected(anomalies);
  }

  // Check for new items
  if (ctx.badgeNew && (ctx.features as Record<string, unknown>).badgeNew) {
    (ctx.badgeNew as Record<string, (...args: unknown[]) => void>).checkNewItems(items);
  }

  // Calculate summary
  if (ctx.summaryRow && (ctx.features as Record<string, unknown>).summaryRow) {
    (ctx.summaryRow as Record<string, (...args: unknown[]) => void>).setData(items);
  }
};

export const info = () => ({ moduleId: MODULE_ID, version: VERSION });
export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION });
