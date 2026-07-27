const MODULE_ID = "panel-01.ui.table.api-getters";
const VERSION = "9.3.0-P2-ENTERPRISE";
function createTableGetters(tableState) {
  return {
    getData() {
      return [...tableState.data];
    },
    getSelectedRows() {
      return [...tableState.selectedRows];
    },
    getColumns() {
      return [...tableState.columns];
    },
    getSortConfig() {
      return { ...tableState.sortConfig };
    },
    getFilters() {
      return { ...tableState.filters };
    },
    getPagination() {
      return { ...tableState.pagination };
    },
    getRowCount() {
      return tableState.data.length;
    },
    isLoading() {
      return tableState.loading;
    }
  };
}
var api_getters_default = { createTableGetters };
export {
  MODULE_ID,
  VERSION,
  createTableGetters,
  api_getters_default as default
};
