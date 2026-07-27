/* ═══════════════════════════════════════════════════════════════
 * panel-criacao-botoes/ui/form/button-form.ts
 * @version 1.1.0
 * Render PURO do formulário de criação/edição de botão.
 * Campos (MVP): label, ícone, grupo, painel de destino, rota, ativo.
 * Criação: item_key/rota derivados. Edição: pré-preenchido, item_key
 * read-only (chave estável); picker de ícone usa ícones já em uso.
 * ═══════════════════════════════════════════════════════════════ */

import { CSS_PREFIX, STUB_PANEL_ID } from '../../core/constants.js';
import { CONFIG } from '../../core/config.js';
import { formFromItem } from '../../core/form-logic.js';
import { renderSidebarPreview } from '../preview/button-preview.js';
import type { CreateFormValues } from '../../core/form-logic.js';
import type { NavGroup, RealPanel, NavItem } from '../../core/types.js';

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface FormViewModel {
  mode: 'create' | 'edit';
  groups: NavGroup[];
  realPanels: RealPanel[];
  icons: string[];
  editing?: NavItem | null;
}

function groupOptions(groups: NavGroup[], selected: string): string {
  return groups
    .filter((g) => g.group_key !== '__ungrouped__')
    .map(
      (g) =>
        `<option value="${esc(g.group_key)}"${g.group_key === selected ? ' selected' : ''}>${esc(g.label)}</option>`
    )
    .join('');
}

function panelOptions(realPanels: RealPanel[], selected: string): string {
  const sel = (v: string) => (v === selected ? ' selected' : '');
  const placeholder = `<option value="${STUB_PANEL_ID}"${sel(STUB_PANEL_ID)}>${esc(CONFIG.labels.placeholderOption)}</option>`;
  const real = realPanels
    .filter((p) => p.panel_id !== STUB_PANEL_ID)
    .map((p) => `<option value="${esc(p.panel_id)}"${sel(p.panel_id)}>${esc(p.title)} — ${esc(p.panel_id)}</option>`)
    .join('');
  return placeholder + real;
}

function iconDatalist(icons: string[]): string {
  return icons.map((i) => `<option value="${esc(i)}"></option>`).join('');
}

export function renderForm(vm: FormViewModel): string {
  const p = CSS_PREFIX;
  const isEdit = vm.mode === 'edit' && !!vm.editing;
  const v: CreateFormValues = isEdit
    ? formFromItem(vm.editing as NavItem)
    : { label: '', icon: '', group: '', panel_id: STUB_PANEL_ID, route_path: '', is_active: false };

  const formName = isEdit ? 'edit' : 'create';
  const title = isEdit ? CONFIG.labels.edit : CONFIG.labels.new;
  const keyLine = isEdit
    ? `<p class="${p}-form__preview" data-role="key-preview">chave: ${esc((vm.editing as NavItem).id)} (não muda na edição)</p>`
    : `<p class="${p}-form__preview" data-role="key-preview">a chave e a rota são geradas a partir do grupo + label</p>`;

  return `
    <form class="${p}-form" data-form="${formName}" novalidate>
      <h3 class="${p}-form__title">${esc(title)}</h3>
      <div class="${p}-form__err" data-role="form-error" hidden></div>

      <div class="${p}-form__row">
        <label class="${p}-form__field">
          <span class="${p}-form__label">Label *</span>
          <input type="text" name="label" class="${p}-input" required value="${esc(v.label)}" placeholder="ex: Relatórios" autocomplete="off">
        </label>
        <label class="${p}-form__field">
          <span class="${p}-form__label">Ícone</span>
          <input type="text" name="icon" class="${p}-input" list="${p}-icons" value="${esc(v.icon)}" placeholder="ex: bar-chart" autocomplete="off">
          <datalist id="${p}-icons">${iconDatalist(vm.icons)}</datalist>
        </label>
      </div>

      <div class="${p}-form__row">
        <label class="${p}-form__field">
          <span class="${p}-form__label">Grupo *</span>
          <select name="group" class="${p}-select" required>
            <option value="">— selecione —</option>
            ${groupOptions(vm.groups, v.group)}
          </select>
        </label>
        <label class="${p}-form__field">
          <span class="${p}-form__label">Painel de destino *</span>
          <select name="panel_id" class="${p}-select" required>
            ${panelOptions(vm.realPanels, v.panel_id)}
          </select>
        </label>
      </div>

      <div class="${p}-form__row">
        <label class="${p}-form__field">
          <span class="${p}-form__label">Rota (opcional — derivada se vazia)</span>
          <input type="text" name="route_path" class="${p}-input" value="${esc(v.route_path)}" placeholder="#/grupo/slug" autocomplete="off">
        </label>
        <label class="${p}-form__field ${p}-form__field--check">
          <input type="checkbox" name="is_active" class="${p}-checkbox"${v.is_active ? ' checked' : ''}>
          <span class="${p}-form__label">Ativo (aparece na sidebar)</span>
        </label>
      </div>

      ${keyLine}

      <div class="${p}-pv-wrap" data-role="preview">${renderSidebarPreview({ label: v.label, icon: v.icon, panel_id: v.panel_id, is_active: v.is_active })}</div>

      <div class="${p}-form__actions">
        <button type="button" class="${p}-btn ${p}-btn--ghost" data-action="cancel">${esc(CONFIG.labels.cancel)}</button>
        <button type="submit" class="${p}-btn ${p}-btn--primary" data-action="submit-${formName}">${esc(CONFIG.labels.save)}</button>
      </div>
    </form>`;
}
