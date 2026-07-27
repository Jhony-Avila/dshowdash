// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05:modals
// PURPOSE: Panel-05 Modals - Enterprise Premium AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   IconRegistry from /components/icon-registry/index.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   modalsManager — exported value
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

import { IconRegistry } from '/components/icon-registry/index.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-05:modals';

const icon = (name: string) => IconRegistry.get(name) || '';

const KEYBOARD_SHORTCUTS = [
  { category: 'Navegacao', shortcuts: [{ keys: ['/', 'Ctrl', 'K'], description: 'Abrir busca rapida' }, { keys: ['Esc'], description: 'Fechar modal / Voltar' }, { keys: ['L'], description: 'Modo Lista' }, { keys: ['G'], description: 'Modo Graficos' }]},
  { category: 'Acoes', shortcuts: [{ keys: ['R'], description: 'Atualizar dados' }, { keys: ['E'], description: 'Exportar dados' }, { keys: ['?'], description: 'Mostrar atalhos' }, { keys: ['T'], description: 'Alternar tema' }]},
  { category: 'Tabela', shortcuts: [{ keys: ['ArrowUp', 'ArrowDown'], description: 'Navegar linhas' }, { keys: ['Enter'], description: 'Abrir cliente' }, { keys: ['Home'], description: 'Primeira pagina' }, { keys: ['End'], description: 'Ultima pagina' }]}
];

const DATE_PRESETS = [
  { id: 'today', label: 'Hoje', getValue: () => { const d = new Date(); return { start: d, end: d }; }},
  { id: 'yesterday', label: 'Ontem', getValue: () => { const d = new Date(); d.setDate(d.getDate() - 1); return { start: d, end: d }; }},
  { id: '7d', label: 'Ultimos 7 dias', getValue: () => { const e = new Date(); const s = new Date(); s.setDate(s.getDate() - 7); return { start: s, end: e }; }},
  { id: '30d', label: 'Ultimos 30 dias', getValue: () => { const e = new Date(); const s = new Date(); s.setDate(s.getDate() - 30); return { start: s, end: e }; }},
  { id: '90d', label: 'Ultimos 90 dias', getValue: () => { const e = new Date(); const s = new Date(); s.setDate(s.getDate() - 90); return { start: s, end: e }; }},
  { id: 'thisMonth', label: 'Este mes', getValue: () => { const d = new Date(); return { start: new Date(d.getFullYear(), d.getMonth(), 1), end: new Date(d.getFullYear(), d.getMonth() + 1, 0) }; }},
  { id: 'lastMonth', label: 'Mes passado', getValue: () => { const d = new Date(); return { start: new Date(d.getFullYear(), d.getMonth() - 1, 1), end: new Date(d.getFullYear(), d.getMonth(), 0) }; }},
  { id: 'thisYear', label: 'Este ano', getValue: () => { const d = new Date(); return { start: new Date(d.getFullYear(), 0, 1), end: d }; }},
  { id: 'custom', label: 'Personalizado', getValue: (): { start: Date; end: Date } | null => null }
];

class ModalsManager {
  [key: string]: any;
  constructor() { this._activeModal = null; this._onClose = null; this._settings = this._loadSettings(); }

  renderKeyboardHelp() {
    return `<div class="p05-modal p05-modal-keyboard" role="dialog" aria-modal="true" aria-labelledby="modal-kbd-title"><div class="p05-modal-backdrop" data-action="close-modal"></div><div class="p05-modal-content p05-modal-md"><div class="p05-modal-header"><div class="p05-modal-title-row"><span class="p05-modal-icon">${icon('system:keyboard')}</span><h3 id="modal-kbd-title">Atalhos de Teclado</h3></div><button class="p05-modal-close" data-action="close-modal" aria-label="Fechar">${icon('ui:x')}</button></div><div class="p05-modal-body"><div class="p05-kbd-grid">${KEYBOARD_SHORTCUTS.map(cat => `<div class="p05-kbd-category"><h4 class="p05-kbd-category-title">${cat.category}</h4><div class="p05-kbd-list">${cat.shortcuts.map(s => `<div class="p05-kbd-item"><div class="p05-kbd-keys">${s.keys.map(k => `<kbd class="p05-kbd">${this._formatKey(k)}</kbd>`).join('<span class="p05-kbd-plus">+</span>')}</div><span class="p05-kbd-desc">${s.description}</span></div>`).join('')}</div></div>`).join('')}</div></div><div class="p05-modal-footer p05-modal-footer-muted"><span>Pressione <kbd class="p05-kbd">?</kbd> para abrir/fechar esta janela</span></div></div></div>`;
  }

  renderSettings() {
    const { theme, compactMode, autoRefresh, refreshInterval, itemsPerPage } = this._settings;
    return `<div class="p05-modal p05-modal-settings" role="dialog" aria-modal="true" aria-labelledby="modal-settings-title"><div class="p05-modal-backdrop" data-action="close-modal"></div><div class="p05-modal-content p05-modal-md"><div class="p05-modal-header"><div class="p05-modal-title-row"><span class="p05-modal-icon">${icon('system:settings')}</span><h3 id="modal-settings-title">Configuracoes</h3></div><button class="p05-modal-close" data-action="close-modal" aria-label="Fechar">${icon('ui:x')}</button></div><div class="p05-modal-body"><div class="p05-settings-group"><h4 class="p05-settings-group-title">Aparencia</h4><div class="p05-setting-row"><div class="p05-setting-info"><span class="p05-setting-label">Tema</span><span class="p05-setting-desc">Escolha o tema de cores</span></div><div class="p05-theme-selector-inline"><button class="p05-theme-btn ${theme === 'light' ? 'p05-active' : ''}" data-action="set-theme" data-theme="light" title="Claro">${icon('system:sun')}</button><button class="p05-theme-btn ${theme === 'dark' ? 'p05-active' : ''}" data-action="set-theme" data-theme="dark" title="Escuro">${icon('system:moon')}</button><button class="p05-theme-btn ${theme === 'system' ? 'p05-active' : ''}" data-action="set-theme" data-theme="system" title="Sistema">${icon('system:monitor')}</button></div></div><div class="p05-setting-row"><div class="p05-setting-info"><span class="p05-setting-label">Modo Compacto</span><span class="p05-setting-desc">Reduz espacamento e fontes</span></div><label class="p05-switch"><input type="checkbox" data-setting="compactMode" ${compactMode ? 'checked' : ''}><span class="p05-switch-slider"></span></label></div></div><div class="p05-settings-group"><h4 class="p05-settings-group-title">Dados</h4><div class="p05-setting-row"><div class="p05-setting-info"><span class="p05-setting-label">Atualizacao Automatica</span><span class="p05-setting-desc">Atualiza dados periodicamente</span></div><label class="p05-switch"><input type="checkbox" data-setting="autoRefresh" ${autoRefresh ? 'checked' : ''}><span class="p05-switch-slider"></span></label></div><div class="p05-setting-row ${!autoRefresh ? 'p05-disabled' : ''}"><div class="p05-setting-info"><span class="p05-setting-label">Intervalo (segundos)</span><span class="p05-setting-desc">Tempo entre atualizacoes</span></div><select class="p05-select p05-select-sm" data-setting="refreshInterval" ${!autoRefresh ? 'disabled' : ''}><option value="30" ${refreshInterval === 30 ? 'selected' : ''}>30s</option><option value="60" ${refreshInterval === 60 ? 'selected' : ''}>1 min</option><option value="120" ${refreshInterval === 120 ? 'selected' : ''}>2 min</option><option value="300" ${refreshInterval === 300 ? 'selected' : ''}>5 min</option></select></div><div class="p05-setting-row"><div class="p05-setting-info"><span class="p05-setting-label">Itens por Pagina</span><span class="p05-setting-desc">Quantidade de registros na tabela</span></div><select class="p05-select p05-select-sm" data-setting="itemsPerPage"><option value="10" ${itemsPerPage === 10 ? 'selected' : ''}>10</option><option value="25" ${itemsPerPage === 25 ? 'selected' : ''}>25</option><option value="50" ${itemsPerPage === 50 ? 'selected' : ''}>50</option><option value="100" ${itemsPerPage === 100 ? 'selected' : ''}>100</option></select></div></div></div><div class="p05-modal-footer"><button class="p05-btn p05-btn-ghost" data-action="reset-settings">Restaurar Padrao</button><button class="p05-btn p05-btn-primary" data-action="save-settings">${icon('ui:check')} Salvar</button></div></div></div>`;
  }

  renderDateRangePicker(options: Record<string, unknown> = {}) {
    const { startDate = null, endDate = null, selectedPreset = null } = options;
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    return `<div class="p05-modal p05-modal-datepicker" role="dialog" aria-modal="true" aria-labelledby="modal-date-title"><div class="p05-modal-backdrop" data-action="close-modal"></div><div class="p05-modal-content p05-modal-lg"><div class="p05-modal-header"><div class="p05-modal-title-row"><span class="p05-modal-icon">${icon('business:calendar')}</span><h3 id="modal-date-title">Selecionar Periodo</h3></div><button class="p05-modal-close" data-action="close-modal" aria-label="Fechar">${icon('ui:x')}</button></div><div class="p05-modal-body p05-modal-body-flex"><div class="p05-date-presets"><h4 class="p05-date-presets-title">Periodos</h4><div class="p05-date-presets-list">${DATE_PRESETS.map(p => `<button class="p05-date-preset ${selectedPreset === p.id ? 'p05-active' : ''}" data-action="select-preset" data-preset="${p.id}">${p.label}</button>`).join('')}</div></div><div class="p05-date-calendars"><div class="p05-date-inputs"><div class="p05-date-input-group"><label>Data Inicial</label><input type="date" class="p05-input p05-date-input" data-type="start" value="${startDate || ''}"></div><span class="p05-date-separator">ate</span><div class="p05-date-input-group"><label>Data Final</label><input type="date" class="p05-input p05-date-input" data-type="end" value="${endDate || ''}"></div></div><div class="p05-calendars-grid">${this._renderCalendar(currentMonth - 1, currentYear, startDate, endDate)}${this._renderCalendar(currentMonth, currentYear, startDate, endDate)}</div></div></div><div class="p05-modal-footer"><button class="p05-btn p05-btn-ghost" data-action="clear-dates">Limpar</button><button class="p05-btn p05-btn-primary" data-action="apply-dates">${icon('ui:check')} Aplicar</button></div></div></div>`;
  }

  _renderCalendar(month: number, year: number, startDate: unknown, endDate: unknown) {
    if (month < 0) { month = 11; year--; } if (month > 11) { month = 0; year++; }
    const monthNames = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const start = startDate ? new Date(startDate as string | number | Date) : null;
    const end = endDate ? new Date(endDate as string | number | Date) : null;
    if (start) start.setHours(0, 0, 0, 0); if (end) end.setHours(0, 0, 0, 0);
    let days = '';
    for (let i = 0; i < firstDay; i++) days += '<span class="p05-cal-day p05-cal-day-empty"></span>';
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day); date.setHours(0, 0, 0, 0);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      let classes = ['p05-cal-day'];
      if (date.getTime() === today.getTime()) classes.push('p05-cal-today');
      if (start && date.getTime() === start.getTime()) classes.push('p05-cal-start');
      if (end && date.getTime() === end.getTime()) classes.push('p05-cal-end');
      if (start && end && date > start && date < end) classes.push('p05-cal-range');
      if (date > today) classes.push('p05-cal-future');
      days += `<button class="${classes.join(' ')}" data-action="select-date" data-date="${dateStr}">${day}</button>`;
    }
    return `<div class="p05-calendar" data-month="${month}" data-year="${year}"><div class="p05-cal-header"><button class="p05-cal-nav" data-action="prev-month" data-month="${month}" data-year="${year}">${icon('ui:chevron-left')}</button><span class="p05-cal-title">${monthNames[month]} ${year}</span><button class="p05-cal-nav" data-action="next-month" data-month="${month}" data-year="${year}">${icon('ui:chevron-right')}</button></div><div class="p05-cal-weekdays">${dayNames.map(d => `<span>${d}</span>`).join('')}</div><div class="p05-cal-days">${days}</div></div>`;
  }

  _loadSettings() { const defaults = { theme: 'system', compactMode: false, autoRefresh: true, refreshInterval: 60, itemsPerPage: 25 }; try { const saved = localStorage.getItem('p05_settings'); return saved ? { ...defaults, ...JSON.parse(saved) } : defaults; } catch { return defaults; } }
  saveSettings(settings: Record<string, unknown>) { this._settings = { ...this._settings, ...settings }; try { localStorage.setItem('p05_settings', JSON.stringify(this._settings)); } catch (e) {} return this._settings; }
  getSettings() { return { ...this._settings }; }
  resetSettings() { this._settings = { theme: 'system', compactMode: false, autoRefresh: true, refreshInterval: 60, itemsPerPage: 25 }; try { localStorage.removeItem('p05_settings'); } catch (e) {} return this._settings; }
  _formatKey(key: string) { const keyMap: Record<string, string> = { 'ArrowUp': '\u2191', 'ArrowDown': '\u2193', 'ArrowLeft': '\u2190', 'ArrowRight': '\u2192', 'Ctrl': 'Ctrl', 'Alt': 'Alt', 'Shift': 'Shift', 'Enter': '\u21B5', 'Esc': 'Esc', 'Tab': 'Tab', 'Home': 'Home', 'End': 'End' }; return keyMap[key] || key; }
  info() { return { moduleId: MODULE_ID, version: VERSION, settings: this._settings, source: 'IconRegistry' }; }
  healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() }; }
}

export const modalsManager = new ModalsManager();
export default modalsManager;
