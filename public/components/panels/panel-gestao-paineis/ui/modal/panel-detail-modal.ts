/* ═══════════════════════════════════════════════════════════════
 * panel-gestao-paineis/ui/modal/panel-detail-modal.ts
 * @version 1.1.0
 * v1.1.0: Botao "Abrir Painel" + Historico de Screenshots
 * ═══════════════════════════════════════════════════════════════ */

import { CSS_PREFIX } from '../../core/constants.js';
import type { PanelData, PanelCategory } from '../../core/types.js';
import { renderStatusBadge } from '../indicators/status-badge.js';
import { renderScreenshotAge } from '../indicators/screenshot-age.js';

function esc(str: string | null | undefined): string {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderTagsEditor(tags: string[]): string {
  const chips = tags.map(tag =>
    `<span class="${CSS_PREFIX}-tag">${esc(tag)}<button class="${CSS_PREFIX}-tag__remove" data-action="remove-tag" data-tag="${esc(tag)}">&times;</button></span>`
  ).join('');
  return `
    <div class="${CSS_PREFIX}-tags-editor">
      ${chips}
      <input type="text" class="${CSS_PREFIX}-tag-input" placeholder="+ tag" data-action="add-tag" maxlength="30" />
    </div>`;
}

function renderCategorySelect(current: string, categories: PanelCategory[]): string {
  const options = categories.map(c => {
    const sel = c.category === current ? ' selected' : '';
    return `<option value="${c.category}"${sel}>${c.category}</option>`;
  }).join('');
  return `<select class="${CSS_PREFIX}-modal__select" data-field="category">${options}</select>`;
}

function getPanelUrl(panel: PanelData): string | null {
  if (panel.route) {
    const route = panel.route.startsWith('/') ? panel.route : `/${panel.route}`;
    return `/#${route}`;
  }
  return null;
}

export function renderDetailModal(panel: PanelData, categories: PanelCategory[], isPending: boolean): string {
  const thumbSrc = panel.thumbnail_url
    ? `<img src="${esc(panel.thumbnail_url)}" alt="${esc(panel.title)}" class="${CSS_PREFIX}-modal__screenshot" />`
    : `<div class="${CSS_PREFIX}-modal__no-screenshot">Sem screenshot disponível</div>`;

  const screenshotIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`;

  const screenshotBtn = isPending
    ? `<button class="${CSS_PREFIX}-btn ${CSS_PREFIX}-btn--screenshot ${CSS_PREFIX}-btn--pending" disabled><span class="${CSS_PREFIX}-spinner"></span> Capturando...</button>`
    : `<button class="${CSS_PREFIX}-btn ${CSS_PREFIX}-btn--screenshot" data-action="modal-screenshot" data-panel-id="${esc(panel.panel_id)}">${screenshotIcon} Capturar novo screenshot</button>`;

  /* ── MELHORIA 2: Botao Abrir Painel ── */
  const panelUrl = getPanelUrl(panel);
  const openPanelBtn = panelUrl
    ? `<a href="${esc(panelUrl)}" target="_blank" rel="noopener" class="${CSS_PREFIX}-btn ${CSS_PREFIX}-btn--open-panel">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        Abrir Painel
      </a>`
    : '';

  return `
    <div class="${CSS_PREFIX}-modal-overlay" data-action="close-modal">
      <div class="${CSS_PREFIX}-modal" role="dialog" aria-label="Detalhes do painel">
        <div class="${CSS_PREFIX}-modal__header">
          <h2 class="${CSS_PREFIX}-modal__title">Detalhes do Painel</h2>
          <div class="${CSS_PREFIX}-modal__header-actions">
            ${openPanelBtn}
            <button class="${CSS_PREFIX}-modal__close" data-action="close-modal" title="Fechar">&times;</button>
          </div>
        </div>
        <div class="${CSS_PREFIX}-modal__content">
          <div class="${CSS_PREFIX}-modal__thumb-container">
            ${thumbSrc}
          </div>

          <div class="${CSS_PREFIX}-modal__section">
            <h3>Informações Gerais</h3>
            <div class="${CSS_PREFIX}-modal__field">
              <label>ID</label>
              <span>${esc(panel.panel_id)}</span>
            </div>
            <div class="${CSS_PREFIX}-modal__field">
              <label>Título</label>
              <input type="text" class="${CSS_PREFIX}-modal__input" data-field="title" value="${esc(panel.title)}" maxlength="150" />
            </div>
            <div class="${CSS_PREFIX}-modal__field">
              <label>Descrição</label>
              <textarea class="${CSS_PREFIX}-modal__textarea" data-field="description" rows="3" maxlength="2000">${esc(panel.description)}</textarea>
            </div>
            <div class="${CSS_PREFIX}-modal__field">
              <label>Categoria</label>
              ${renderCategorySelect(panel.category, categories)}
            </div>
            <div class="${CSS_PREFIX}-modal__field">
              <label>Tags</label>
              ${renderTagsEditor(panel.tags || [])}
            </div>
            <div class="${CSS_PREFIX}-modal__field">
              <label>Versão</label>
              <input type="text" class="${CSS_PREFIX}-modal__input" data-field="version" value="${esc(panel.version)}" maxlength="20" />
            </div>
            <div class="${CSS_PREFIX}-modal__field">
              <label>Autor</label>
              <input type="text" class="${CSS_PREFIX}-modal__input" data-field="author" value="${esc(panel.author)}" maxlength="100" />
            </div>
            <div class="${CSS_PREFIX}-modal__field">
              <label>Rota</label>
              <span>${panel.route ? `<a href="${esc(panel.route)}" target="_blank" rel="noopener">${esc(panel.route)}</a>` : '—'}</span>
            </div>
            <div class="${CSS_PREFIX}-modal__field">
              <label>Módulo</label>
              <span>${esc(panel.module_name)}</span>
            </div>
            <div class="${CSS_PREFIX}-modal__field">
              <label>Ordem</label>
              <span>${panel.sort_order}</span>
            </div>
            <div class="${CSS_PREFIX}-modal__field">
              <label>Status</label>
              <div class="${CSS_PREFIX}-modal__status-row">
                ${renderStatusBadge(panel.is_active)}
                <button class="${CSS_PREFIX}-btn ${CSS_PREFIX}-btn--toggle-modal" data-action="modal-toggle" data-panel-id="${esc(panel.panel_id)}">${panel.is_active ? 'Desativar' : 'Ativar'}</button>
              </div>
            </div>
          </div>

          <div class="${CSS_PREFIX}-modal__section">
            <h3>Screenshots</h3>
            <div class="${CSS_PREFIX}-modal__field">
              <label>Total de capturas</label>
              <span>${panel.screenshot_count}</span>
            </div>
            <div class="${CSS_PREFIX}-modal__field">
              <label>Último screenshot</label>
              ${renderScreenshotAge(panel.last_screenshot_at)}
            </div>
            ${screenshotBtn}
          </div>

          <!-- MELHORIA 5: Historico de Screenshots -->
          <div class="${CSS_PREFIX}-modal__section">
            <h3>Histórico de Screenshots</h3>
            <div class="${CSS_PREFIX}-screenshot-history" data-panel-id="${esc(panel.panel_id)}" data-action="load-screenshot-history">
              <div class="${CSS_PREFIX}-screenshot-history__loading">
                <span class="${CSS_PREFIX}-spinner"></span> Carregando histórico...
              </div>
            </div>
          </div>
        </div>
        <div class="${CSS_PREFIX}-modal__footer">
          <button class="${CSS_PREFIX}-btn ${CSS_PREFIX}-btn--primary" data-action="save-panel" data-panel-id="${esc(panel.panel_id)}">Salvar alterações</button>
          <button class="${CSS_PREFIX}-btn ${CSS_PREFIX}-btn--secondary" data-action="close-modal">Fechar</button>
        </div>
      </div>
    </div>`;
}

export function renderScreenshotHistory(screenshots: Array<{ id: number; created_at: string; file_size: number; path: string }>): string {
  if (!screenshots || screenshots.length === 0) {
    return `<div class="${CSS_PREFIX}-screenshot-history__empty">Nenhum screenshot encontrado</div>`;
  }

  const items = screenshots.slice(0, 5).map(s => {
    const date = new Date(s.created_at);
    const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const sizeKB = (s.file_size / 1024).toFixed(1);
    return `
      <div class="${CSS_PREFIX}-screenshot-history__item">
        <span class="${CSS_PREFIX}-screenshot-history__date">${dateStr}</span>
        <span class="${CSS_PREFIX}-screenshot-history__size">${sizeKB} KB</span>
      </div>`;
  }).join('');

  return `<div class="${CSS_PREFIX}-screenshot-history__list">${items}</div>`;
}

export function getModalFormData(container: HTMLElement): Partial<PanelData> {
  const data: Record<string, unknown> = {};
  const modal = container.querySelector(`.${CSS_PREFIX}-modal`);
  if (!modal) return data as Partial<PanelData>;

  const title = modal.querySelector<HTMLInputElement>('[data-field="title"]');
  if (title) data.title = title.value.trim();

  const desc = modal.querySelector<HTMLTextAreaElement>('[data-field="description"]');
  if (desc) data.description = desc.value.trim() || null;

  const cat = modal.querySelector<HTMLSelectElement>('[data-field="category"]');
  if (cat) data.category = cat.value;

  const version = modal.querySelector<HTMLInputElement>('[data-field="version"]');
  if (version) data.version = version.value.trim();

  const author = modal.querySelector<HTMLInputElement>('[data-field="author"]');
  if (author) data.author = author.value.trim() || null;

  const tagEls = modal.querySelectorAll(`.${CSS_PREFIX}-tag`);
  const tags: string[] = [];
  tagEls.forEach(el => {
    const text = el.firstChild?.textContent?.trim();
    if (text) tags.push(text);
  });
  data.tags = tags;

  return data as Partial<PanelData>;
}
