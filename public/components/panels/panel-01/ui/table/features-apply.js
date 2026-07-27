const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/table/features-apply";
const applyExtendedFeatures = (ctx, items, callbacks) => {
  const tbody = ctx.container.querySelector("tbody");
  if (ctx.highlightingRules && ctx.features && ctx.features.highlightingRules && tbody) {
    const rows = tbody.querySelectorAll(".p01-row");
    rows.forEach((row) => {
      const rowId = row.dataset.id;
      const rowData = items.find((i) => String(i.id || i.Id_Requisicao) === rowId);
      if (rowData) {
        const style = ctx.highlightingRules.applyToRow(rowData);
        if (style) row.style.backgroundColor = style;
      }
    });
  }
  if (ctx.anomalyDetector && ctx.features.anomalyDetection) {
    ctx.anomalyDetector.setData(items);
    const anomalies = ctx.anomalyDetector.getAnomalies();
    if (anomalies && anomalies.length > 0) callbacks.onAnomalyDetected(anomalies);
  }
  if (ctx.badgeNew && ctx.features.badgeNew) {
    ctx.badgeNew.checkNewItems(items);
  }
  if (ctx.summaryRow && ctx.features.summaryRow) {
    ctx.summaryRow.setData(items);
  }
};
const info = () => ({ moduleId: MODULE_ID, version: VERSION });
const healthCheck = () => ({ status: "HEALTHY", moduleId: MODULE_ID, version: VERSION });
export {
  MODULE_ID,
  VERSION,
  applyExtendedFeatures,
  healthCheck,
  info
};
