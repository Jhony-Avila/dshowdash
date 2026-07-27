// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.5.0-PANELID-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: helpers
// PURPOSE: navigation-model-loader/utils/helpers.js
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   isValidModel() — exported function
//   convertApiToSections() — exported function
//   normalizeModel() — exported function
//   getSectionById() — exported function
//   getItemByPath() — exported function
//   filterByPermission() — exported function
//   countItems() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════

'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.4.0-P2-ENTERPRISE';
export const MODULE_ID = 'sidebar.integration.navigation-model-loader.utils.helpers';

// Check if model is valid (supports both formats)
export const isValidModel = (model: DynObj) => {
    if (!model || typeof model !== 'object') return false;

    // New API format: { items: [...], tree: [...], triggers: {...} }
    if (Array.isArray(model.items) && model.items.length > 0) return true;
    if (Array.isArray(model.tree) && model.tree.length > 0) return true;

    // Legacy format: { sections: [...] }
    if (Array.isArray(model.sections) && model.sections.length > 0) return true;

    return false;
};

// Convert API format to sections format expected by accordion
export const convertApiToSections = (apiData: DynObj) => {
    if (!apiData) return [];

    // If already has sections, return as-is
    if (Array.isArray(apiData.sections) && apiData.sections.length > 0) {
        return apiData.sections;
    }

    // PRIORITY: Build from items (more reliable than tree which often has empty children)
    if (Array.isArray(apiData.items) && apiData.items.length > 0) {
        return buildSectionsFromItems(apiData.items);
    }

    // Fallback: try tree if items not available
    if (Array.isArray(apiData.tree) && apiData.tree.length > 0) {
        const sections = buildSectionsFromTree(apiData.tree);
        if (sections.length > 0) return sections;
    }

    return [];
};

// Build sections from flat items list (groups + navigation items with parent_key)
function buildSectionsFromItems(items: DynObj[]) {
    const groups: Record<string, Record<string, any>> = {};

    // First pass: identify groups
    items.forEach((item: DynObj) => {
        if (item.item_type === 'group' && item.is_active === 1 && item.is_visible === 1) {
            groups[item.item_key] = {
                id: item.item_key || (`sec-${item.id}`),
                label: item.label || item.item_key || 'Section',
                icon: item.icon || 'folder',
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

    // Second pass: assign navigation items to groups
    items.forEach((item: DynObj) => {
        if (item.item_type === 'navigation' && item.parent_key && groups[item.parent_key]) {
            if (item.is_active === 1 && item.is_visible === 1) {
                groups[item.parent_key].items.push({
                    id: item.item_key || (`item-${item.id}`),
                    label: item.label || item.item_key || 'Item',
                    displayTitle: item.display_title || null,
                    icon: item.icon || 'file',
                    order: item.order_index || 0,
                    route: item.route_path || null,
                    panelId: item.panel_id || null,
                    navigation: {
                        mode: item.intent_id ? 'action' : 'route',
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

    // Sort items within each group
    (Object.values(groups) as any[]).forEach(group => {
        group.items.sort((a: DynObj , b: DynObj ) => a.order - b.order);
    });

    // Convert to array, filter empty sections, and sort
    return (Object.values(groups) as any[])
        .filter(section => section.items.length > 0)
        .sort((a, b) => a.order - b.order);
}

// Build sections from tree (hierarchical structure)
function buildSectionsFromTree(tree: DynObj) {
    return tree
        .filter((item: DynObj) => item.item_type === 'group' && item.is_active === 1 && item.is_visible === 1)
        .filter((group: DynObj) => group.children && group.children.length > 0)
        .map((group: DynObj) => ({
            id: group.item_key || group.id,
            label: group.label || group.item_key || 'Section',
            icon: group.icon || 'folder',
            order: group.order_index || 0,
            accordion: {
                default_open: group.is_expanded === 1,
                collapsible: true
            },
            visible: true,
            items: (group.children || [])
                .filter((child: DynObj) => child.item_type === 'navigation' && child.is_active === 1 && child.is_visible === 1)
                .map((child: DynObj) => ({
                    id: child.item_key || child.id,
                    label: child.label || child.item_key || 'Item',
                    displayTitle: child.display_title || null,
                    icon: child.icon || 'file',
                    order: child.order_index || 0,
                    route: child.route_path || null,
                    panelId: child.panel_id || null,
                    navigation: {
                        mode: child.intent_id ? 'action' : 'route',
                        action: child.intent_id ? `panel:${child.intent_id}` : null
                    },
                    state: {
                        disabled: child.is_disabled === 1
                    },
                    badge: child.badge_key || null
                }))
                .sort((a: DynObj , b: DynObj ) => a.order - b.order)
        }))
        .filter((section: DynObj) => section.items.length > 0)
        .sort((a: DynObj , b: DynObj ) => a.order - b.order);
}

// Normalize model to expected format
export const normalizeModel = (model: DynObj) => {
    if (!model) return null;

    // Convert API format if needed
    const sections = convertApiToSections(model);

    return {
        version: model.version || 'api',
        generated: model.generated || Date.now(),
        source: model.source || 'api',
        sections,
        metadata: model.metadata || {}
    };
};

export const getSectionById = (model: DynObj, sectionId: string) => {
    if (!model?.sections) return null;
    return model.sections.find((s: DynObj) => s.id === sectionId) || null;
};

export const getItemByPath = (model: DynObj, path: string) => {
    if (!model?.sections || !path) return null;
    for (const section of model.sections) {
        if (!section.items) continue;
        const item = section.items.find((i: DynObj) => i.path === path || i.route === path);
        if (item) return { section, item };
    }
    return null;
};

// @deprecated Phase P1 - Usar PermissionResolver.filterNavigationItems() como fonte primária
// Mantida como fallback para navigation-model-loader
export const filterByPermission = (model: DynObj, userPermissions: DynObj[] = []) => {
    if (!model?.sections) return model;
    const filtered = {
        ...model,
        sections: model.sections.map((section: DynObj) => ({
            ...section,
            items: (section.items || []).filter((item: DynObj) => {
                if (!item.permission) return true;
                return userPermissions.includes(item.permission);
            })
        })).filter((section: DynObj) => section.items.length > 0)
    };
    return filtered;
};

export const countItems = (model: DynObj) => {
    if (!model?.sections) return 0;
    return model.sections.reduce((acc: DynObj, section: DynObj) => acc + (section.items?.length || 0), 0);
};
