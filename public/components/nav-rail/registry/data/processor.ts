// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: navrail-registry-processor
// PURPOSE: NavRail Registry - Data Processor
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   GROUPS from ../groups.js
//   ITEMS, MOBILE_ITEMS from ../items.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   processAPIData() — exported function
//   generateFallback() — exported function
//
// RECEIVES (via init/options): (see init function if present)
//
// EMITS (eventos):
//   (none)
//
// LISTENS (eventos):
//   (none)
//
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { GROUPS } from '../groups.js';
import { ITEMS, MOBILE_ITEMS } from '../items.js';

export const MODULE_ID = 'navrail-registry-processor';
export const VERSION = '5.1.0-ES6';

export function processAPIData(data: Record<string, unknown>) {
  if (data.groups && data.items) {
    return processNewAPIFormat(data);
  }
  if (data.navigation && Array.isArray(data.navigation)) {
    return processNavigationFormat(data);
  }
  return { groups: [] as Record<string, unknown>[], items: [] as Record<string, unknown>[], mobileItems: [] as unknown[], config: data.config || {}, userLevel: data.userLevel || 0 };
}

function processNewAPIFormat(data: Record<string, unknown>) {
  const groups = ((data.groups as Record<string, unknown>[]) || []).map(group => ({
    id: group.id,
    label: group.label,
    description: group.description,
    icon: group.icon,
    order: group.order || 0,
    position: group.position || 'top',
    isCollapsible: group.isCollapsible || false,
    minLevel: group.minLevel || 0,
    _raw: group
  }));

  const items = ((data.items as Record<string, unknown>[]) || []).map(item => {
    const action = (item.action as Record<string, unknown>) || {};
    const panelId = item.panelId || action.panelId || null;
    const route = item.route || action.route || null;
    const intentId = item.intentId || (`navrail.open.${item.id}`);
    
    return {
      id: item.id,
      icon: item.icon,
      label: item.label,
      tooltip: item.tooltip || item.label,
      group: item.group,
      intentId,
      route,
      panelId,
      action: { type: action.type || 'openPanel', panelId, route },
      order: item.order || 0,
      hidden: false,
      showOnMobile: item.showOnMobile !== false,
      showOnTablet: item.showOnTablet !== false,
      showOnDesktop: item.showOnDesktop !== false,
      minLevel: item.minLevel || 0,
      badge: item.badge ? { type: (item.badge as Record<string, unknown>).type, source: (item.badge as Record<string, unknown>).source } : null,
      config: item.config || null,
      _raw: item
    };
  });

  return { groups, items, mobileItems: data.mobileItems || [], config: data.config || {}, userLevel: data.userLevel || 0, preferences: data.preferences || {} };
}

function processNavigationFormat(data: Record<string, unknown>) {
  const navigation = (data.navigation as Record<string, unknown>[]) || [];
  const preferences = data.preferences || {};
  
  const groupsMap: Record<string, { id: string; label: string; order: number; position: string }> = {};
  const items: Array<{ id: unknown; icon: unknown; label: unknown; tooltip: unknown; group: string; parentId?: unknown; intentId: string; route: string | null; panelId: unknown; action: Record<string, unknown> | null; order: unknown; hidden: boolean; showOnMobile: boolean; showOnTablet: boolean; showOnDesktop: boolean; minLevel: unknown; badge: Record<string, unknown> | null; _raw: Record<string, unknown> }> = [];
  
  navigation.forEach(item => {
    if (item.is_active === false) return;
    
    let groupId = 'main';
    if ((item.sort_order as number) >= 99) { groupId = 'bottom'; }
    else if ((item.sort_order as number) >= 10) { groupId = 'tools'; }
    
    if (!groupsMap[groupId]) {
      groupsMap[groupId] = { id: groupId, label: groupId === 'main' ? 'Principal' : (groupId === 'tools' ? 'Ferramentas' : 'Ações'), order: groupId === 'main' ? 0 : (groupId === 'tools' ? 50 : 99), position: groupId === 'bottom' ? 'bottom' : 'top' };
    }
    
    const mappedItem = {
      id: item.nav_key || (`item-${item.id}`),
      icon: item.icon || 'circle',
      label: item.label || item.nav_key || 'Item',
      tooltip: item.label || item.nav_key,
      group: groupId,
      intentId: `navrail.open.${item.nav_key || item.id}`,
      route: item.route ? `#/${item.nav_key}` : null,
      panelId: item.route || null,
      action: item.route ? { type: 'openPanel', panelId: item.route } : null,
      order: item.sort_order || 0,
      hidden: false,
      showOnMobile: true,
      showOnTablet: true,
      showOnDesktop: true,
      minLevel: item.min_level || 0,
      badge: item.badge_type !== 'none' ? { type: item.badge_type, endpoint: item.badge_endpoint } : null,
      _raw: item
    };
    
    items.push(mappedItem);
    
    const children = item.children as Record<string, unknown>[] | undefined;
    if (children && children.length > 0) {
      children.forEach(child => {
        if (child.is_active === false) return;
        
        const childItem = {
          id: child.nav_key || (`item-${child.id}`),
          icon: child.icon || 'circle',
          label: child.label || child.nav_key || 'Item',
          tooltip: child.label || child.nav_key,
          group: groupId,
          parentId: item.nav_key,
          intentId: `navrail.open.${child.nav_key || child.id}`,
          route: child.route ? `#/${child.nav_key}` : null,
          panelId: child.route || null,
          action: child.route ? { type: 'openPanel', panelId: child.route } : null,
          order: child.sort_order || 0,
          hidden: false,
          showOnMobile: true,
          showOnTablet: true,
          showOnDesktop: true,
          minLevel: child.min_level || 0,
          badge: child.badge_type !== 'none' ? { type: child.badge_type, endpoint: child.badge_endpoint } : null,
          _raw: child
        };
        
        items.push(childItem);
      });
    }
  });
  
  const groups = Object.values(groupsMap).sort((a, b) => a.order - b.order);
  items.sort((a, b) => (a.order as number) - (b.order as number));
  
  const mobileItems = items.filter(item => item.showOnMobile).slice(0, 5).map(item => item.id);
  
  return { groups, items, mobileItems, config: data.config || {}, userLevel: data.userLevel || 0, preferences };
}

export function generateFallback() {
  const groups = GROUPS.map(g => ({
    id: g.id,
    label: g.label,
    order: g.order,
    position: g.order >= 99 ? 'bottom' : 'top'
  }));

  const items = ITEMS.map((item: Record<string, unknown>) => ({
    id: item.id,
    icon: item.icon,
    label: item.label,
    tooltip: item.label,
    group: item.group,
    intentId: item.intentId,
    route: item.route,
    panelId: item.panelId,
    action: item.action || { type: 'openPanel', panelId: item.panelId },
    order: item.order || 0,
    hidden: item.hidden || false,
    showOnMobile: true,
    showOnTablet: true,
    showOnDesktop: true
  }));

  return { groups, items, mobileItems: MOBILE_ITEMS, config: {}, userLevel: 0 };
}

export default { processAPIData, generateFallback };
