import { GROUPS } from "../groups.js";
import { ITEMS, MOBILE_ITEMS } from "../items.js";
const MODULE_ID = "navrail-registry-processor";
const VERSION = "5.1.0-ES6";
function processAPIData(data) {
  if (data.groups && data.items) {
    return processNewAPIFormat(data);
  }
  if (data.navigation && Array.isArray(data.navigation)) {
    return processNavigationFormat(data);
  }
  return { groups: [], items: [], mobileItems: [], config: data.config || {}, userLevel: data.userLevel || 0 };
}
function processNewAPIFormat(data) {
  const groups = (data.groups || []).map((group) => ({
    id: group.id,
    label: group.label,
    description: group.description,
    icon: group.icon,
    order: group.order || 0,
    position: group.position || "top",
    isCollapsible: group.isCollapsible || false,
    minLevel: group.minLevel || 0,
    _raw: group
  }));
  const items = (data.items || []).map((item) => {
    const action = item.action || {};
    const panelId = item.panelId || action.panelId || null;
    const route = item.route || action.route || null;
    const intentId = item.intentId || `navrail.open.${item.id}`;
    return {
      id: item.id,
      icon: item.icon,
      label: item.label,
      tooltip: item.tooltip || item.label,
      group: item.group,
      intentId,
      route,
      panelId,
      action: { type: action.type || "openPanel", panelId, route },
      order: item.order || 0,
      hidden: false,
      showOnMobile: item.showOnMobile !== false,
      showOnTablet: item.showOnTablet !== false,
      showOnDesktop: item.showOnDesktop !== false,
      minLevel: item.minLevel || 0,
      badge: item.badge ? { type: item.badge.type, source: item.badge.source } : null,
      config: item.config || null,
      _raw: item
    };
  });
  return { groups, items, mobileItems: data.mobileItems || [], config: data.config || {}, userLevel: data.userLevel || 0, preferences: data.preferences || {} };
}
function processNavigationFormat(data) {
  const navigation = data.navigation || [];
  const preferences = data.preferences || {};
  const groupsMap = {};
  const items = [];
  navigation.forEach((item) => {
    if (item.is_active === false) return;
    let groupId = "main";
    if (item.sort_order >= 99) {
      groupId = "bottom";
    } else if (item.sort_order >= 10) {
      groupId = "tools";
    }
    if (!groupsMap[groupId]) {
      groupsMap[groupId] = { id: groupId, label: groupId === "main" ? "Principal" : groupId === "tools" ? "Ferramentas" : "A\xE7\xF5es", order: groupId === "main" ? 0 : groupId === "tools" ? 50 : 99, position: groupId === "bottom" ? "bottom" : "top" };
    }
    const mappedItem = {
      id: item.nav_key || `item-${item.id}`,
      icon: item.icon || "circle",
      label: item.label || item.nav_key || "Item",
      tooltip: item.label || item.nav_key,
      group: groupId,
      intentId: `navrail.open.${item.nav_key || item.id}`,
      route: item.route ? `#/${item.nav_key}` : null,
      panelId: item.route || null,
      action: item.route ? { type: "openPanel", panelId: item.route } : null,
      order: item.sort_order || 0,
      hidden: false,
      showOnMobile: true,
      showOnTablet: true,
      showOnDesktop: true,
      minLevel: item.min_level || 0,
      badge: item.badge_type !== "none" ? { type: item.badge_type, endpoint: item.badge_endpoint } : null,
      _raw: item
    };
    items.push(mappedItem);
    const children = item.children;
    if (children && children.length > 0) {
      children.forEach((child) => {
        if (child.is_active === false) return;
        const childItem = {
          id: child.nav_key || `item-${child.id}`,
          icon: child.icon || "circle",
          label: child.label || child.nav_key || "Item",
          tooltip: child.label || child.nav_key,
          group: groupId,
          parentId: item.nav_key,
          intentId: `navrail.open.${child.nav_key || child.id}`,
          route: child.route ? `#/${child.nav_key}` : null,
          panelId: child.route || null,
          action: child.route ? { type: "openPanel", panelId: child.route } : null,
          order: child.sort_order || 0,
          hidden: false,
          showOnMobile: true,
          showOnTablet: true,
          showOnDesktop: true,
          minLevel: child.min_level || 0,
          badge: child.badge_type !== "none" ? { type: child.badge_type, endpoint: child.badge_endpoint } : null,
          _raw: child
        };
        items.push(childItem);
      });
    }
  });
  const groups = Object.values(groupsMap).sort((a, b) => a.order - b.order);
  items.sort((a, b) => a.order - b.order);
  const mobileItems = items.filter((item) => item.showOnMobile).slice(0, 5).map((item) => item.id);
  return { groups, items, mobileItems, config: data.config || {}, userLevel: data.userLevel || 0, preferences };
}
function generateFallback() {
  const groups = GROUPS.map((g) => ({
    id: g.id,
    label: g.label,
    order: g.order,
    position: g.order >= 99 ? "bottom" : "top"
  }));
  const items = ITEMS.map((item) => ({
    id: item.id,
    icon: item.icon,
    label: item.label,
    tooltip: item.label,
    group: item.group,
    intentId: item.intentId,
    route: item.route,
    panelId: item.panelId,
    action: item.action || { type: "openPanel", panelId: item.panelId },
    order: item.order || 0,
    hidden: item.hidden || false,
    showOnMobile: true,
    showOnTablet: true,
    showOnDesktop: true
  }));
  return { groups, items, mobileItems: MOBILE_ITEMS, config: {}, userLevel: 0 };
}
var processor_default = { processAPIData, generateFallback };
export {
  MODULE_ID,
  VERSION,
  processor_default as default,
  generateFallback,
  processAPIData
};
