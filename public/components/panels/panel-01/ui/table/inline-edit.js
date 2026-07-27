const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/table/inline-edit";
class InlineEditor {
  constructor(options = {}) {
    this.editableFields = options.editableFields || ["descricao", "observacao"];
    this.onSave = options.onSave || (() => {
    });
    this.onCancel = options.onCancel || (() => {
    });
    this._activeCell = null;
    this._originalValue = null;
  }
  canEdit(field) {
    return this.editableFields.includes(field);
  }
  startEdit(cell) {
    if (this._activeCell) this.cancel();
    const field = cell.dataset.field;
    if (!this.canEdit(field)) return false;
    this._activeCell = cell;
    this._originalValue = cell.textContent.trim();
    const input = document.createElement("input");
    input.type = "text";
    input.className = "p01-inline-input";
    input.value = this._originalValue;
    input.addEventListener("keydown", (e) => this._onKeyDown(e));
    input.addEventListener("blur", () => this.save());
    cell.innerHTML = "";
    cell.appendChild(input);
    cell.classList.add("p01-editing");
    input.focus();
    input.select();
    return true;
  }
  _onKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      this.save();
    } else if (e.key === "Escape") {
      e.preventDefault();
      this.cancel();
    } else if (e.key === "Tab") {
      this.save();
    }
  }
  save() {
    if (!this._activeCell) return;
    const input = this._activeCell.querySelector("input");
    const newValue = input ? input.value.trim() : this._originalValue;
    const field = this._activeCell.dataset.field;
    const rowId = this._activeCell.closest("tr")?.dataset.id;
    this._activeCell.classList.remove("p01-editing");
    this._activeCell.textContent = newValue;
    if (newValue !== this._originalValue) {
      this._activeCell.classList.add("p01-edited");
      this.onSave({ rowId, field, oldValue: this._originalValue, newValue });
    }
    this._activeCell = null;
    this._originalValue = null;
  }
  cancel() {
    if (!this._activeCell) return;
    this._activeCell.classList.remove("p01-editing");
    this._activeCell.textContent = this._originalValue;
    this.onCancel();
    this._activeCell = null;
    this._originalValue = null;
  }
  isEditing() {
    return this._activeCell !== null;
  }
  getActiveCell() {
    return this._activeCell;
  }
}
function createInlineEditor(options = {}) {
  return new InlineEditor(options);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var inline_edit_default = { InlineEditor, createInlineEditor };
export {
  InlineEditor,
  MODULE_ID,
  VERSION,
  createInlineEditor,
  inline_edit_default as default,
  healthCheck,
  info
};
