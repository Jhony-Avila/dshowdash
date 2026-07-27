const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/bulk-edit";
class BulkEditManager {
  constructor(options = {}) {
    this.editableFields = options.editableFields || ["id_situacao", "observacao", "centro_custo"];
    this.onSave = options.onSave || (() => {
    });
    this.onProgress = options.onProgress || (() => {
    });
    this._selectedIds = /* @__PURE__ */ new Set();
  }
  setSelection(ids) {
    this._selectedIds = new Set(ids);
  }
  getSelection() {
    return [...this._selectedIds];
  }
  getSelectionCount() {
    return this._selectedIds.size;
  }
  hasSelection() {
    return this._selectedIds.size > 0;
  }
  getEditableFields() {
    return this.editableFields.map((field) => ({
      id: field,
      label: this._getFieldLabel(field),
      type: this._getFieldType(field)
    }));
  }
  _getFieldLabel(field) {
    const labels = { id_situacao: "Situacao", observacao: "Observacao", centro_custo: "Centro de Custo", fornecedor: "Fornecedor" };
    return labels[field] || field;
  }
  _getFieldType(field) {
    if (field === "id_situacao") return "select";
    if (field === "observacao") return "textarea";
    return "text";
  }
  async applyChanges(changes) {
    const ids = this.getSelection();
    if (ids.length === 0) throw new Error("Nenhum item selecionado");
    const results = { success: [], failed: [] };
    for (let i = 0; i < ids.length; i++) {
      try {
        await this.onSave({ id: ids[i], changes });
        results.success.push(ids[i]);
      } catch (err) {
        results.failed.push({ id: ids[i], error: err.message });
      }
      this.onProgress(Math.round((i + 1) / ids.length * 100));
    }
    return results;
  }
  renderModal(container) {
    const fields = this.getEditableFields();
    let fieldsHtml = "";
    fields.forEach((f) => {
      if (f.type === "select") {
        fieldsHtml += `<div class="p01-bulk-field"><label>${f.label}</label><select name="${f.id}" class="p01-input"><option value="">Manter atual</option><option value="1304">Pendente Lancamento</option><option value="1305">Pendente Pagamento</option><option value="1306">Pago</option></select></div>`;
      } else if (f.type === "textarea") {
        fieldsHtml += `<div class="p01-bulk-field"><label>${f.label}</label><textarea name="${f.id}" class="p01-input" placeholder="Deixe vazio para manter"></textarea></div>`;
      } else {
        fieldsHtml += `<div class="p01-bulk-field"><label>${f.label}</label><input type="text" name="${f.id}" class="p01-input" placeholder="Deixe vazio para manter"></div>`;
      }
    });
    container.innerHTML = `<div class="p01-bulk-edit-modal"><h3>Editar ${this._selectedIds.size} itens</h3><div class="p01-bulk-fields">${fieldsHtml}</div><div class="p01-bulk-actions"><button class="p01-btn p01-btn--secondary" data-action="cancel">Cancelar</button><button class="p01-btn p01-btn--primary" data-action="apply">Aplicar</button></div><div class="p01-bulk-progress" style="display:none"><div class="p01-progress-bar"><div class="p01-progress-fill"></div></div><span class="p01-progress-text">0%</span></div></div>`;
  }
  getFormData(form) {
    const changes = {};
    const formData = new FormData(form);
    for (const [key, value] of formData.entries()) {
      if (value && value.trim()) changes[key] = value.trim();
    }
    return changes;
  }
}
function createBulkEditManager(options = {}) {
  return new BulkEditManager(options);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var bulk_edit_default = { BulkEditManager, createBulkEditManager };
export {
  BulkEditManager,
  MODULE_ID,
  VERSION,
  createBulkEditManager,
  bulk_edit_default as default,
  healthCheck,
  info
};
