const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/import-preview";
const SVGS = {
  check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><polyline points="20 6 9 17 4 12"/></svg>',
  warning: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  x: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
};
const VALIDATION_STATUS = { VALID: "valid", WARNING: "warning", ERROR: "error" };
function ImportPreviewManager(options = {}) {
  this.columns = options.columns || [];
  this.validators = options.validators || {};
  this.onConfirm = options.onConfirm || (() => {
  });
  this.onCancel = options.onCancel || (() => {
  });
  this.maxPreviewRows = options.maxPreviewRows || 100;
  this._data = [];
  this._validationResults = [];
  this._modal = null;
}
ImportPreviewManager.prototype.preview = function(data) {
  this._data = data || [];
  this._validate();
  this._openModal();
};
ImportPreviewManager.prototype._validate = function() {
  const self = this;
  this._validationResults = [];
  this._data.forEach((row, rowIndex) => {
    const rowResult = { index: rowIndex, status: VALIDATION_STATUS.VALID, errors: [], warnings: [] };
    self.columns.forEach((col) => {
      const value = row[col.field];
      const fieldResult = self._validateField(col, value, row);
      if (fieldResult.errors.length > 0) {
        rowResult.status = VALIDATION_STATUS.ERROR;
        rowResult.errors = rowResult.errors.concat(fieldResult.errors);
      } else if (fieldResult.warnings.length > 0 && rowResult.status !== VALIDATION_STATUS.ERROR) {
        rowResult.status = VALIDATION_STATUS.WARNING;
        rowResult.warnings = rowResult.warnings.concat(fieldResult.warnings);
      }
    });
    self._validationResults.push(rowResult);
  });
};
ImportPreviewManager.prototype._validateField = function(column, value, row) {
  const result = { errors: [], warnings: [] };
  if (column.required && (value === void 0 || value === null || value === "")) {
    result.errors.push({ field: column.field, message: `${column.label} \xE9 obrigat\xF3rio` });
    return result;
  }
  if (value !== void 0 && value !== null && value !== "") {
    switch (column.type) {
      case "number":
      case "currency":
        if (isNaN(parseFloat(value))) {
          result.errors.push({ field: column.field, message: `${column.label} deve ser um n\xFAmero` });
        }
        break;
      case "date":
        if (!this._isValidDate(value)) {
          result.errors.push({ field: column.field, message: `${column.label} deve ser uma data v\xE1lida` });
        }
        break;
      case "email":
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          result.errors.push({ field: column.field, message: `${column.label} deve ser um email v\xE1lido` });
        }
        break;
    }
  }
  if (this.validators[column.field]) {
    const customResult = this.validators[column.field](value, row);
    if (customResult && customResult.error) {
      result.errors.push({ field: column.field, message: customResult.error });
    }
    if (customResult && customResult.warning) {
      result.warnings.push({ field: column.field, message: customResult.warning });
    }
  }
  return result;
};
ImportPreviewManager.prototype._isValidDate = (value) => {
  const date = new Date(value);
  return !isNaN(date.getTime());
};
ImportPreviewManager.prototype._openModal = function() {
  const self = this;
  const stats = this._getStats();
  this._modal = document.createElement("div");
  this._modal.className = "p01-modal-overlay";
  this._modal.innerHTML = this._renderModal(stats);
  document.body.appendChild(this._modal);
  this._bindEvents();
  setTimeout(() => {
    self._modal.classList.add("open");
  }, 10);
};
ImportPreviewManager.prototype._renderModal = function(stats) {
  const self = this;
  const statusClass = stats.errors > 0 ? "p01-import-status--error" : stats.warnings > 0 ? "p01-import-status--warning" : "p01-import-status--success";
  const previewData = this._data.slice(0, this.maxPreviewRows);
  const headerHtml = this.columns.map((col) => `<th>${col.label}</th>`).join("");
  const rowsHtml = previewData.map((row, index) => {
    const result = self._validationResults[index];
    const rowClass = `p01-import-row p01-import-row--${result.status}`;
    const cellsHtml = self.columns.map((col) => {
      const value = row[col.field] || "";
      const hasError = result.errors.some((e) => e.field === col.field);
      const hasWarning = result.warnings.some((w) => w.field === col.field);
      const cellClass = hasError ? "p01-import-cell--error" : hasWarning ? "p01-import-cell--warning" : "";
      return `<td class="${cellClass}">${self._escapeHtml(String(value))}</td>`;
    }).join("");
    return `<tr class="${rowClass}"><td class="p01-import-row-status">${self._getStatusIcon(result.status)}</td>${cellsHtml}</tr>`;
  }).join("");
  return `<div class="p01-modal p01-modal--xl"><div class="p01-modal-header"><h2>Pr\xE9via de Importa\xE7\xE3o</h2><button class="p01-modal-close" data-action="close">&times;</button></div><div class="p01-modal-body"><div class="p01-import-stats ${statusClass}"><div class="p01-import-stat"><span class="p01-import-stat-value">${stats.total}</span><span class="p01-import-stat-label">Total</span></div><div class="p01-import-stat p01-import-stat--success"><span class="p01-import-stat-value">${stats.valid}</span><span class="p01-import-stat-label">V\xE1lidos</span></div><div class="p01-import-stat p01-import-stat--warning"><span class="p01-import-stat-value">${stats.warnings}</span><span class="p01-import-stat-label">Avisos</span></div><div class="p01-import-stat p01-import-stat--error"><span class="p01-import-stat-value">${stats.errors}</span><span class="p01-import-stat-label">Erros</span></div></div>${stats.errors > 0 ? `<div class="p01-import-alert p01-import-alert--error">Existem ${stats.errors} registros com erros que n\xE3o ser\xE3o importados.</div>` : ""}<div class="p01-import-table-wrapper"><table class="p01-table p01-table--compact p01-import-table"><thead><tr><th></th>${headerHtml}</tr></thead><tbody>${rowsHtml}</tbody></table></div>${this._data.length > this.maxPreviewRows ? `<div class="p01-import-more">Mostrando ${this.maxPreviewRows} de ${this._data.length} registros</div>` : ""}</div><div class="p01-modal-footer"><button class="p01-btn p01-btn--secondary" data-action="cancel">Cancelar</button><button class="p01-btn p01-btn--primary" data-action="confirm" ${stats.valid === 0 ? "disabled" : ""}>Importar ${stats.valid} registros</button></div></div>`;
};
ImportPreviewManager.prototype._getStats = function() {
  const stats = { total: this._data.length, valid: 0, warnings: 0, errors: 0 };
  this._validationResults.forEach((result) => {
    switch (result.status) {
      case VALIDATION_STATUS.VALID:
        stats.valid++;
        break;
      case VALIDATION_STATUS.WARNING:
        stats.warnings++;
        stats.valid++;
        break;
      case VALIDATION_STATUS.ERROR:
        stats.errors++;
        break;
    }
  });
  return stats;
};
ImportPreviewManager.prototype._getStatusIcon = (status) => {
  switch (status) {
    case VALIDATION_STATUS.VALID:
      return `<span class="p01-import-icon p01-import-icon--success">${SVGS.check}</span>`;
    case VALIDATION_STATUS.WARNING:
      return `<span class="p01-import-icon p01-import-icon--warning">${SVGS.warning}</span>`;
    case VALIDATION_STATUS.ERROR:
      return `<span class="p01-import-icon p01-import-icon--error">${SVGS.x}</span>`;
    default:
      return "";
  }
};
ImportPreviewManager.prototype._escapeHtml = (str) => {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
};
ImportPreviewManager.prototype._bindEvents = function() {
  const self = this;
  this._modal.querySelector('[data-action="confirm"]').addEventListener("click", () => {
    const validData = self._data.filter((_row, index) => self._validationResults[index].status !== VALIDATION_STATUS.ERROR);
    self.onConfirm(validData, self._validationResults);
    self.closeModal();
  });
  this._modal.querySelectorAll('[data-action="cancel"], [data-action="close"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      self.onCancel();
      self.closeModal();
    });
  });
  this._modal.addEventListener("click", (e) => {
    if (e.target.classList.contains("p01-modal-overlay")) {
      self.onCancel();
      self.closeModal();
    }
  });
};
ImportPreviewManager.prototype.closeModal = function() {
  const self = this;
  if (this._modal) {
    this._modal.classList.remove("open");
    setTimeout(() => {
      if (self._modal && self._modal.parentNode) self._modal.parentNode.removeChild(self._modal);
      self._modal = null;
    }, 200);
  }
};
ImportPreviewManager.prototype.destroy = function() {
  this.closeModal();
  this._data = [];
  this._validationResults = [];
};
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var import_preview_default = { ImportPreviewManager, VALIDATION_STATUS, info, healthCheck };
export {
  ImportPreviewManager,
  MODULE_ID,
  VALIDATION_STATUS,
  VERSION,
  import_preview_default as default,
  healthCheck,
  info
};
