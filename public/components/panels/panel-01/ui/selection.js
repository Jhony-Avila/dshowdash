const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/selection";
class SelectionManager {
  constructor(options = {}) {
    this.selected = /* @__PURE__ */ new Set();
    this.onSelectionChange = options.onSelectionChange || (() => {
    });
  }
  toggle(id) {
    if (this.selected.has(id)) this.selected.delete(id);
    else this.selected.add(id);
    this._notify();
  }
  select(id) {
    this.selected.add(id);
    this._notify();
  }
  deselect(id) {
    this.selected.delete(id);
    this._notify();
  }
  selectAll(ids) {
    ids.forEach((id) => this.selected.add(id));
    this._notify();
  }
  deselectAll() {
    this.selected.clear();
    this._notify();
  }
  isSelected(id) {
    return this.selected.has(id);
  }
  getSelected() {
    return Array.from(this.selected);
  }
  count() {
    return this.selected.size;
  }
  _notify() {
    this.onSelectionChange({
      selected: this.getSelected(),
      count: this.count()
    });
  }
  destroy() {
    this.selected.clear();
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var selection_default = SelectionManager;
export {
  MODULE_ID,
  SelectionManager,
  VERSION,
  selection_default as default,
  healthCheck,
  info
};
