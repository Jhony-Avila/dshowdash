import { PERMISSION_LEVELS } from "../core/contracts.js";
const MODULE_ID = "panel-nav-admin-mappers";
const VERSION = "10.0.0-UNIFIED-SSOT";
const CONTEXT_LABELS = {
  sidebar: "Sidebar",
  navrail: "NavRail",
  header: "Header",
  footer: "Footer"
};
const SOURCE_LABELS = {
  ui_nav_items: "Sidebar",
  navrail_items: "NavRail",
  header_components: "Header",
  footer_items: "Footer"
};
function mapItemToViewModel(item, index = 0) {
  let levelInfo = PERMISSION_LEVELS.find((l) => l.value === (item.minLevel || 0)) || PERMISSION_LEVELS[0];
  return {
    // Identity
    id: item.id,
    sourceId: item.sourceId,
    sourceTable: item.sourceTable,
    // Display
    label: item.label,
    displayTitle: item.displayTitle || null,
    href: item.href,
    icon: item.icon,
    description: item.description || null,
    // Context & hierarchy (section = display_context in unified model)
    section: item.section,
    sectionLabel: CONTEXT_LABELS[item.section] || item.section,
    parentKey: item.parentKey || null,
    parentLabel: item.parentLabel || null,
    itemType: item.itemType || "navigation",
    // Panel
    panelId: item.panelId || null,
    // State
    minLevel: item.minLevel,
    isDivider: item.isDivider,
    isActive: item.isActive,
    isVisible: item.isVisible !== false,
    roles: item.roles,
    order: item.order !== void 0 ? item.order : index,
    // Derived display fields
    minLevelLabel: levelInfo.label,
    minLevelDescription: levelInfo.description,
    hasIcon: !!item.icon && item.icon !== "default",
    isAdmin: item.section === "admin" || item.parentKey && item.parentKey.indexOf("admin") !== -1,
    displayHref: item.isDivider ? "(divisor)" : item.href || item.panelId || "-",
    typeLabel: item.isDivider ? "Divisor" : item.itemType || "Link",
    contextLabel: CONTEXT_LABELS[item.section] || item.section,
    sourceLabel: SOURCE_LABELS[item.sourceTable] || item.sourceTable
  };
}
function mapItemsToViewModel(items) {
  return items.map((item, i) => mapItemToViewModel(item, i));
}
function mapSectionToViewModel(key, section, itemCount = 0) {
  return {
    key,
    label: section.label || key.charAt(0).toUpperCase() + key.slice(1),
    displayLabel: section.label || `[${key}]`,
    order: section.order || section.order_index || 99,
    icon: section.icon || section.icon_name,
    context: section.display_context || section.context || "sidebar",
    contextLabel: CONTEXT_LABELS[section.display_context || section.context] || "Sidebar",
    sourceTable: section.source_table || null,
    sourceId: section.source_id || null,
    hasLabel: !!section.label,
    hasIcon: !!(section.icon || section.icon_name),
    itemCount,
    isEmpty: itemCount === 0
  };
}
function mapSectionsToViewModel(sections, items = []) {
  const itemCountByContext = {};
  const itemCountByParent = {};
  items.forEach((item) => {
    const ctx = item.section || "sidebar";
    const pk = item.parentKey || item.parent_key || "_none";
    itemCountByContext[ctx] = (itemCountByContext[ctx] || 0) + 1;
    itemCountByParent[pk] = (itemCountByParent[pk] || 0) + 1;
  });
  if (Array.isArray(sections)) {
    return sections.map((s) => {
      const key = s.group_key || s.key || s.item_key;
      const count = itemCountByParent[key] || 0;
      return mapSectionToViewModel(key, s, count);
    }).sort((a, b) => {
      const ctxOrder = { sidebar: 0, navrail: 1, header: 2, footer: 3 };
      const ca = ctxOrder[a.context] ?? 99;
      const cb = ctxOrder[b.context] ?? 99;
      if (ca !== cb) return ca - cb;
      return a.order - b.order;
    });
  }
  return Object.entries(sections).map(([key, section]) => mapSectionToViewModel(key, section, itemCountByContext[key] || 0)).sort((a, b) => a.order - b.order);
}
function mapIconsToSelector(icons) {
  return icons.map((icon) => ({
    value: icon,
    label: icon.charAt(0).toUpperCase() + icon.slice(1).replace(/-/g, " ")
  }));
}
function mapPermissionLevelsToSelect() {
  return PERMISSION_LEVELS.map((level) => ({
    value: level.value,
    label: `${level.value} - ${level.label}`,
    description: level.description
  }));
}
function mapFormToItem(formData) {
  let roles = formData.roles;
  if (!Array.isArray(roles)) roles = roles ? [roles] : [];
  return {
    id: formData.id ? formData.id.trim().toLowerCase().replace(/[^a-z0-9-_.]/g, "-") : "",
    label: formData.label ? formData.label.trim() : "",
    href: formData.isDivider ? null : formData.href ? formData.href.trim() : "",
    icon: formData.icon || "default",
    section: formData.section || "sidebar",
    parentKey: formData.parentKey || null,
    minLevel: parseInt(formData.minLevel) || 0,
    isDivider: formData.isDivider === true || formData.isDivider === "true",
    isActive: formData.isActive !== false && formData.isActive !== "false",
    isVisible: formData.isVisible !== false && formData.isVisible !== "false",
    panelId: formData.panelId || null,
    itemType: formData.itemType || "navigation",
    description: formData.description || null,
    uarpsTrigger: formData.uarpsTrigger || null,
    sourceTable: formData.sourceTable || null,
    sourceId: formData.sourceId || null,
    roles
  };
}
function mapItemToForm(item) {
  return {
    id: item.id || "",
    label: item.label || "",
    href: item.href || "",
    icon: item.icon || "default",
    section: item.section || "sidebar",
    parentKey: item.parentKey || "",
    minLevel: String(item.minLevel || 0),
    isDivider: !!item.isDivider,
    isActive: item.isActive !== false,
    isVisible: item.isVisible !== false,
    panelId: item.panelId || "",
    itemType: item.itemType || "navigation",
    description: item.description || "",
    uarpsTrigger: item.uarpsTrigger || "",
    sourceTable: item.sourceTable || "",
    sourceId: item.sourceId || "",
    roles: item.roles || []
  };
}
function mapFormToSection(formData) {
  return {
    key: formData.key ? formData.key.trim().toLowerCase().replace(/[^a-z0-9-_.]/g, "-") : "",
    label: formData.label ? formData.label.trim() : null,
    order_index: parseInt(formData.order) || 1,
    icon: formData.icon || null,
    display_context: formData.context || "sidebar"
  };
}
function mapSectionToForm(key, section) {
  return {
    key: key || "",
    label: section?.label || "",
    order: String(section?.order || section?.order_index || 1),
    icon: section?.icon || section?.icon_name || "",
    context: section?.display_context || section?.context || "sidebar"
  };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var mappers_default = { MODULE_ID, VERSION, mapItemToViewModel, mapItemsToViewModel, mapSectionToViewModel, mapSectionsToViewModel, mapIconsToSelector, mapPermissionLevelsToSelect, mapFormToItem, mapItemToForm, mapFormToSection, mapSectionToForm, info, healthCheck, CONTEXT_LABELS, SOURCE_LABELS };
export {
  MODULE_ID,
  VERSION,
  mappers_default as default,
  healthCheck,
  info,
  mapFormToItem,
  mapFormToSection,
  mapIconsToSelector,
  mapItemToForm,
  mapItemToViewModel,
  mapItemsToViewModel,
  mapPermissionLevelsToSelect,
  mapSectionToForm,
  mapSectionToViewModel,
  mapSectionsToViewModel
};
