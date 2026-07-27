// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-skeleton
// PURPOSE: Container Skeleton Loader Component
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ../utils/logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createSkeleton() — exported function
//   info() — exported function
//   healthCheck() — exported function
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

export const VERSION = '8.2.0-ENTERPRISE';
export const MODULE_ID = 'container-skeleton';
import { createLogger } from '../utils/logger.js';
const logger = createLogger(MODULE_ID);

// Options validation
function _validateOptions(options: Record<string, unknown>) {
  const errors = [];
  if (options.type !== undefined && !['dashboard', 'list', 'cards', 'simple'].includes(options.type as string)) errors.push('type must be dashboard|list|cards|simple');
  if (errors.length > 0) logger.warn('Invalid options', { errors });
  return errors.length === 0;
}

const SKELETON_TEMPLATES = {
  dashboard: `<div class="dsd-container__skeleton dsd-skeleton-dashboard" role="status" aria-label="Carregando dashboard" aria-busy="true">
    <div class="dsd-skeleton-dashboard__header"><div class="dsd-skeleton dsd-skeleton--title"></div><div class="dsd-skeleton dsd-skeleton--button"></div></div>
    <div class="dsd-skeleton-dashboard__cards"><div class="dsd-skeleton dsd-skeleton--card-sm"></div><div class="dsd-skeleton dsd-skeleton--card-sm"></div><div class="dsd-skeleton dsd-skeleton--card-sm"></div><div class="dsd-skeleton dsd-skeleton--card-sm"></div></div>
    <div class="dsd-skeleton-dashboard__main"><div class="dsd-skeleton dsd-skeleton--chart"></div><div class="dsd-skeleton-stack"><div class="dsd-skeleton dsd-skeleton--text"></div><div class="dsd-skeleton dsd-skeleton--text-sm"></div><div class="dsd-skeleton dsd-skeleton--text"></div><div class="dsd-skeleton dsd-skeleton--text-lg"></div></div></div>
  </div>`,
  list: `<div class="dsd-container__skeleton" role="status" aria-label="Carregando lista" aria-busy="true">
    <div class="dsd-skeleton-row"><div class="dsd-skeleton dsd-skeleton--avatar"></div><div class="dsd-skeleton-stack" style="flex:1"><div class="dsd-skeleton dsd-skeleton--text-lg"></div><div class="dsd-skeleton dsd-skeleton--text-sm"></div></div></div>
    <div class="dsd-skeleton-row"><div class="dsd-skeleton dsd-skeleton--avatar"></div><div class="dsd-skeleton-stack" style="flex:1"><div class="dsd-skeleton dsd-skeleton--text-lg"></div><div class="dsd-skeleton dsd-skeleton--text-sm"></div></div></div>
    <div class="dsd-skeleton-row"><div class="dsd-skeleton dsd-skeleton--avatar"></div><div class="dsd-skeleton-stack" style="flex:1"><div class="dsd-skeleton dsd-skeleton--text-lg"></div><div class="dsd-skeleton dsd-skeleton--text-sm"></div></div></div>
    <div class="dsd-skeleton-row"><div class="dsd-skeleton dsd-skeleton--avatar"></div><div class="dsd-skeleton-stack" style="flex:1"><div class="dsd-skeleton dsd-skeleton--text-lg"></div><div class="dsd-skeleton dsd-skeleton--text-sm"></div></div></div>
    <div class="dsd-skeleton-row"><div class="dsd-skeleton dsd-skeleton--avatar"></div><div class="dsd-skeleton-stack" style="flex:1"><div class="dsd-skeleton dsd-skeleton--text-lg"></div><div class="dsd-skeleton dsd-skeleton--text-sm"></div></div></div>
  </div>`,
  cards: `<div class="dsd-container__skeleton" role="status" aria-label="Carregando cards" aria-busy="true"><div class="dsd-skeleton-grid"><div class="dsd-skeleton dsd-skeleton--card"></div><div class="dsd-skeleton dsd-skeleton--card"></div><div class="dsd-skeleton dsd-skeleton--card"></div><div class="dsd-skeleton dsd-skeleton--card"></div><div class="dsd-skeleton dsd-skeleton--card"></div><div class="dsd-skeleton dsd-skeleton--card"></div></div></div>`,
  simple: `<div class="dsd-container__skeleton" role="status" aria-label="Carregando conteúdo" aria-busy="true"><div class="dsd-skeleton dsd-skeleton--title"></div><div class="dsd-skeleton dsd-skeleton--text"></div><div class="dsd-skeleton dsd-skeleton--text-lg"></div><div class="dsd-skeleton dsd-skeleton--text-sm"></div></div>`
};

function getSkeletonTemplate(type: string) { return (SKELETON_TEMPLATES as Record<string, unknown>)[type] || SKELETON_TEMPLATES.simple; }

export function createSkeleton(container: HTMLElement, options: Record<string, unknown> = {}) {
  _validateOptions(options);
  const { type = 'dashboard' } = options;
  let _initialized = false;
  let _skeletonEl: Element | null = null;
  let _contentEl: HTMLElement | null = null;

  const skeleton = {
    init() {
      if (_initialized) return this;
      _contentEl = container.querySelector('.dsd-container__content');
      _initialized = true;
      return this;
    },
    show(skeletonType = type) {
      if (!_contentEl || _skeletonEl) return this;
      const wrapper = document.createElement('div');
      wrapper.innerHTML = getSkeletonTemplate(skeletonType as string) as string;
      _skeletonEl = wrapper.firstElementChild;
      _contentEl.innerHTML = '';
      // @ts-expect-error strict migration — TS2345
      _contentEl.appendChild(_skeletonEl);
      container.setAttribute('data-skeleton', 'true');
      container.setAttribute('aria-busy', 'true');
      return this;
    },
    hide() {
      if (!_skeletonEl) return this;
      _skeletonEl.remove();
      _skeletonEl = null;
      container.removeAttribute('data-skeleton');
      container.setAttribute('aria-busy', 'false');
      return this;
    },
    isVisible() { return !!_skeletonEl; },
    setType(newType: string) {
      if (!['dashboard', 'list', 'cards', 'simple'].includes(newType)) return this;
      if (_skeletonEl) { this.hide(); this.show(newType as string); }
      return this;
    },
    isInitialized() { return _initialized; },
    destroy() { this.hide(); _contentEl = null; _initialized = false; },
    healthCheck() { return { status: _initialized ? 'HEALTHY' : 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID, visible: this.isVisible(), domOnly: true, hasValidation: true }; }
  };

  return skeleton;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, domOnly: true, hasValidation: true }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, domOnly: true, hasValidation: true }; }

export default { createSkeleton, info, healthCheck, VERSION, MODULE_ID };
