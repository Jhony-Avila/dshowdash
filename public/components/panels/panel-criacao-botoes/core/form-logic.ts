/* ═══════════════════════════════════════════════════════════════
 * panel-criacao-botoes/core/form-logic.ts
 * @version 1.0.0
 * Lógica PURA do formulário (sem I/O): slug, derivação de item_key
 * e route_path, montagem do payload de createItem e validação.
 * Convenções espelhadas dos dados reais de ui_nav_items:
 *   grupo 'sidebar.grp-admin' → item_key 'sidebar.admin.<slug>'
 *                             → route_path '#/admin/<slug>'
 * ═══════════════════════════════════════════════════════════════ */

export interface CreateFormValues {
  label: string;
  icon: string;
  group: string; // group_key selecionado
  panel_id: string; // panel real ou STUB_PANEL_ID
  route_path?: string; // opcional; se vazio, derivado
  is_active?: boolean;
}

/** Payload no shape que o nav-adapter compartilhado.createItem() espera. */
export interface CreatePayload {
  id: string;
  label: string;
  href: string;
  icon: string;
  panelId: string;
  parentKey: string;
  section: 'sidebar';
  itemType: 'navigation';
  order: number;
  isActive: boolean;
  isVisible: boolean;
}

export function slugify(s: string): string {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos (combining marks)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Deriva o item_key completo a partir do grupo + label. */
export function buildItemKey(groupKey: string, label: string): string {
  const base = groupKey && groupKey.includes('.grp-')
    ? groupKey.replace('.grp-', '.')
    : groupKey || 'sidebar.custom';
  return `${base}.${slugify(label)}`;
}

/** Deriva o route_path (#/seg/seg) a partir do item_key. */
export function deriveRoute(itemKey: string): string {
  const path = String(itemKey ?? '')
    .replace(/^sidebar\./, '')
    .replace(/\./g, '/');
  return `#/${path}`;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateCreate(form: Partial<CreateFormValues>): ValidationResult {
  const errors: string[] = [];
  if (!form.label || !form.label.trim()) errors.push('Informe o label do botão.');
  else if (!slugify(form.label)) errors.push('Label inválido (sem caracteres aproveitáveis para a chave).');
  if (!form.group) errors.push('Selecione o grupo.');
  if (!form.panel_id) errors.push('Selecione o painel de destino (ou placeholder).');
  return { valid: errors.length === 0, errors };
}

/** Payload de atualização (updateItem) — identifica a linha por source_table+source_id.
 *  NÃO altera item_key (chave estável; editar é label/ícone/grupo/rota/painel/ativo). */
export interface UpdatePayload {
  sourceTable: string;
  sourceId: number | string;
  label: string;
  icon: string;
  href: string;
  panelId: string;
  parentKey: string;
  isActive: boolean;
  isVisible: boolean;
}

/** Payload mínimo de toggle (ativar/desativar) — só is_active. PNR: sem delete. */
export interface TogglePayload {
  sourceTable: string;
  sourceId: number | string;
  isActive: boolean;
}

/** Valores iniciais do form a partir de um item existente (pré-preenchimento de edição). */
export function formFromItem(item: {
  label: string;
  icon?: string | null;
  parentKey: string | null;
  panelId?: string | null;
  href?: string | null;
  isActive: boolean;
}): CreateFormValues {
  return {
    label: item.label ?? '',
    icon: item.icon ?? '',
    group: item.parentKey ?? '',
    panel_id: item.panelId ?? '',
    route_path: item.href ?? '',
    is_active: item.isActive === true,
  };
}

export function buildUpdatePayload(
  item: { sourceTable: string; sourceId: number | string; id: string; href?: string | null },
  form: CreateFormValues
): UpdatePayload {
  const href = (form.route_path && form.route_path.trim()) || item.href || deriveRoute(item.id);
  return {
    sourceTable: item.sourceTable,
    sourceId: item.sourceId,
    label: form.label.trim(),
    icon: (form.icon && form.icon.trim()) || 'circle',
    href,
    panelId: form.panel_id,
    parentKey: form.group,
    isActive: form.is_active === true,
    isVisible: true,
  };
}

export function buildTogglePayload(item: {
  sourceTable: string;
  sourceId: number | string;
  isActive: boolean;
}): TogglePayload {
  return {
    sourceTable: item.sourceTable,
    sourceId: item.sourceId,
    isActive: !item.isActive,
  };
}

export function buildCreatePayload(form: CreateFormValues): CreatePayload {
  const itemKey = buildItemKey(form.group, form.label);
  const href = (form.route_path && form.route_path.trim()) || deriveRoute(itemKey);
  return {
    id: itemKey,
    label: form.label.trim(),
    href,
    icon: (form.icon && form.icon.trim()) || 'circle',
    panelId: form.panel_id,
    parentKey: form.group,
    section: 'sidebar',
    itemType: 'navigation',
    order: 99,
    isActive: form.is_active === true,
    isVisible: true,
  };
}
