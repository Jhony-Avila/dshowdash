/* ═══════════════════════════════════════════════════════════════
 * panel-criacao-botoes/core/transform.ts
 * @version 1.0.0
 * Transformações PURAS (sem I/O) — agrupamento de itens sob seções
 * e derivação de ícones. Testável isoladamente em node.
 * ═══════════════════════════════════════════════════════════════ */

import type { NavItem, NavGroup, RawSection } from './types.js';

const UNGROUPED_KEY = '__ungrouped__';
const UNGROUPED_LABEL = 'Sem grupo';

/**
 * Monta os grupos da sidebar (como aparecem no menu real):
 * cada seção (item_type='group') vira um NavGroup; os itens de
 * navegação casam por `item.parentKey === section.group_key`.
 * Itens órfãos (sem grupo conhecido) caem num bucket "Sem grupo".
 */
export function buildGroups(items: NavItem[], sections: RawSection[]): NavGroup[] {
  const navItems = (items || []).filter(
    (i) => i.section === 'sidebar' && i.itemType === 'navigation'
  );

  const sidebarSections = (sections || [])
    .filter((s) => (s.display_context ?? 'sidebar') === 'sidebar')
    .slice()
    .sort((a, b) => Number(a.order_index ?? 0) - Number(b.order_index ?? 0));

  const knownKeys = new Set(sidebarSections.map((s) => s.group_key));

  const byOrder = (a: NavItem, b: NavItem) => a.order - b.order;

  const groups: NavGroup[] = sidebarSections.map((s) => ({
    group_key: s.group_key,
    label: s.label,
    order_index: Number(s.order_index ?? 0),
    items: navItems.filter((i) => i.parentKey === s.group_key).sort(byOrder),
  }));

  const orphans = navItems
    .filter((i) => !i.parentKey || !knownKeys.has(i.parentKey))
    .sort(byOrder);

  if (orphans.length > 0) {
    groups.push({
      group_key: UNGROUPED_KEY,
      label: UNGROUPED_LABEL,
      order_index: Number.MAX_SAFE_INTEGER,
      items: orphans,
    });
  }

  return groups;
}

/** Acha um item pelo id (item_key) varrendo os grupos. */
export function findItem(groups: NavGroup[], id: string): NavItem | null {
  for (const g of groups || []) {
    const found = g.items.find((i) => i.id === id);
    if (found) return found;
  }
  return null;
}

/** Ícones distintos já usados pelos itens (alimenta o picker — fetchIcons é stub). */
export function deriveIcons(items: NavItem[]): string[] {
  const set = new Set<string>();
  for (const i of items || []) {
    if (i.icon) set.add(i.icon);
  }
  return Array.from(set).sort();
}
