// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.0.0-UNIFIED-SSOT)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin-mappers
// PURPOSE: Mappers - Panel Nav Admin (Unified SSOT)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   PERMISSION_LEVELS from ../core/contracts.js
//
// @changelog
//   10.0.0-UNIFIED-SSOT: MAJOR — supports unified API response from 4 tables.
//     New fields: sourceId, sourceTable, display_context as section, parentKey, parentLabel.
//     mapItemToViewModel now includes display_context, parentKey, sourceTable, sourceId.
//     mapSectionToViewModel adapted for unified sections (groups from all contexts).
//   9.3.0-P2-ENTERPRISE: Previous version
// ═══════════════════════════════════════════════════════════════
'use strict';

import { PERMISSION_LEVELS } from '../core/contracts.js';

export const MODULE_ID = 'panel-nav-admin-mappers';
export const VERSION = '10.0.0-UNIFIED-SSOT';

// ─── Display context labels ───
const CONTEXT_LABELS = {
  sidebar: 'Sidebar',
  navrail: 'NavRail',
  header: 'Header',
  footer: 'Footer',
};

// ─── Source table labels ───
const SOURCE_LABELS = {
  ui_nav_items: 'Sidebar',
  navrail_items: 'NavRail',
  header_components: 'Header',
  footer_items: 'Footer',
};

// Mapear item para ViewModel (exibição na lista)
export function mapItemToViewModel(item: Record<string, unknown>, index = 0) {
  let levelInfo = (PERMISSION_LEVELS as { value: number; label: string; description: string }[]).find(l => l.value === (item.minLevel || 0)) || (PERMISSION_LEVELS as { value: number; label: string; description: string }[])[0];

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
    sectionLabel: (CONTEXT_LABELS as Record<string, string>)[item.section as string] || item.section,
    parentKey: item.parentKey || null,
    parentLabel: item.parentLabel || null,
    itemType: item.itemType || 'navigation',

    // Panel
    panelId: item.panelId || null,

    // State
    minLevel: item.minLevel,
    isDivider: item.isDivider,
    isActive: item.isActive,
    isVisible: item.isVisible !== false,
    roles: item.roles,
    order: item.order !== undefined ? item.order : index,

    // Derived display fields
    minLevelLabel: levelInfo.label,
    minLevelDescription: levelInfo.description,
    hasIcon: !!item.icon && item.icon !== 'default',
    isAdmin: item.section === 'admin' || (item.parentKey && (item.parentKey as string).indexOf('admin') !== -1),
    displayHref: item.isDivider ? '(divisor)' : (item.href || item.panelId || '-'),
    typeLabel: item.isDivider ? 'Divisor' : (item.itemType || 'Link'),
    contextLabel: (CONTEXT_LABELS as Record<string, string>)[item.section as string] || item.section,
    sourceLabel: (SOURCE_LABELS as Record<string, string>)[item.sourceTable as string] || item.sourceTable,
  };
}

// Mapear lista de itens para ViewModel
export function mapItemsToViewModel(items: Record<string, unknown>[]) {
  return items.map((item: Record<string, unknown>, i: number) => mapItemToViewModel(item, i));
}

// Mapear seção/grupo para ViewModel (unified: groups from all contexts)
export function mapSectionToViewModel(key: string, section: Record<string, unknown>, itemCount = 0) {
  return {
    key,
    label: section.label || key.charAt(0).toUpperCase() + key.slice(1),
    displayLabel: section.label || `[${key}]`,
    order: section.order || section.order_index || 99,
    icon: section.icon || section.icon_name,
    context: section.display_context || section.context || 'sidebar',
    contextLabel: (CONTEXT_LABELS as Record<string, string>)[(section.display_context || section.context) as string] || 'Sidebar',
    sourceTable: section.source_table || null,
    sourceId: section.source_id || null,
    hasLabel: !!section.label,
    hasIcon: !!(section.icon || section.icon_name),
    itemCount,
    isEmpty: itemCount === 0,
  };
}

// Mapear seções para ViewModel
export function mapSectionsToViewModel(sections: Record<string, unknown>[] | Record<string, Record<string, unknown>>, items: Record<string, unknown>[] = []) {
  // sections from unified API is an array, not an object
  const itemCountByContext: Record<string, number> = {};
  const itemCountByParent: Record<string, number> = {};

  items.forEach((item: Record<string, unknown>) => {
    const ctx = (item.section as string) || 'sidebar';
    const pk = (item.parentKey as string) || (item.parent_key as string) || '_none'; // support both camelCase and snake_case
    itemCountByContext[ctx] = (itemCountByContext[ctx] || 0) + 1;
    itemCountByParent[pk] = (itemCountByParent[pk] || 0) + 1;
  });

  // If sections is an array (from unified API)
  if (Array.isArray(sections)) {
    return (sections as Record<string, unknown>[]).map((s: Record<string, unknown>) => {
      const key = (s.group_key || s.key || s.item_key) as string;
      const count = itemCountByParent[key] || 0;
      return mapSectionToViewModel(key, s, count);
    }).sort((a, b) => {
      // Sort by context first, then by order
      const ctxOrder: Record<string, number> = { sidebar: 0, navrail: 1, header: 2, footer: 3 };
      const ca = ctxOrder[a.context as string] ?? 99;
      const cb = ctxOrder[b.context as string] ?? 99;
      if (ca !== cb) return ca - cb;
      return (a.order as number) - (b.order as number);
    });
  }

  // Legacy: sections as object
  return Object.entries(sections as Record<string, Record<string, unknown>>)
    .map(([key, section]) => mapSectionToViewModel(key, section, itemCountByContext[key] || 0))
    .sort((a, b) => (a.order as number) - (b.order as number));
}

// Mapear ícones para seletor
export function mapIconsToSelector(icons: string[]) {
  return icons.map((icon: string) => ({
    value: icon,
    label: icon.charAt(0).toUpperCase() + icon.slice(1).replace(/-/g, ' ')
  }));
}

// Mapear níveis de permissão para select
export function mapPermissionLevelsToSelect() {
  return PERMISSION_LEVELS.map(level => ({
    value: level.value,
    label: `${level.value} - ${level.label}`,
    description: level.description
  }));
}

// Mapear item de formulário para dados (v10.0.0: includes context and source)
export function mapFormToItem(formData: Record<string, unknown>) {
  let roles = formData.roles;
  if (!Array.isArray(roles)) roles = roles ? [roles] : [];

  return {
    id: formData.id ? (formData.id as string).trim().toLowerCase().replace(/[^a-z0-9-_.]/g, '-') : '',
    label: formData.label ? (formData.label as string).trim() : '',
    href: formData.isDivider ? null : (formData.href ? (formData.href as string).trim() : ''),
    icon: formData.icon || 'default',
    section: formData.section || 'sidebar',
    parentKey: formData.parentKey || null,
    minLevel: parseInt(formData.minLevel as string) || 0,
    isDivider: formData.isDivider === true || formData.isDivider === 'true',
    isActive: formData.isActive !== false && formData.isActive !== 'false',
    isVisible: formData.isVisible !== false && formData.isVisible !== 'false',
    panelId: formData.panelId || null,
    itemType: formData.itemType || 'navigation',
    description: formData.description || null,
    uarpsTrigger: formData.uarpsTrigger || null,
    sourceTable: formData.sourceTable || null,
    sourceId: formData.sourceId || null,
    roles
  };
}

// Mapear item de dados para formulário
export function mapItemToForm(item: Record<string, unknown>) {
  return {
    id: item.id || '',
    label: item.label || '',
    href: item.href || '',
    icon: item.icon || 'default',
    section: item.section || 'sidebar',
    parentKey: item.parentKey || '',
    minLevel: String(item.minLevel || 0),
    isDivider: !!item.isDivider,
    isActive: item.isActive !== false,
    isVisible: item.isVisible !== false,
    panelId: item.panelId || '',
    itemType: item.itemType || 'navigation',
    description: item.description || '',
    uarpsTrigger: item.uarpsTrigger || '',
    sourceTable: item.sourceTable || '',
    sourceId: item.sourceId || '',
    roles: item.roles || []
  };
}

// Mapear seção de formulário para dados
export function mapFormToSection(formData: Record<string, unknown>) {
  return {
    key: formData.key ? (formData.key as string).trim().toLowerCase().replace(/[^a-z0-9-_.]/g, '-') : '',
    label: formData.label ? (formData.label as string).trim() : null,
    order_index: parseInt(formData.order as string) || 1,
    icon: formData.icon || null,
    display_context: formData.context || 'sidebar',
  };
}

// Mapear seção de dados para formulário
export function mapSectionToForm(key: string, section: Record<string, unknown>) {
  return {
    key: key || '',
    label: section?.label || '',
    order: String(section?.order || section?.order_index || 1),
    icon: section?.icon || section?.icon_name || '',
    context: section?.display_context || section?.context || 'sidebar',
  };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

export default { MODULE_ID, VERSION, mapItemToViewModel, mapItemsToViewModel, mapSectionToViewModel, mapSectionsToViewModel, mapIconsToSelector, mapPermissionLevelsToSelect, mapFormToItem, mapItemToForm, mapFormToSection, mapSectionToForm, info, healthCheck, CONTEXT_LABELS, SOURCE_LABELS };
