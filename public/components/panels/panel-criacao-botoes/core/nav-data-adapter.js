import * as shared from "/components/panels/panel-nav-admin/core/nav-adapter.js";
async function fetchItems(forceRefresh = true, opts = {}) {
  const res = await shared.fetchItems(forceRefresh, opts);
  if (res && res.success && Array.isArray(res.data)) {
    const mapped = await shared.getItems(false);
    return { success: true, data: mapped };
  }
  return res;
}
function fetchSections(opts = {}) {
  return shared.fetchSections({ context: "sidebar", ...opts });
}
function fetchAvailableRoutes(forceRefresh = false, opts = {}) {
  return shared.fetchAvailableRoutes(forceRefresh, opts);
}
function createItem(item, opts = {}) {
  return shared.createItem(item, opts);
}
function updateItem(itemId, updates, opts = {}) {
  return shared.updateItem(itemId, updates, opts);
}
export {
  createItem,
  fetchAvailableRoutes,
  fetchItems,
  fetchSections,
  updateItem
};
