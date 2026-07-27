// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-badge
// PURPOSE: Container Badge Component
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   BADGE_VARIANT — exported value
//   BADGE_SIZE — exported value
//   createBadge() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'click'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'container-badge';

export const BADGE_VARIANT = {
  DEFAULT: 'default',
  PRIMARY: 'primary',
  SUCCESS: 'success',
  WARNING: 'warning',
  DANGER: 'danger',
  INFO: 'info'
};

export const BADGE_SIZE = { SM: 'sm', MD: 'md', LG: 'lg' };

export function createBadge(options: Record<string, any> = {}) {
  const {
    text = '',
    variant = BADGE_VARIANT.DEFAULT,
    size = BADGE_SIZE.MD,
    rounded = false,
    dot = false,
    removable = false,
    className = '',
    onRemove
  } = options;
  
  const badge = document.createElement('span');
  badge.className = `dsd-badge dsd-badge--${variant} dsd-badge--${size} ${rounded ? 'dsd-badge--rounded' : ''} ${dot ? 'dsd-badge--dot' : ''} ${className}`.trim();
  
  if (dot) {
    badge.innerHTML = '<span class="dsd-badge__dot"></span>';
  } else {
    badge.innerHTML = `
      <span class="dsd-badge__text">${text}</span>
      ${removable ? '<button type="button" class="dsd-badge__remove" aria-label="Remover">×</button>' : ''}
    `;
    
    if (removable) {
      badge.querySelector('.dsd-badge__remove')?.addEventListener('click', (e) => {
        e.stopPropagation();
        onRemove?.();
        badge.remove();
      });
    }
  }
  
  return {
    element: badge,
    setText(newText: string) { const textEl = badge.querySelector('.dsd-badge__text'); if (textEl) textEl.textContent = newText; return this; },
    setVariant(newVariant: string) { Object.values(BADGE_VARIANT).forEach(v => badge.classList.remove(`dsd-badge--${v}`)); badge.classList.add(`dsd-badge--${newVariant}`); return this; },
    remove() { badge.remove(); },
    getElement() { return badge; }
  };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID }; }

export default { createBadge, info, healthCheck, VERSION, MODULE_ID, BADGE_VARIANT, BADGE_SIZE };
