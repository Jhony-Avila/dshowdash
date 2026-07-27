const UNGROUPED_KEY = "__ungrouped__";
const UNGROUPED_LABEL = "Sem grupo";
function buildGroups(items, sections) {
  const navItems = (items || []).filter(
    (i) => i.section === "sidebar" && i.itemType === "navigation"
  );
  const sidebarSections = (sections || []).filter((s) => (s.display_context ?? "sidebar") === "sidebar").slice().sort((a, b) => Number(a.order_index ?? 0) - Number(b.order_index ?? 0));
  const knownKeys = new Set(sidebarSections.map((s) => s.group_key));
  const byOrder = (a, b) => a.order - b.order;
  const groups = sidebarSections.map((s) => ({
    group_key: s.group_key,
    label: s.label,
    order_index: Number(s.order_index ?? 0),
    items: navItems.filter((i) => i.parentKey === s.group_key).sort(byOrder)
  }));
  const orphans = navItems.filter((i) => !i.parentKey || !knownKeys.has(i.parentKey)).sort(byOrder);
  if (orphans.length > 0) {
    groups.push({
      group_key: UNGROUPED_KEY,
      label: UNGROUPED_LABEL,
      order_index: Number.MAX_SAFE_INTEGER,
      items: orphans
    });
  }
  return groups;
}
function findItem(groups, id) {
  for (const g of groups || []) {
    const found = g.items.find((i) => i.id === id);
    if (found) return found;
  }
  return null;
}
function deriveIcons(items) {
  const set = /* @__PURE__ */ new Set();
  for (const i of items || []) {
    if (i.icon) set.add(i.icon);
  }
  return Array.from(set).sort();
}
export {
  buildGroups,
  deriveIcons,
  findItem
};
