import { MultiSortManager } from "./multi-sort.js";
import { SortingManager } from "./sorting.js";
import { InlineEditor } from "./inline-edit.js";
import { GroupingManager } from "./grouping.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/table/init-core-managers";
function initCoreManagers(ctx, features, config, callbacks) {
  const managers = { multiSort: null, sorting: null, inlineEditor: null, grouping: null };
  if (features.multiSort) {
    managers.multiSort = new MultiSortManager({
      maxSorts: config.maxSorts,
      onSort: (sorts) => {
        if (sorts.length > 0) callbacks.onSort(sorts[0].field, { shiftKey: sorts.length > 1, sorts });
      }
    });
  }
  managers.sorting = new SortingManager({
    defaultField: config.defaultSort.field,
    defaultOrder: config.defaultSort.order,
    onSort: (sort) => {
      if (!features.multiSort) callbacks.onSort(sort.field, { sorts: [sort] });
    }
  });
  if (features.inlineEdit) {
    managers.inlineEditor = new InlineEditor({
      editableFields: config.editableFields,
      onSave: (data) => callbacks.onInlineEdit(data),
      onCancel: () => {
      }
    });
  }
  if (features.grouping) {
    managers.grouping = new GroupingManager({
      onGroupChange: (field) => callbacks.onGroupChange(field)
    });
  }
  return managers;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
export {
  MODULE_ID,
  VERSION,
  healthCheck,
  info,
  initCoreManagers
};
