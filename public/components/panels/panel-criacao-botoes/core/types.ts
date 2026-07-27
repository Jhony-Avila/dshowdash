/* ═══════════════════════════════════════════════════════════════
 * panel-criacao-botoes/core/types.ts
 * @version 1.1.0
 * Tipos do painel. NavItem espelha o SHAPE MAPEADO que o
 * nav-adapter compartilhado devolve (_mapApiItem, camelCase) —
 * não as colunas cruas — para evitar uma 2ª camada de mapeamento.
 * ═══════════════════════════════════════════════════════════════ */

/** Item de navegação no shape do nav-adapter (contexto sidebar). */
export interface NavItem {
  /** = ui_nav_items.item_key */
  id: string;
  /** PK física (ui_nav_items.id) — necessária para escrita (updateItem). */
  sourceId: number | string;
  /** Tabela-fonte (sempre 'ui_nav_items' na sidebar). */
  sourceTable: string;
  label: string;
  displayTitle?: string | null;
  /** = route_path */
  href?: string | null;
  /** = icon_name */
  icon?: string | null;
  description?: string | null;
  /** = display_context */
  section: string;
  /** = parent_key (chave do grupo, ex.: 'sidebar.grp-admin') */
  parentKey: string | null;
  itemType: string;
  panelId?: string | null;
  order: number;
  isActive: boolean;
  isVisible: boolean;
  minLevel?: number;
}

/** Grupo da sidebar (sidebar_groups / item_type='group'). */
export interface NavGroup {
  group_key: string;
  label: string;
  order_index: number;
  items: NavItem[];
}

/** Painel real (panel_registry) — alimenta o dropdown de panel_id. */
export interface RealPanel {
  panel_id: string;
  title: string;
  category: string;
  icon?: string | null;
  is_active: boolean | number;
}

export type PanelMode = 'list' | 'create' | 'edit';

/** Estado reativo do painel. */
export interface PanelCriacaoState {
  groups: NavGroup[];
  realPanels: RealPanel[];
  /** Ícones já usados na sidebar (derivados dos itens — fetchIcons é stub). */
  icons: string[];
  mode: PanelMode;
  editing: NavItem | null;
  loading: boolean;
  error: string | null;
}

/** Ports injetados pelo container (event-bus, logger, etc.). */
export type PanelPorts = Record<string, unknown>;

/** Config/props passados pelo container ao montar. */
export interface MountConfig {
  label?: string;
  itemKey?: string;
  panelId?: string;
  item?: NavItem;
  ports?: PanelPorts;
  [key: string]: unknown;
}

/** Linha crua de seção devolvida por fetchSections (não passa por _mapApiItem). */
export interface RawSection {
  group_key: string;
  label: string;
  order_index: number | string;
  display_context?: string;
  source_table?: string;
  source_id?: number | string;
  icon_name?: string | null;
}
