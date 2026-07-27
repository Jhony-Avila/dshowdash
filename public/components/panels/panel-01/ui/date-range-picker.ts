// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.4.0-LIFECYCLE-CLEANUP)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/date-range-picker
// PURPOSE: Panel-01 - Date Range Picker
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   PRESETS — exported value
//   DateRangePicker() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'change'
//   'click'
// WINDOW ACCESS:
//   (none)
// @changelog v9.4.0-LIFECYCLE-CLEANUP: AbortController cleanup for document listener + dropdown re-bind (BRF PARTE 3 compliance)
// @changelog v9.3.0-P2-ENTERPRISE: Enterprise P2 compliance
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/ui/date-range-picker';

const PICKER_SVGS = {
  calendar: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  chevronDown: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
  chevronLeft: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
  chevronRight: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>'
};

export const PRESETS = [
  { id: 'today', label: 'Hoje', getValue() { const d = new Date(); return { start: d, end: d }; } },
  { id: 'yesterday', label: 'Ontem', getValue() { const d = new Date(); d.setDate(d.getDate() - 1); return { start: d, end: d }; } },
  { id: 'last7', label: 'Últimos 7 dias', getValue() { const e = new Date(); const s = new Date(); s.setDate(s.getDate() - 6); return { start: s, end: e }; } },
  { id: 'last30', label: 'Últimos 30 dias', getValue() { const e = new Date(); const s = new Date(); s.setDate(s.getDate() - 29); return { start: s, end: e }; } },
  { id: 'thisMonth', label: 'Este mês', getValue() { const d = new Date(); return { start: new Date(d.getFullYear(), d.getMonth(), 1), end: new Date(d.getFullYear(), d.getMonth() + 1, 0) }; } },
  { id: 'lastMonth', label: 'Mês passado', getValue() { const d = new Date(); return { start: new Date(d.getFullYear(), d.getMonth() - 1, 1), end: new Date(d.getFullYear(), d.getMonth(), 0) }; } },
  { id: 'thisYear', label: 'Este ano', getValue() { const d = new Date(); return { start: new Date(d.getFullYear(), 0, 1), end: d }; } }
];

export function DateRangePicker(this: any, container: HTMLElement, options: Record<string, unknown> = {}) {
  this.container = container;
  this.onChange = options.onChange || (() => {});
  this.format = options.format || 'dd/mm/yyyy';
  this._startDate = null;
  this._endDate = null;
  this._dropdown = null;
  this._visible = false;
  this._currentMonth = new Date();
  this._selecting = 'start';
  this._abortController = null;
  this._dropdownAbortController = null;
}

DateRangePicker.prototype.init = function() { this._render(); this._bindEvents(); };

DateRangePicker.prototype._render = function() {
  if (!this.container) return;
  this.container.innerHTML = `<div class="p01-date-range"><button class="p01-date-range-trigger" data-action="toggle"><span class="p01-date-range-icon">${PICKER_SVGS.calendar}</span><span class="p01-date-range-label">Selecionar período</span><span class="p01-date-range-arrow">${PICKER_SVGS.chevronDown}</span></button></div>`;
  this._createDropdown();
};

DateRangePicker.prototype._createDropdown = function() { this._dropdown = document.createElement('div'); this._dropdown.className = 'p01-date-range-dropdown'; this._dropdown.style.display = 'none'; this.container.querySelector('.p01-date-range').appendChild(this._dropdown); };

DateRangePicker.prototype._renderDropdown = function() {
  const self = this;
  const presetsHtml = PRESETS.map(p => `<button class="p01-date-preset" data-preset="${p.id}">${p.label}</button>`).join('');
  this._dropdown.innerHTML = `<div class="p01-date-range-content"><div class="p01-date-presets">${presetsHtml}</div><div class="p01-date-calendars"><div class="p01-date-inputs"><div class="p01-date-input-group"><label>De</label><input type="text" class="p01-input" data-input="start" placeholder="dd/mm/aaaa" value="${this._formatDate(this._startDate)}"></div><div class="p01-date-input-group"><label>Até</label><input type="text" class="p01-input" data-input="end" placeholder="dd/mm/aaaa" value="${this._formatDate(this._endDate)}"></div></div><div class="p01-calendar-nav"><button class="p01-calendar-prev" data-action="prev-month">${PICKER_SVGS.chevronLeft}</button><span class="p01-calendar-title">${this._getMonthName(this._currentMonth)} ${this._currentMonth.getFullYear()}</span><button class="p01-calendar-next" data-action="next-month">${PICKER_SVGS.chevronRight}</button></div><div class="p01-calendar">${this._renderCalendar()}</div></div></div><div class="p01-date-range-footer"><button class="p01-btn p01-btn--secondary p01-btn--sm" data-action="clear">Limpar</button><button class="p01-btn p01-btn--primary p01-btn--sm" data-action="apply">Aplicar</button></div>`;
  this._bindDropdownEvents();
};

DateRangePicker.prototype._renderCalendar = function() {
  const year = this._currentMonth.getFullYear();
  const month = this._currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const self = this;
  let html = '<div class="p01-calendar-header">';
  ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].forEach(d => { html += `<span class="p01-calendar-weekday">${d}</span>`; });
  html += '</div><div class="p01-calendar-days">';
  for (let i = 0; i < firstDay; i++) { html += '<span class="p01-calendar-day p01-calendar-day--empty"></span>'; }
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const classes = ['p01-calendar-day'];
    if (self._isToday(date)) classes.push('p01-calendar-day--today');
    if (self._isSelected(date)) classes.push('p01-calendar-day--selected');
    if (self._isInRange(date)) classes.push('p01-calendar-day--in-range');
    if (self._isRangeStart(date)) classes.push('p01-calendar-day--range-start');
    if (self._isRangeEnd(date)) classes.push('p01-calendar-day--range-end');
    html += `<button class="${classes.join(' ')}" data-date="${date.toISOString()}">${day}</button>`;
  }
  html += '</div>';
  return html;
};

DateRangePicker.prototype._bindEvents = function() {
  const self = this;
  if (this._abortController) this._abortController.abort();
  this._abortController = new AbortController();
  const signal = this._abortController.signal;
  this.container.querySelector('[data-action="toggle"]').addEventListener('click', () => { self.toggle(); }, { signal });
  document.addEventListener('click', (e: MouseEvent) => { if (self._visible && !self.container.contains(e.target as Node)) { self.hide(); } }, { signal });
};

DateRangePicker.prototype._bindDropdownEvents = function() {
  const self = this;
  if (this._dropdownAbortController) this._dropdownAbortController.abort();
  this._dropdownAbortController = new AbortController();
  const signal = this._dropdownAbortController.signal;
  this._dropdown.querySelectorAll('[data-preset]').forEach((btn: Element) => { btn.addEventListener('click', () => { const preset = PRESETS.find((p: Record<string, unknown>) => p.id === (btn as HTMLButtonElement).dataset.preset); if (preset) { const range = preset.getValue(); self._startDate = range.start; self._endDate = range.end; self._updateInputs(); self._updateCalendar(); } }, { signal }); });
  this._dropdown.querySelectorAll('[data-date]').forEach((btn: Element) => { btn.addEventListener('click', () => { const date = new Date((btn as HTMLButtonElement).dataset.date as string); self._selectDate(date); }, { signal }); });
  this._dropdown.querySelector('[data-action="prev-month"]').addEventListener('click', () => { self._currentMonth.setMonth(self._currentMonth.getMonth() - 1); self._updateCalendar(); }, { signal });
  this._dropdown.querySelector('[data-action="next-month"]').addEventListener('click', () => { self._currentMonth.setMonth(self._currentMonth.getMonth() + 1); self._updateCalendar(); }, { signal });
  this._dropdown.querySelector('[data-action="clear"]').addEventListener('click', () => { self.clear(); }, { signal });
  this._dropdown.querySelector('[data-action="apply"]').addEventListener('click', () => { self._apply(); }, { signal });
  this._dropdown.querySelector('[data-input="start"]').addEventListener('change', (e: Event) => { const date = self._parseDate((e.target as HTMLInputElement).value); if (date) self._startDate = date; self._updateCalendar(); }, { signal });
  this._dropdown.querySelector('[data-input="end"]').addEventListener('change', (e: Event) => { const date = self._parseDate((e.target as HTMLInputElement).value); if (date) self._endDate = date; self._updateCalendar(); }, { signal });
};

DateRangePicker.prototype._selectDate = function(date: Date) { if (this._selecting === 'start' || !this._startDate || date < this._startDate) { this._startDate = date; this._endDate = null; this._selecting = 'end'; } else { this._endDate = date; this._selecting = 'start'; } this._updateInputs(); this._updateCalendar(); };
DateRangePicker.prototype._updateInputs = function() { this._dropdown.querySelector('[data-input="start"]').value = this._formatDate(this._startDate); this._dropdown.querySelector('[data-input="end"]').value = this._formatDate(this._endDate); };
DateRangePicker.prototype._updateCalendar = function() { this._dropdown.querySelector('.p01-calendar').innerHTML = this._renderCalendar(); this._dropdown.querySelector('.p01-calendar-title').textContent = `${this._getMonthName(this._currentMonth)} ${this._currentMonth.getFullYear()}`; this._bindDropdownEvents(); };
DateRangePicker.prototype._apply = function() { this._updateLabel(); this.hide(); this.onChange({ start: this._startDate, end: this._endDate }); };
DateRangePicker.prototype._updateLabel = function() { const label = this.container.querySelector('.p01-date-range-label'); if (this._startDate && this._endDate) { label.textContent = `${this._formatDate(this._startDate)} - ${this._formatDate(this._endDate)}`; } else if (this._startDate) { label.textContent = `A partir de ${this._formatDate(this._startDate)}`; } else { label.textContent = 'Selecionar período'; } };
DateRangePicker.prototype._isToday = (date: Date) => { const today = new Date(); return date.toDateString() === today.toDateString(); };
DateRangePicker.prototype._isSelected = function(date: Date) { return (this._startDate && date.toDateString() === this._startDate.toDateString()) || (this._endDate && date.toDateString() === this._endDate.toDateString()); };
DateRangePicker.prototype._isInRange = function(date: Date) { if (!this._startDate || !this._endDate) return false; return date > this._startDate && date < this._endDate; };
DateRangePicker.prototype._isRangeStart = function(date: Date) { return this._startDate && date.toDateString() === this._startDate.toDateString(); };
DateRangePicker.prototype._isRangeEnd = function(date: Date) { return this._endDate && date.toDateString() === this._endDate.toDateString(); };
DateRangePicker.prototype._formatDate = (date: Date | null) => { if (!date) return ''; const d = date.getDate().toString().padStart(2, '0'); const m = (date.getMonth() + 1).toString().padStart(2, '0'); const y = date.getFullYear(); return `${d}/${m}/${y}`; };
DateRangePicker.prototype._parseDate = (str: string) => { if (!str) return null; const parts = str.split('/'); if (parts.length !== 3) return null; return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])); };
DateRangePicker.prototype._getMonthName = (date: Date) => date.toLocaleDateString('pt-BR', { month: 'long' });
DateRangePicker.prototype.show = function() { this._renderDropdown(); this._dropdown.style.display = 'block'; this._visible = true; };
DateRangePicker.prototype.hide = function() { this._dropdown.style.display = 'none'; this._visible = false; };
DateRangePicker.prototype.toggle = function() { if (this._visible) this.hide(); else this.show(); };
DateRangePicker.prototype.clear = function() { this._startDate = null; this._endDate = null; this._selecting = 'start'; this._updateInputs(); this._updateCalendar(); this._updateLabel(); };
DateRangePicker.prototype.getValue = function() { return { start: this._startDate, end: this._endDate }; };
DateRangePicker.prototype.setValue = function(start: Date | null, end: Date | null) { this._startDate = start; this._endDate = end; this._updateLabel(); };
DateRangePicker.prototype.destroy = function() { if (this._abortController) { this._abortController.abort(); this._abortController = null; } if (this._dropdownAbortController) { this._dropdownAbortController.abort(); this._dropdownAbortController = null; } if (this.container) this.container.innerHTML = ''; this._dropdown = null; };

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { cleanupAvailable: true } }; }
export default { DateRangePicker, PRESETS, PICKER_SVGS, info, healthCheck };
