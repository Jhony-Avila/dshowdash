const VERSION = "7.4.0-P2-ENTERPRISE";
const MODULE_ID = "sidebar.integration.navigation-model-loader.utils.helpers";
const isValidModel = (model) => {
  if (!model || typeof model !== "object") return false;
  if (Array.isArray(model.items) && model.items.length > 0) return true;
  if (Array.isArray(model.tree) && model.tree.length > 0) return true;
  if (Array.isArray(model.sections) && model.sections.length > 0) return true;
  return false;
};
const convertApiToSections = (apiData) => {
  if (!apiData) return [];
  if (Array.isArray(apiData.sections) && apiData.sections.length > 0) {
    return apiData.sections;
  }
  if (Array.isArray(apiData.items) && apiData.items.length > 0) {
    return buildSectionsFromItems(apiData.items);
  }
  if (Array.isArray(apiData.tree) && apiData.tree.length > 0) {
    const sections = buildSectionsFromTree(apiData.tree);
    if (sections.length > 0) return sections;
  }
  return [];
};
function buildSectionsFromItems(items) {
  const groups = {};
  items.forEach((item) => {
    if (item.item_type === "group" && item.is_active === 1 && item.is_visible === 1) {
      groups[item.item_key] = {
        id: item.item_key || `sec-${item.id}`,
        label: item.label || item.item_key || "Section",
        icon: item.icon || "folder",
        order: item.order_index || 0,
        accordion: {
          default_open: item.is_expanded === 1,
          collapsible: true
        },
        visible: true,
        items: []
      };
    }
  });
  items.forEach((item) => {
    if (item.item_type === "navigation" && item.parent_key && groups[item.parent_key]) {
      if (item.is_active === 1 && item.is_visible === 1) {
        groups[item.parent_key].items.push({
          id: item.item_key || `item-${item.id}`,
          label: item.label || item.item_key || "Item",
          displayTitle: item.display_title || null,
          icon: item.icon || "file",
          order: item.order_index || 0,
          route: item.route_path || null,
          panelId: item.panel_id || null,
          navigation: {
            mode: item.intent_id ? "action" : "route",
            action: item.intent_id ? `panel:${item.intent_id}` : null
          },
          state: {
            disabled: item.is_disabled === 1
          },
          badge: item.badge_key || null
        });
      }
    }
  });
  Object.values(groups).forEach((group) => {
    group.items.sort((a, b) => a.order - b.order);
  });
  return Object.values(groups).filter((section) => section.items.length > 0).sort((a, b) => a.order - b.order);
}
function buildSectionsFromTree(tree) {
  return tree.filter((item) => item.item_type === "group" && item.is_active === 1 && item.is_visible === 1).filter((group) => group.children && group.children.length > 0).map((group) => ({
    id: group.item_key || group.id,
    label: group.label || group.item_key || "Section",
    icon: group.icon || "folder",
    order: group.order_index || 0,
    accordion: {
      default_open: group.is_expanded === 1,
      collapsible: true
    },
    visible: true,
    items: (group.children || []).filter((child) => child.item_type === "navigation" && child.is_active === 1 && child.is_visible === 1).map((child) => ({
      id: child.item_key || child.id,
      label: child.label || child.item_key || "Item",
      displayTitle: child.display_title || null,
      icon: child.icon || "file",
      order: child.order_index || 0,
      route: child.route_path || null,
      panelId: child.panel_id || null,
      navigation: {
        mode: child.intent_id ? "action" : "route",
        action: child.intent_id ? `panel:${child.intent_id}` : null
      },
      state: {
        disabled: child.is_disabled === 1
      },
      badge: child.badge_key || null
    })).sort((a, b) => a.order - b.order)
  })).filter((section) => section.items.length > 0).sort((a, b) => a.order - b.order);
}
const normalizeModel = (model) => {
  if (!model) return null;
  const sections = convertApiToSections(model);
  return {
    version: model.version || "api",
    generated: model.generated || Date.now(),
    source: model.source || "api",
    sections,
    metadata: model.metadata || {}
  };
};
const getSectionById = (model, sectionId) => {
  if (!model?.sections) return null;
  return model.sections.find((s) => s.id === sectionId) || null;
};
const getItemByPath = (model, path) => {
  if (!model?.sections || !path) return null;
  for (const section of model.sections) {
    if (!section.items) continue;
    const item = section.items.find((i) => i.path === path || i.route === path);
    if (item) return { section, item };
  }
  return null;
};
const filterByPermission = (model, userPermissions = []) => {
  if (!model?.sections) return model;
  const filtered = {
    ...model,
    sections: model.sections.map((section) => ({
      ...section,
      items: (section.items || []).filter((item) => {
        if (!item.permission) return true;
        return userPermissions.includes(item.permission);
      })
    })).filter((section) => section.items.length > 0)
  };
  return filtered;
};
const countItems = (model) => {
  if (!model?.sections) return 0;
  return model.sections.reduce((acc, section) => acc + (section.items?.length || 0), 0);
};
export {
  MODULE_ID,
  VERSION,
  convertApiToSections,
  countItems,
  filterByPermission,
  getItemByPath,
  getSectionById,
  isValidModel,
  normalizeModel
};
