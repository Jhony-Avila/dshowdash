// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-navrail-admin:ui:renderer
// PURPOSE: Panel NavRail Admin - UI Renderer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
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

const MODULE_ID = 'panel-navrail-admin:ui:renderer';
const VERSION = '16.0.0-GROUP-DRAG-ICON';

const ICONS = {
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>',
  sync: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  navrail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>',
  expand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>'
};

const escapeHtml = (str: unknown) => {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};

const Renderer = {
  // P3.4: Renderizar painel completo
  renderPanel(state: Record<string, unknown>, triggers: Record<string, unknown>[] = []) {
    let html = '<div class="pna-panel">';
    
    // Header
    html += '<header class="pna-header">';
    html += '<div class="pna-header__title">';
    html += `<span class="pna-header__icon">${ICONS.navrail}</span>`;
    html += '<h1>NavRail Admin</h1>';
    html += `<span class="pna-header__version">v${VERSION}</span>`;
    html += '</div>';
    html += '<div class="pna-header__actions">';
    html += `<button class="pna-btn pna-btn--icon" data-action="refresh" title="Atualizar">${ICONS.refresh}</button>`;
    html += `<button class="pna-btn pna-btn--icon" data-action="sync" title="Sincronizar">${ICONS.sync}</button>`;
    html += `<button class="pna-btn pna-btn--primary" data-action="create">${ICONS.plus}Novo Item</button>`;
    html += '</div>';
    html += '</header>';
    
    // Stats
    html += `<div class="pna-stats" data-slot="stats">${this.renderStats(state)}</div>`;
    
    // Filters
    html += '<div class="pna-filters">';
    html += '<div class="pna-filter-group"><input type="text" class="pna-input" placeholder="Buscar..." data-filter="search"></div>';
    html += '<div class="pna-filter-group"><select class="pna-select" data-filter="group"><option value="">Todos os grupos</option>';
    (state.groups as Record<string, unknown>[] || []).forEach((g: Record<string, unknown>) => {
      html += `<option value="${g.group_key || g.id}">${escapeHtml(g.label)}</option>`;
    });
    html += '</select></div>';
    html += '<div class="pna-filter-group"><select class="pna-select" data-filter="status"><option value="">Todos</option><option value="active">Ativos</option><option value="inactive">Inativos</option></select></div>';
    html += '</div>';
    
    // Content
    html += '<div class="pna-content">';
    html += `<div class="pna-cards-area"><div class="pna-cards" data-slot="cards">${this.renderCards(state)}</div></div>`;
    html += `<aside class="pna-preview" data-slot="preview"><div class="pna-preview-header"><h3>Preview</h3><button class="pna-btn pna-btn--icon pna-btn--small" data-action="expand-preview" title="Expandir">${ICONS.expand}</button></div><div class="pna-preview-content"></div></aside>`;
    html += '</div>';
    
    // Modal Item Form
    html += this.renderItemFormModal(state, triggers);
    
    // Modal Confirm Delete
    html += '<div class="pna-modal" data-modal="confirm-delete"><div class="pna-modal__backdrop" data-action="close-modal"></div><div class="pna-modal__content pna-modal__content--small"><div class="pna-modal__header"><h2>Confirmar Exclusão</h2></div><div class="pna-modal__body"><p>Tem certeza que deseja excluir <strong data-slot="item-name"></strong>?</p><p class="pna-text--muted">Esta ação não pode ser desfeita.</p></div><div class="pna-modal__footer"><button class="pna-btn" data-action="close-modal">Cancelar</button><button class="pna-btn pna-btn--danger" data-action="confirm-delete">Excluir</button></div></div></div>';
    
    html += '</div>';
    
    return html;
  },
  
  // P3.4: Renderizar modal de formulário
  renderItemFormModal(state: Record<string, unknown>, triggers: Record<string, unknown>[] = []) {
    const item = (state.editingItem as Record<string, unknown>) || {};
    const groups = (state.groups as Record<string, unknown>[]) || [];
    const isNew = !item.dbId;
    
    let html = '<div class="pna-modal" data-modal="item-form">';
    html += '<div class="pna-modal__backdrop" data-action="close-modal"></div>';
    html += '<div class="pna-modal__content">';
    html += `<div class="pna-modal__header"><h2 data-slot="modal-title">${isNew ? 'Novo Item' : 'Editar Item'}</h2><button class="pna-btn pna-btn--icon" data-action="close-modal">${ICONS.close}</button></div>`;
    
    html += '<form class="pna-form" data-form="item">';
    html += '<div class="pna-form__grid">';
    
    // ID/Key
    html += `<div class="pna-form__field"><label>ID/Key *</label><input type="text" name="item_key" value="${escapeHtml(item.id || '')}" required ${!isNew ? 'readonly' : ''} placeholder="ex: dashboard"></div>`;
    
    // Label
    html += `<div class="pna-form__field"><label>Label *</label><input type="text" name="label" value="${escapeHtml(item.label || '')}" required placeholder="ex: Dashboard"></div>`;
    
    // Tooltip
    html += `<div class="pna-form__field"><label>Tooltip</label><input type="text" name="tooltip" value="${escapeHtml(item.tooltip || '')}" placeholder="ex: Painel principal"></div>`;
    
    // Icon
    html += `<div class="pna-form__field"><label>Ícone</label><input type="text" name="icon_name" value="${escapeHtml(item.icon || '')}" placeholder="ex: home, grid, users"></div>`;
    
    // Group
    html += '<div class="pna-form__field"><label>Grupo</label><select name="group_id"><option value="">Selecione...</option>';
    groups.forEach(g => {
      const raw = g._raw as Record<string, unknown> | undefined;
      const selected = (item.groupId == g.id || item.groupId == raw?.id) ? 'selected' : '';
      html += `<option value="${raw?.id || g.id}" ${selected}>${escapeHtml(g.label)}</option>`;
    });
    html += '</select></div>';
    
    // Action Type
    html += '<div class="pna-form__field"><label>Tipo de Ação</label><select name="action_type">';
    const actionTypes = [
      { value: 'openPanel', label: 'Abrir Painel' },
      { value: 'toggleSidebar', label: 'Toggle Sidebar' },
      { value: 'navigate', label: 'Navegar' },
      { value: 'external', label: 'Link Externo' },
      { value: 'custom', label: 'Custom' }
    ];
    actionTypes.forEach(at => {
      const selected = (item.actionType === at.value) ? 'selected' : '';
      html += `<option value="${at.value}" ${selected}>${at.label}</option>`;
    });
    html += '</select></div>';
    
    // Panel ID
    html += `<div class="pna-form__field"><label>Panel ID</label><input type="text" name="action_panel_id" value="${escapeHtml(item.actionPanelId || '')}" placeholder="ex: dashboard"></div>`;
    
    // Order
    html += `<div class="pna-form__field"><label>Ordem</label><input type="number" name="order_index" value="${item.order || 0}" min="0"></div>`;
    
    // P3.4: UARPS Trigger (substitui min_access_level)
    html += '<div class="pna-form__field"><label>UARPS Trigger (Permissão)</label><select name="uarps_trigger_id"><option value="">Público (sem restrição)</option>';
    triggers.forEach(t => {
      const selected = (item.uarpsTrigger == t.trigger_id) ? 'selected' : '';
      html += `<option value="${escapeHtml(t.trigger_id)}" ${selected}>${escapeHtml(t.label || t.trigger_id)}</option>`;
    });
    html += '</select></div>';
    
    // Badge
    html += '<div class="pna-form__field"><label>Badge</label><select name="badge_type">';
    const badgeTypes = [
      { value: 'none', label: 'Nenhum' },
      { value: 'count', label: 'Contador' },
      { value: 'dot', label: 'Dot' },
      { value: 'alert', label: 'Alerta' }
    ];
    badgeTypes.forEach(bt => {
      const selected = (item.badgeType === bt.value) ? 'selected' : '';
      html += `<option value="${bt.value}" ${selected}>${bt.label}</option>`;
    });
    html += '</select></div>';
    
    html += '</div>'; // End grid
    
    // Checkboxes
    html += '<div class="pna-form__checkboxes">';
    html += `<label class="pna-checkbox"><input type="checkbox" name="show_on_desktop" ${item.showOnDesktop !== false ? 'checked' : ''}><span>Desktop</span></label>`;
    html += `<label class="pna-checkbox"><input type="checkbox" name="show_on_tablet" ${item.showOnTablet !== false ? 'checked' : ''}><span>Tablet</span></label>`;
    html += `<label class="pna-checkbox"><input type="checkbox" name="show_on_mobile" ${item.showOnMobile !== false ? 'checked' : ''}><span>Mobile</span></label>`;
    html += `<label class="pna-checkbox"><input type="checkbox" name="is_active" ${item.isActive !== false ? 'checked' : ''}><span>Ativo</span></label>`;
    html += '</div>';
    
    // Actions
    html += '<div class="pna-form__actions">';
    html += '<button type="button" class="pna-btn" data-action="close-modal">Cancelar</button>';
    html += '<button type="submit" class="pna-btn pna-btn--primary">Salvar</button>';
    html += '</div>';
    
    html += '</form>';
    html += '</div></div>';
    
    return html;
  },
  
  // P3.4: Update stats container
  updateStats(container: HTMLElement, state: Record<string, unknown>) {
    var statsEl = container.querySelector('[data-slot="stats"]');
    if (statsEl) statsEl.innerHTML = this.renderStats(state);
  },

  // P3.4: Renderizar stats
  renderStats(state: Record<string, unknown>) {
    const items = (state.items as Record<string, unknown>[]) || [];
    const total = items.length;
    const active = items.filter((i: Record<string, unknown>) => i.isActive !== false).length;
    const protected_ = items.filter((i: Record<string, unknown>) => i.uarpsTrigger).length; // P3.4
    
    let html = '<div class="pna-stats__grid">';
    html += `<div class="pna-stat"><span class="pna-stat__value">${total}</span><span class="pna-stat__label">Total</span></div>`;
    html += `<div class="pna-stat pna-stat--success"><span class="pna-stat__value">${active}</span><span class="pna-stat__label">Ativos</span></div>`;
    html += `<div class="pna-stat pna-stat--info"><span class="pna-stat__value">${protected_}</span><span class="pna-stat__label">Protegidos</span></div>`; // P3.4
    html += `<div class="pna-stat"><span class="pna-stat__value">${((state.groups as unknown[]) || []).length}</span><span class="pna-stat__label">Grupos</span></div>`;
    html += '</div>';
    
    return html;
  },
  
  // v15.0.0: Humanize group key for display
  _humanizeGroupLabel(groupId: unknown, groups: Record<string, unknown>[]): string {
    if (!groupId) return 'Sem grupo';
    var group = groups.find(function(g) { return String((g._raw as any)?.id || g.id) === String(groupId); });
    if (group && group.label) return String(group.label);
    // Fallback: strip prefixes and capitalize
    var label = String(groupId).replace(/^nr_grp_/, '').replace(/[-_]/g, ' ').trim();
    return label ? label.replace(/\b\w/g, function(c: string) { return c.toUpperCase(); }) : 'Sem grupo';
  },

  // P3.4 + v15.0.0: Renderizar cards com separadores de grupo
  renderCards(state: Record<string, unknown>) {
    const items = (state.items as Record<string, unknown>[]) || [];
    const groups = (state.groups as Record<string, unknown>[]) || [];

    if (items.length === 0) {
      return '<div class="pna-empty"><p>Nenhum item encontrado</p><button class="pna-btn pna-btn--primary" data-action="create">Criar primeiro item</button></div>';
    }

    // v15.0.0: Sort items by group order, then by item order
    var groupOrderMap: Record<string, number> = {};
    groups.forEach(function(g: Record<string, unknown>, idx: number) {
      var gid = String((g._raw as any)?.id || g.id || '');
      groupOrderMap[gid] = (g._raw as any)?.order_index ?? (g.order as number) ?? idx;
    });
    var sortedItems = items.slice().sort(function(a: Record<string, unknown>, b: Record<string, unknown>) {
      var ga = String(a.groupId || '');
      var gb = String(b.groupId || '');
      var orderA = groupOrderMap[ga] ?? 999;
      var orderB = groupOrderMap[gb] ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return ((a.order as number) || 0) - ((b.order as number) || 0);
    });

    let html = '';
    var lastGroupId = '__initial__';
    var groupItemCounts: Record<string, number> = {};
    sortedItems.forEach(function(item: Record<string, unknown>) {
      var gid = String(item.groupId || '');
      groupItemCounts[gid] = (groupItemCounts[gid] || 0) + 1;
    });

    for (var i = 0; i < sortedItems.length; i++) {
      var item = sortedItems[i];
      var currentGroupId = String(item.groupId || '');
      if (currentGroupId !== lastGroupId) {
        var groupLabel = Renderer._humanizeGroupLabel(item.groupId, groups);
        var count = groupItemCounts[currentGroupId] || 0;
        // v16.0.0: Resolve group icon from groups array (MELHORIA 5)
        var groupIconHtml = '';
        var matchedGroup = groups.find(function(g: Record<string, unknown>) {
          return String((g._raw as any)?.id || g.id) === currentGroupId
            || String((g._raw as any)?.group_key || g.id) === currentGroupId;
        });
        if (matchedGroup) {
          var iconName = ((matchedGroup._raw as any)?.icon_name || (matchedGroup as any).icon || '') as string;
          if (iconName) {
            groupIconHtml = '<span class="pnra-group-icon" style="font-size:0.75rem;opacity:0.7;" title="' + escapeHtml(iconName) + '">'
              + '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/></svg>'
              + '</span>';
          }
        }
        // v16.0.0: Group separator with drag handle (MELHORIA 3) + icon (MELHORIA 5)
        html += '<div class="pnra-group-separator" draggable="true" data-group-drag="true" data-group-key="' + escapeHtml(currentGroupId) + '"'
          + ' style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem 0;margin:0.25rem 0;cursor:grab;'
          + (i > 0 ? 'border-top:1px solid rgba(255,255,255,0.08);' : '') + '">'
          + '<span class="pnra-group-drag-handle" style="cursor:grab;opacity:0.4;display:flex;align-items:center;" title="Arrastar para reordenar grupo">'
          + '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>'
          + '</span>'
          + groupIconHtml
          + '<span style="font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:rgba(255,255,255,0.6);">' + escapeHtml(groupLabel) + '</span>'
          + '<span style="font-size:0.6rem;opacity:0.4;background:rgba(255,255,255,0.08);padding:0.05rem 0.3rem;border-radius:0.5rem;">' + count + '</span>'
          + '<span style="flex:1;height:1px;background:linear-gradient(90deg,rgba(255,255,255,0.15) 0%, transparent 100%);"></span>'
          + '</div>';
        lastGroupId = currentGroupId;
      }
      html += Renderer.renderCard(item);
    }

    return html;
  },
  
  // P3.4: Renderizar card individual
  renderCard(item: Record<string, unknown>) {
    const isActive = item.isActive !== false;
    const hasUarps = !!item.uarpsTrigger; // P3.4
    
    let html = `<div class="pna-card ${!isActive ? 'pna-card--inactive' : ''}${hasUarps ? ' pna-card--protected' : ''}" data-item-id="${item.dbId || item.id}" draggable="true">`;
    
    // Drag handle
    html += '<div class="pna-card__drag"><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg></div>';
    
    // Icon — v11.4.0: Inline editable
    html += `<div class="pna-card__icon pnra-editable" title="Clique para editar icone"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/></svg></div>`;
    
    // Content — v11.4.0: Inline editable fields
    html += '<div class="pna-card__content">';
    html += `<span class="pna-card__label pnra-editable" title="Clique para editar label">${escapeHtml(item.label)}</span>`;
    html += `<span class="pna-card__id">${escapeHtml(item.id)}</span>`;
    html += `<span class="pna-card__route pnra-editable" title="Clique para editar rota">${escapeHtml(item.actionPanelId || '-')}</span>`;
    html += '</div>';

    // v15.0.0: Group and Level inline edit areas with humanized group name
    const groups = ((typeof window !== 'undefined' && (window as any).__pnraGroups) || []) as Record<string, unknown>[];
    const groupDisplayLabel = Renderer._humanizeGroupLabel(item.groupId, groups);
    html += '<div class="pna-card__meta">';
    html += `<span class="pna-card__group pnra-editable" title="Clique para editar grupo">${escapeHtml(groupDisplayLabel)}</span>`;
    html += `<span class="pna-card__level pnra-editable" title="Clique para editar nível">Nv ${item.minLevel || 0}</span>`;
    html += '</div>';
    
    // Badges
    html += '<div class="pna-card__badges">';
    // P3.4: Badge UARPS
    if (hasUarps) {
      html += `<span class="pna-badge pna-badge--uarps" title="UARPS: ${escapeHtml(item.uarpsTrigger)}">${ICONS.shield}</span>`;
    }
    if (!isActive) {
      html += '<span class="pna-badge pna-badge--inactive">Inativo</span>';
    }
    html += '</div>';
    
    // Actions
    html += '<div class="pna-card__actions">';
    html += `<button class="pna-btn pna-btn--icon pna-btn--small" data-action="edit" data-item-id="${item.dbId || item.id}" title="Editar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>`;
    html += `<button class="pna-btn pna-btn--icon pna-btn--small pna-btn--danger" data-action="delete" data-item-id="${item.dbId || item.id}" title="Excluir"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>`;
    html += '</div>';
    
    html += '</div>';
    
    return html;
  }
};

export { Renderer as PanelRenderer };
export default Renderer;
export { VERSION, MODULE_ID };
