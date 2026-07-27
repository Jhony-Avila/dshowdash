// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-header-admin:ui:renderer
// PURPOSE: Panel Header Admin - UI Renderer
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

const MODULE_ID = 'panel-header-admin:ui:renderer';
const VERSION = '9.3.0-P2-ENTERPRISE';

const COMPONENT_TYPES = {
  'indicator': { label: 'Indicador', icon: 'activity', color: '#10b981' },
  'menu': { label: 'Menu', icon: 'menu', color: '#6366f1' },
  'button': { label: 'Botão', icon: 'square', color: '#f59e0b' },
  'search': { label: 'Busca', icon: 'search', color: '#3b82f6' },
  'brand': { label: 'Marca', icon: 'image', color: '#8b5cf6' },
  'info': { label: 'Info', icon: 'info', color: '#64748b' }
};

const ICONS = {
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>',
  smartphone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
  tablet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
  monitor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>'
};

const Renderer = {
  // P3.4: Renderizar card de componente
  renderComponentCard(component: Record<string, unknown>, index: number) {
    const typeInfo = (COMPONENT_TYPES as Record<string, { label: string; icon: string; color: string }>)[component.component_type as string] || COMPONENT_TYPES.info;
    const isActive = component.is_active === 1;
    const hasUarps = !!component.uarps_trigger_id; // P3.4
    
    let html = `<div class="pha-card ${!isActive ? 'pha-card--inactive' : ''}${hasUarps ? ' pha-card--protected' : ''}" data-component-id="${component.id}" draggable="true">`;
    
    // Drag handle
    html += '<div class="pha-card__drag-handle" title="Arraste para reordenar"><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg></div>';
    
    // Header
    html += '<div class="pha-card__header">';
    // @ts-expect-error strict migration — TS2345
    html += `<div class="pha-card__icon" style="background: ${typeInfo.color}20; color: ${typeInfo.color}">${this.getIconSvg(component.icon_name || typeInfo.icon)}</div>`;
    // @ts-expect-error strict migration — TS2345
    html += `<div class="pha-card__info"><span class="pha-card__name" title="Clique para editar label">${this.escapeHtml(component.label)}</span><span class="pha-card__key">${this.escapeHtml(component.component_key)}</span></div>`;
    html += `<div class="pha-card__status"><button class="pha-toggle ${isActive ? 'pha-toggle--active' : ''}" data-action="toggle" data-component-id="${component.id}" title="${isActive ? 'Desativar' : 'Ativar'}"><span class="pha-toggle__track"></span><span class="pha-toggle__thumb"></span></button></div>`;
    html += '</div>';
    
    // Meta
    html += '<div class="pha-card__meta">';
    html += `<span class="pha-card__type" style="background: ${typeInfo.color}20; color: ${typeInfo.color}">${typeInfo.label}</span>`;
    html += `<span class="pha-card__order" title="Clique para editar ordem">#${component.order_index || index + 1}</span>`;
    // P3.4: Badge UARPS ao invés de min_access_level
    if (hasUarps) {
      html += `<span class="pha-card__uarps" title="UARPS: ${this.escapeHtml(component.uarps_trigger_id as string)}">${ICONS.shield}</span>`;
    }
    if (component.polling_enabled) {
      html += `<span class="pha-card__polling">${ICONS.refresh} ${Math.round((component.polling_interval as number) / 1000)}s</span>`;
    }
    html += '</div>';
    
    // Visibility
    html += '<div class="pha-card__visibility">';
    if (component.show_on_mobile) html += `<span title="Mobile">${ICONS.smartphone}</span>`;
    if (component.show_on_tablet) html += `<span title="Tablet">${ICONS.tablet}</span>`;
    if (component.show_on_desktop) html += `<span title="Desktop">${ICONS.monitor}</span>`;
    html += '</div>';
    
    // Actions
    html += '<div class="pha-card__actions">';
    html += `<button class="pha-btn pha-btn--icon" data-action="edit-component" data-component-id="${component.id}" title="Editar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>`;
    html += `<button class="pha-btn pha-btn--icon pha-btn--danger" data-action="delete-component" data-component-id="${component.id}" title="Excluir"><span class="pha-btn-icon">${ICONS.trash}</span></button>`;
    html += '</div>';
    
    html += '</div>';
    return html;
  },
  
  // P3.4: Renderizar modal de componente
  renderComponentModal(state: Record<string, unknown>, triggers: Record<string, unknown>[] = []) {
    const c = (state.editingComponent || {}) as Record<string, unknown>;
    const isNew = !c.id;
    const groups = (state.groups || []) as Record<string, unknown>[];
    
    let html = '<div class="pha-modal-overlay" data-action="close-modal">';
    html += '<div class="pha-modal" onclick="event.stopPropagation()">';
    html += `<div class="pha-modal__header"><h3>${isNew ? 'Novo Componente' : 'Editar Componente'}</h3><button class="pha-modal__close" data-action="close-modal">&times;</button></div>`;
    
    html += '<form class="pha-form" data-form="component">';
    html += `<input type="hidden" name="id" value="${c.id || ''}">`;
    
    // Row 1: Key + Label
    html += '<div class="pha-form__row">';
    // @ts-expect-error strict migration — TS2345
    html += `<div class="pha-form__field"><label>Chave *</label><input type="text" name="component_key" value="${this.escapeHtml(c.component_key || '')}" required ${!isNew ? 'readonly' : ''} placeholder="ex: my-component"></div>`;
    // @ts-expect-error strict migration — TS2345
    html += `<div class="pha-form__field"><label>Label *</label><input type="text" name="label" value="${this.escapeHtml(c.label || '')}" required placeholder="Nome de exibição"></div>`;
    html += '</div>';
    
    // Row 2: Group + Type
    html += '<div class="pha-form__row">';
    html += '<div class="pha-form__field"><label>Grupo</label><select name="group_id"><option value="">Sem grupo</option>';
    groups.forEach((g: Record<string, unknown>) => {
      html += `<option value="${g.id}" ${c.group_id == g.id ? 'selected' : ''}>${Renderer.escapeHtml(g.label as string)} (${g.position})</option>`;
    });
    html += '</select></div>';
    html += '<div class="pha-form__field"><label>Tipo</label><select name="component_type">';
    Object.keys(COMPONENT_TYPES).forEach(k => {
      html += `<option value="${k}" ${c.component_type === k ? 'selected' : ''}>${(COMPONENT_TYPES as Record<string, { label: string; icon: string; color: string }>)[k].label}</option>`;
    });
    html += '</select></div>';
    html += '</div>';
    
    // Row 3: Icon + Tooltip
    html += '<div class="pha-form__row">';
    // @ts-expect-error strict migration — TS2345
    html += `<div class="pha-form__field"><label>Ícone</label><input type="text" name="icon_name" value="${this.escapeHtml(c.icon_name || '')}" placeholder="ex: activity, zap"></div>`;
    // @ts-expect-error strict migration — TS2345
    html += `<div class="pha-form__field"><label>Tooltip</label><input type="text" name="tooltip" value="${this.escapeHtml(c.tooltip || '')}"></div>`;
    html += '</div>';
    
    // Description
    // @ts-expect-error strict migration — TS2345
    html += `<div class="pha-form__field"><label>Descrição</label><input type="text" name="description" value="${this.escapeHtml(c.description || '')}"></div>`;
    
    // Row 4: Order + UARPS Trigger (P3.4: substitui min_access_level)
    html += '<div class="pha-form__row">';
    html += `<div class="pha-form__field"><label>Ordem</label><input type="number" name="order_index" value="${c.order_index || 0}" min="0"></div>`;
    html += '<div class="pha-form__field"><label>UARPS Trigger (Permissão)</label><select name="uarps_trigger_id"><option value="">Público (sem restrição)</option>';
    triggers.forEach((t: Record<string, unknown>) => {
      html += `<option value="${Renderer.escapeHtml(t.trigger_id as string)}" ${c.uarps_trigger_id == t.trigger_id ? 'selected' : ''}>${Renderer.escapeHtml((t.label || t.trigger_id) as string)}</option>`;
    });
    html += '</select></div>';
    html += '</div>';
    
    // Checkboxes
    html += '<div class="pha-form__row pha-form__checkboxes">';
    html += `<label><input type="checkbox" name="show_on_mobile" ${c.show_on_mobile !== 0 ? 'checked' : ''}> ${ICONS.smartphone} Mobile</label>`;
    html += `<label><input type="checkbox" name="show_on_tablet" ${c.show_on_tablet !== 0 ? 'checked' : ''}> ${ICONS.tablet} Tablet</label>`;
    html += `<label><input type="checkbox" name="show_on_desktop" ${c.show_on_desktop !== 0 ? 'checked' : ''}> ${ICONS.monitor} Desktop</label>`;
    html += `<label><input type="checkbox" name="is_active" ${c.is_active !== 0 ? 'checked' : ''}> Ativo</label>`;
    html += '</div>';
    
    // Actions
    html += '<div class="pha-form__actions">';
    html += '<button type="button" class="pha-btn pha-btn--secondary" data-action="close-modal">Cancelar</button>';
    html += '<button type="submit" class="pha-btn pha-btn--primary">Salvar</button>';
    html += '</div>';
    
    html += '</form></div></div>';
    
    return html;
  },
  
  // Helper: Escape HTML
  escapeHtml(str: string) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },
  
  // Helper: Get icon SVG
  getIconSvg(name: string) {
    const icons = {
      'activity': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
      'menu': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
      'square': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>',
      'search': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
      'image': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
      'info': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };
    return (icons as Record<string, string>)[name] || icons['info'];
  }
};

export default Renderer;
export { VERSION, MODULE_ID };
export { Renderer as ui };
