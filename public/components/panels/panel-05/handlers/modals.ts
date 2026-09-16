// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.3.2-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05/handlers/modals
// PURPOSE: Handlers dos modais (configurações, tema, seletor de período) — delegação em `document`, porque o
//          ModalController anexa o modal em document.body, fora do container do painel.
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   store from ../state/store.js · modalsManager from ../ui/modals.js · ModalController from ../managers/modal-controller.js
//   themeManager from ../utils/theme-manager.js · toastManager from ../ui/toast.js · loadClientes from ./data.js
//
// PROVIDES: handleClick(e, refs), handleChange(e), getDateRange(), applySettings(settings, refs)
//
// HISTÓRICO:
//   2026-09-16 (backlog do painel 05): ui/modals.ts emitia set-theme/save-settings/reset-settings/select-preset/
//   select-date/prev-month/next-month/clear-dates/apply-dates e nenhum tinha handler (só close-modal).
// ═══════════════════════════════════════════════════════════════
'use strict';
import { store } from '../state/store.js';
import { modalsManager } from '../ui/modals.js';
import * as ModalController from '../managers/modal-controller.js';
import { themeManager } from '../utils/theme-manager.js';
import { toastManager } from '../ui/toast.js';
import { loadClientes } from './data.js';

export const VERSION = '9.3.2-P2-ENTERPRISE';
export const MODULE_ID = 'panel-05:handlers:modals';

type DateRange = { start: string | null; end: string | null; preset: string | null; month: number; year: number };
const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
let _dp: DateRange = { start: null, end: null, preset: null, month: today().getMonth(), year: today().getFullYear() };

const PRESETS: Record<string, () => { start: Date; end: Date } | null> = {
  today: () => ({ start: today(), end: today() }),
  yesterday: () => { const d = today(); d.setDate(d.getDate() - 1); return { start: d, end: d }; },
  '7d': () => { const s = today(); s.setDate(s.getDate() - 7); return { start: s, end: today() }; },
  '30d': () => { const s = today(); s.setDate(s.getDate() - 30); return { start: s, end: today() }; },
  '90d': () => { const s = today(); s.setDate(s.getDate() - 90); return { start: s, end: today() }; },
  thisMonth: () => { const d = today(); return { start: new Date(d.getFullYear(), d.getMonth(), 1), end: new Date(d.getFullYear(), d.getMonth() + 1, 0) }; },
  lastMonth: () => { const d = today(); return { start: new Date(d.getFullYear(), d.getMonth() - 1, 1), end: new Date(d.getFullYear(), d.getMonth(), 0) }; },
  thisYear: () => { const d = today(); return { start: new Date(d.getFullYear(), 0, 1), end: d }; },
  custom: () => null,
};

export function getDateRange(): DateRange { return { ..._dp }; }

const _reopenDatePicker = () => ModalController.show('date-picker', { startDate: _dp.start, endDate: _dp.end, selectedPreset: _dp.preset, month: _dp.month, year: _dp.year });
const _reopenSettings = () => ModalController.show('settings');

/** Aplica configurações salvas ao painel montado (tema, modo compacto). Intervalo/itens por página valem no próximo mount. */
export function applySettings(settings: Record<string, unknown>, refs: Record<string, unknown> | null) {
  const theme = String(settings.theme || 'system');
  try { themeManager.init(); themeManager.setTheme(theme); } catch { /* tema é best-effort */ }
  const panel = (refs?.panel as HTMLElement | undefined) || (document.querySelector('.p05-panel') as HTMLElement | null);
  if (panel) panel.classList.toggle('p05-compact', !!settings.compactMode);
}

function _readSettingsFromModal(modal: HTMLElement): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  modal.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-setting]').forEach((el) => {
    const key = el.dataset.setting as string;
    if ((el as HTMLInputElement).type === 'checkbox') out[key] = (el as HTMLInputElement).checked;
    else { const v = el.value; out[key] = /^\d+$/.test(v) ? Number(v) : v; }
  });
  return out;
}

/** Delegação em `document`: só reage a alvos dentro de um .p05-modal-wrapper. Devolve true se tratou. */
export function handleClick(e: Event, refs: Record<string, unknown> | null): boolean {
  const target = (e.target as Element)?.closest('[data-action]') as HTMLElement | null;
  if (!target) return false;
  const modal = target.closest('.p05-modal-wrapper') as HTMLElement | null;
  if (!modal) return false;
  const action = target.dataset.action;
  switch (action) {
    case 'set-theme': {
      const theme = target.dataset.theme || 'system';
      const s = modalsManager.saveSettings({ theme });
      applySettings(s, refs);
      _reopenSettings();
      return true;
    }
    case 'save-settings': {
      const s = modalsManager.saveSettings(_readSettingsFromModal(modal));
      applySettings(s, refs);
      ModalController.close();
      toastManager.success('Configurações salvas');
      return true;
    }
    case 'reset-settings': {
      const s = modalsManager.resetSettings();
      applySettings(s, refs);
      _reopenSettings();
      toastManager.info('Configurações restauradas');
      return true;
    }
    case 'select-preset': {
      const id = target.dataset.preset || 'custom';
      const r = PRESETS[id] ? PRESETS[id]() : null;
      _dp = { ..._dp, preset: id, start: r ? iso(r.start) : _dp.start, end: r ? iso(r.end) : _dp.end };
      if (r) { _dp.month = r.end.getMonth(); _dp.year = r.end.getFullYear(); }
      _reopenDatePicker();
      return true;
    }
    case 'select-date': {
      const d = target.dataset.date || null;
      if (!d) return true;
      if (!_dp.start || (_dp.start && _dp.end)) { _dp = { ..._dp, start: d, end: null, preset: 'custom' }; }
      else if (d < _dp.start) { _dp = { ..._dp, start: d, preset: 'custom' }; }
      else { _dp = { ..._dp, end: d, preset: 'custom' }; }
      _reopenDatePicker();
      return true;
    }
    case 'prev-month':
    case 'next-month': {
      let m = Number(target.dataset.month ?? _dp.month) + (action === 'prev-month' ? -1 : 1);
      let y = Number(target.dataset.year ?? _dp.year);
      if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
      _dp = { ..._dp, month: m, year: y };
      _reopenDatePicker();
      return true;
    }
    case 'clear-dates': {
      _dp = { start: null, end: null, preset: null, month: today().getMonth(), year: today().getFullYear() };
      store.setFilters({ dataInicio: '', dataFim: '' });
      _reopenDatePicker();
      return true;
    }
    case 'apply-dates': {
      if (!_dp.start) { toastManager.warning('Escolha a data inicial'); return true; }
      const end = _dp.end || _dp.start;
      store.setFilters({ dataInicio: _dp.start, dataFim: end });
      ModalController.close();
      loadClientes();
      toastManager.success(`Período aplicado: ${_dp.start} até ${end}`);
      return true;
    }
    default:
      return false;
  }
}

/** Inputs de data digitados no modal. */
export function handleChange(e: Event): boolean {
  const el = e.target as HTMLInputElement | null;
  if (!el || !el.classList?.contains('p05-date-input') || !el.closest('.p05-modal-wrapper')) return false;
  if (el.dataset.type === 'start') _dp = { ..._dp, start: el.value || null, preset: 'custom' };
  if (el.dataset.type === 'end') _dp = { ..._dp, end: el.value || null, preset: 'custom' };
  return true;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, dateRange: getDateRange() }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { modalsReady: true } }; }
export default { handleClick, handleChange, getDateRange, applySettings, info, healthCheck, VERSION, MODULE_ID };
