import * as Helpers from "./helpers.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/table/api-helpers";
const applyHelpersMixin = (TableComponent) => {
  const proto = TableComponent.prototype;
  proto.highlightRow = function(id, duration) {
    Helpers.highlightRow(this.container, id, duration);
  };
  proto.scrollToRow = function(id, behavior) {
    Helpers.scrollToRow(this.container, id, behavior);
  };
  proto.focusRow = function(id) {
    Helpers.focusRow(this.container, id);
  };
  proto.getRowById = function(id) {
    return Helpers.getRowById(this.container, id);
  };
  proto.getAllRows = function() {
    return Helpers.getAllRows(this.container);
  };
  proto.getSelectedRows = function() {
    return Helpers.getSelectedRows(this.container);
  };
  proto.getVisibleRows = function() {
    return Helpers.getVisibleRows(this.container);
  };
  proto.getNextRow = function(currentId) {
    return Helpers.getNextRow(this.container, currentId);
  };
  proto.getPrevRow = function(currentId) {
    return Helpers.getPrevRow(this.container, currentId);
  };
  proto.getFirstRow = function() {
    return Helpers.getFirstRow(this.container);
  };
  proto.getLastRow = function() {
    return Helpers.getLastRow(this.container);
  };
  proto.setRowState = function(id, state) {
    Helpers.setRowState(this.container, id, state);
  };
  proto.updateRow = function(id, data) {
    const row = this.getRowById(id);
    if (row && data) {
      Object.keys(data).forEach((field) => {
        const cell = row.querySelector(`td[data-field="${field}"]`);
        if (cell) cell.textContent = data[field];
      });
    }
  };
};
const info = () => ({ moduleId: MODULE_ID, version: VERSION });
const healthCheck = () => ({ status: "HEALTHY", moduleId: MODULE_ID, version: VERSION });
export {
  MODULE_ID,
  VERSION,
  applyHelpersMixin,
  healthCheck,
  info
};
