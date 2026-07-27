function slugify(s) {
  return String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function buildItemKey(groupKey, label) {
  const base = groupKey && groupKey.includes(".grp-") ? groupKey.replace(".grp-", ".") : groupKey || "sidebar.custom";
  return `${base}.${slugify(label)}`;
}
function deriveRoute(itemKey) {
  const path = String(itemKey ?? "").replace(/^sidebar\./, "").replace(/\./g, "/");
  return `#/${path}`;
}
function validateCreate(form) {
  const errors = [];
  if (!form.label || !form.label.trim()) errors.push("Informe o label do bot\xE3o.");
  else if (!slugify(form.label)) errors.push("Label inv\xE1lido (sem caracteres aproveit\xE1veis para a chave).");
  if (!form.group) errors.push("Selecione o grupo.");
  if (!form.panel_id) errors.push("Selecione o painel de destino (ou placeholder).");
  return { valid: errors.length === 0, errors };
}
function formFromItem(item) {
  return {
    label: item.label ?? "",
    icon: item.icon ?? "",
    group: item.parentKey ?? "",
    panel_id: item.panelId ?? "",
    route_path: item.href ?? "",
    is_active: item.isActive === true
  };
}
function buildUpdatePayload(item, form) {
  const href = form.route_path && form.route_path.trim() || item.href || deriveRoute(item.id);
  return {
    sourceTable: item.sourceTable,
    sourceId: item.sourceId,
    label: form.label.trim(),
    icon: form.icon && form.icon.trim() || "circle",
    href,
    panelId: form.panel_id,
    parentKey: form.group,
    isActive: form.is_active === true,
    isVisible: true
  };
}
function buildTogglePayload(item) {
  return {
    sourceTable: item.sourceTable,
    sourceId: item.sourceId,
    isActive: !item.isActive
  };
}
function buildCreatePayload(form) {
  const itemKey = buildItemKey(form.group, form.label);
  const href = form.route_path && form.route_path.trim() || deriveRoute(itemKey);
  return {
    id: itemKey,
    label: form.label.trim(),
    href,
    icon: form.icon && form.icon.trim() || "circle",
    panelId: form.panel_id,
    parentKey: form.group,
    section: "sidebar",
    itemType: "navigation",
    order: 99,
    isActive: form.is_active === true,
    isVisible: true
  };
}
export {
  buildCreatePayload,
  buildItemKey,
  buildTogglePayload,
  buildUpdatePayload,
  deriveRoute,
  formFromItem,
  slugify,
  validateCreate
};
