// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-card
// PURPOSE: Container Card Component
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   CARD_VARIANT — exported value
//   createCard() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'click'
//   'keydown'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'container-card';

export const CARD_VARIANT = { DEFAULT: 'default', ELEVATED: 'elevated', OUTLINED: 'outlined', FILLED: 'filled' };

export function createCard(options: Record<string, any> = {}) {
  const {
    title = '',
    subtitle = '',
    content = '',
    image = null,
    imageAlt = '',
    variant = CARD_VARIANT.DEFAULT,
    actions = [],
    headerActions = [],
    clickable = false,
    className = '',
    onClick
  } = options;
  
  const card = document.createElement('article');
  card.className = `dsd-card dsd-card--${variant} ${clickable ? 'dsd-card--clickable' : ''} ${className}`.trim();
  if (clickable) { card.tabIndex = 0; card.setAttribute('role', 'button'); }
  
  let imageHtml = '';
  if (image) {
    imageHtml = `<div class="dsd-card__media"><img src="${image}" alt="${imageAlt}" class="dsd-card__image" loading="lazy" /></div>`;
  }
  
  let headerHtml = '';
  if (title || subtitle || headerActions.length > 0) {
    const headerActionsHtml = headerActions.length > 0 
      ? `<div class="dsd-card__header-actions">${headerActions.map((a: { label?: string; icon?: string; onClick?: () => void }, i: number) => 
      `<button type="button" class="dsd-card__header-action" data-header-action="${i}" aria-label="${a.label || ''}">${a.icon || a.label}</button>`
    ).join('')}</div>`
      : '';
    headerHtml = `
      <header class="dsd-card__header">
        <div class="dsd-card__header-text">
          ${title ? `<h3 class="dsd-card__title">${title}</h3>` : ''}
          ${subtitle ? `<p class="dsd-card__subtitle">${subtitle}</p>` : ''}
        </div>
        ${headerActionsHtml}
      </header>
    `;
  }
  
  let contentHtml = '';
  if (content) {
    contentHtml = `<div class="dsd-card__content">${typeof content === 'string' ? content : ''}</div>`;
  }
  
  let actionsHtml = '';
  if (actions.length > 0) {
    actionsHtml = `<footer class="dsd-card__actions">${actions.map((a: { label?: string; primary?: boolean; onClick?: () => void }, i: number) => 
  `<button type="button" class="dsd-card__action ${a.primary ? 'dsd-card__action--primary' : ''}" data-action="${i}">${a.label}</button>`
).join('')}</footer>`;
  }
  
  card.innerHTML = `${imageHtml}${headerHtml}${contentHtml}${actionsHtml}`;
  
  if (content instanceof HTMLElement) {
    card.querySelector('.dsd-card__content')?.appendChild(content);
  }
  
  if (clickable) {

    card.addEventListener('click', (e) => { if (!(e.target as HTMLElement).closest('button')) onClick?.(); });
    card.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && !(e.target as any).closest('button')) { e.preventDefault(); onClick?.(); } });
  }
  
  actions.forEach((a: { onClick?: () => void }, i: number) => {
    card.querySelector(`[data-action="${i}"]`)?.addEventListener('click', (e) => { e.stopPropagation(); a.onClick?.(); });
  });
  
  headerActions.forEach((a: { onClick?: () => void }, i: number) => {
    card.querySelector(`[data-header-action="${i}"]`)?.addEventListener('click', (e) => { e.stopPropagation(); a.onClick?.(); });
  });
  
  return {
    element: card,
    setTitle(t: string) { const el = card.querySelector('.dsd-card__title'); if (el) el.textContent = t; return this; },
    setSubtitle(s: string) { const el = card.querySelector('.dsd-card__subtitle'); if (el) el.textContent = s; return this; },
    setContent(c: string | HTMLElement) { const el = card.querySelector('.dsd-card__content'); if (el) { if (typeof c === 'string') el.innerHTML = c; else { el.innerHTML = ''; el.appendChild(c as Node); } } return this; },

    setImage(src: string, alt = '') { const el = card.querySelector('.dsd-card__image'); if (el) { (el as HTMLImageElement).src = src; (el as HTMLImageElement).alt = alt; } return this; },
    getElement() { return card; }
  };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID }; }

export default { createCard, info, healthCheck, VERSION, MODULE_ID, CARD_VARIANT };
