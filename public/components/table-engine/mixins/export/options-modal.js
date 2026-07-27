const VERSION = "1.1.0-ENTERPRISE";
const MODULE_ID = "table-engine:export-options";
const MODAL_SVGS = {
  close: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
};
function renderExportModal(columns, selectedCount, options) {
  const opts = options || {};
  const p = opts.cssPrefix || "tbl-";
  const exportableCols = columns.filter((c) => c.exportable !== false);
  const colsHtml = exportableCols.map((col) => `<label class="${p}export-col-item"><input type="checkbox" name="export-cols" value="${col.id}" checked />${escapeHtml(col.label || col.id)}</label>`).join("");
  return `<div class="${p}export-modal"><div class="${p}export-modal-content"><div class="${p}export-header"><h3 class="${p}export-title">Exportar Dados</h3><button class="${p}export-close" data-action="close-export">${MODAL_SVGS.close}</button></div><div class="${p}export-body"><div class="${p}export-section"><label class="${p}export-label">Formato:</label><div class="${p}export-formats"><label class="${p}export-format"><input type="radio" name="export-format" value="csv" checked /><span class="${p}format-icon">\u{1F4C4}</span><span class="${p}format-name">CSV</span></label><label class="${p}export-format"><input type="radio" name="export-format" value="excel" /><span class="${p}format-icon">\u{1F4CA}</span><span class="${p}format-name">Excel</span></label><label class="${p}export-format"><input type="radio" name="export-format" value="json" /><span class="${p}format-icon">{ }</span><span class="${p}format-name">JSON</span></label><label class="${p}export-format"><input type="radio" name="export-format" value="pdf" /><span class="${p}format-icon">\u{1F4D5}</span><span class="${p}format-name">PDF</span></label></div></div><div class="${p}export-section"><label class="${p}export-label">Dados:</label><div class="${p}export-data-options"><label><input type="radio" name="export-data" value="all" checked />Todos os registros</label><label ${selectedCount === 0 ? `class="${p}disabled"` : ""}><input type="radio" name="export-data" value="selected" ${selectedCount === 0 ? "disabled" : ""} />Apenas selecionados (${selectedCount})</label><label><input type="radio" name="export-data" value="filtered" />Dados filtrados</label></div></div><div class="${p}export-section"><label class="${p}export-label">Colunas:</label><div class="${p}export-columns"><label class="${p}export-col-all"><input type="checkbox" class="${p}export-toggle-all" checked />Selecionar todas</label><div class="${p}export-col-list">${colsHtml}</div></div></div><div class="${p}export-section ${p}export-options-extra"><label class="${p}export-label">Op\xE7\xF5es:</label><label><input type="checkbox" name="export-headers" checked />Incluir cabe\xE7alhos</label><label><input type="text" name="export-filename" placeholder="Nome do arquivo" /></label></div></div><div class="${p}export-footer"><button class="${p}export-btn ${p}export-cancel" data-action="cancel-export">Cancelar</button><button class="${p}export-btn ${p}export-confirm" data-action="confirm-export">\u{1F4E5} Exportar</button></div></div></div>`;
}
function collectExportOptions(modalElement, options) {
  const opts = options || {};
  const formatInput = modalElement.querySelector('input[name="export-format"]:checked');
  const dataInput = modalElement.querySelector('input[name="export-data"]:checked');
  const headersInput = modalElement.querySelector('input[name="export-headers"]');
  const filenameInput = modalElement.querySelector('input[name="export-filename"]');
  const format = formatInput ? formatInput.value : "csv";
  const dataScope = dataInput ? dataInput.value : "all";
  const includeHeaders = headersInput ? headersInput.checked : true;
  const filename = filenameInput ? filenameInput.value : "";
  const selectedColumns = [];
  modalElement.querySelectorAll('input[name="export-cols"]:checked').forEach((cb) => {
    selectedColumns.push(cb.value);
  });
  return { format, dataScope, includeHeaders, filename: filename || `export-${Date.now()}`, columns: selectedColumns };
}
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var options_modal_default = { renderExportModal, collectExportOptions, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  collectExportOptions,
  options_modal_default as default,
  healthCheck,
  info,
  renderExportModal
};
